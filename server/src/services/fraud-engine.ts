import { PrismaClient } from '@prisma/client';
import {
  FraudAssessment,
  FraudFactor,
  FraudSignal,
  FlexIDResponse,
  FraudFinderResponse,
  CreditReportResponse,
} from '../types';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Weight constants
// ---------------------------------------------------------------------------
const WEIGHT_IDENTITY = 0.35;
const WEIGHT_FRAUD = 0.35;
const WEIGHT_CREDIT = 0.15;
const WEIGHT_DUPLICATE = 0.15;

// ---------------------------------------------------------------------------
// Threshold constants
// ---------------------------------------------------------------------------
const THRESHOLD_APPROVE = 25;
const THRESHOLD_REVIEW = 55;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function riskFromScore(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 25) return 'low';
  if (score <= 55) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

function recommendationFromScore(score: number): 'APPROVE' | 'REVIEW' | 'DENY' {
  if (score <= THRESHOLD_APPROVE) return 'APPROVE';
  if (score <= THRESHOLD_REVIEW) return 'REVIEW';
  return 'DENY';
}

function severityFromImpact(impact: number): 'low' | 'medium' | 'high' | 'critical' {
  if (impact <= 5) return 'low';
  if (impact <= 15) return 'medium';
  if (impact <= 30) return 'high';
  return 'critical';
}

// ---------------------------------------------------------------------------
// Identity scoring (FlexID CVI) - 35% weight
// ---------------------------------------------------------------------------

function scoreIdentity(
  identityResult: any | null,
): { raw: number; factors: FraudFactor[]; signals: FraudSignal[] } {
  const factors: FraudFactor[] = [];
  const signals: FraudSignal[] = [];

  if (!identityResult) {
    factors.push({
      category: 'identity',
      description: 'Identity verification was not performed',
      impact: 15,
      severity: 'medium',
    });
    return { raw: 15, factors, signals };
  }

  let raw = 0;

  const data = identityResult as FlexIDResponse;
  const cvi = data.cviScore ?? 0;

  // CVI scoring bands
  if (cvi >= 40) {
    // 0 points - strong identity
  } else if (cvi >= 30) {
    raw += 10;
    factors.push({
      category: 'identity',
      description: `CVI score is moderate (${cvi})`,
      impact: 10,
      severity: 'low',
    });
  } else if (cvi >= 20) {
    raw += 25;
    factors.push({
      category: 'identity',
      description: `CVI score is weak (${cvi})`,
      impact: 25,
      severity: 'medium',
    });
  } else {
    raw += 35;
    factors.push({
      category: 'identity',
      description: `CVI score is very low (${cvi})`,
      impact: 35,
      severity: 'high',
    });
    signals.push({
      type: 'low_cvi',
      description: `Identity confidence score is critically low (${cvi}/100)`,
      source: 'FlexID',
      severity: 'critical',
    });
  }

  // Risk indicators: +5 each
  const riskIndicators = data.riskIndicators || [];
  for (const ri of riskIndicators) {
    raw += 5;
    factors.push({
      category: 'identity',
      description: `Risk indicator: ${ri.description || ri.code}`,
      impact: 5,
      severity: 'low',
    });
    signals.push({
      type: 'identity_risk_indicator',
      description: ri.description || `Risk indicator code ${ri.code}`,
      source: 'FlexID',
      severity: 'warning',
    });
  }

  return { raw, factors, signals };
}

// ---------------------------------------------------------------------------
// Fraud scoring (FraudFinder) - 35% weight
// ---------------------------------------------------------------------------

function scoreFraud(
  fraudResult: any | null,
): { raw: number; factors: FraudFactor[]; signals: FraudSignal[] } {
  const factors: FraudFactor[] = [];
  const signals: FraudSignal[] = [];

  if (!fraudResult) {
    factors.push({
      category: 'fraud',
      description: 'Fraud check was not performed',
      impact: 15,
      severity: 'medium',
    });
    return { raw: 15, factors, signals };
  }

  let raw = 0;

  const data = fraudResult as FraudFinderResponse;
  const score = data.riskScore ?? 0;

  // Risk score bands (0-10 scale)
  if (score <= 2) {
    // 0 points - low risk
  } else if (score <= 5) {
    raw += 15;
    factors.push({
      category: 'fraud',
      description: `Fraud risk score is moderate (${score}/10)`,
      impact: 15,
      severity: 'medium',
    });
  } else if (score <= 8) {
    raw += 25;
    factors.push({
      category: 'fraud',
      description: `Fraud risk score is elevated (${score}/10)`,
      impact: 25,
      severity: 'high',
    });
  } else {
    raw += 35;
    factors.push({
      category: 'fraud',
      description: `Fraud risk score is very high (${score}/10)`,
      impact: 35,
      severity: 'critical',
    });
    signals.push({
      type: 'high_fraud_score',
      description: `Fraud risk score is critically high (${score}/10)`,
      source: 'FraudFinder',
      severity: 'critical',
    });
  }

  // Prepaid phone: +5
  if (data.phoneVerification?.prepaid) {
    raw += 5;
    factors.push({
      category: 'fraud',
      description: 'Phone number is prepaid',
      impact: 5,
      severity: 'low',
    });
    signals.push({
      type: 'prepaid_phone',
      description: 'Applicant is using a prepaid phone number',
      source: 'FraudFinder',
      severity: 'warning',
    });
  }

  // VPN / proxy: +10
  if (data.ipAnalysis?.vpn || data.ipAnalysis?.proxy) {
    raw += 10;
    factors.push({
      category: 'fraud',
      description: 'IP address associated with VPN or proxy',
      impact: 10,
      severity: 'medium',
    });
    signals.push({
      type: 'vpn_proxy',
      description: 'Application submitted from a VPN or proxy IP address',
      source: 'FraudFinder',
      severity: 'danger',
    });
  }

  // Email age < 30 days: +5
  const emailAge = data.emailValidation?.domainAge;
  if (emailAge !== undefined && emailAge < 30) {
    raw += 5;
    factors.push({
      category: 'fraud',
      description: `Email domain age is very young (${emailAge} days)`,
      impact: 5,
      severity: 'low',
    });
    signals.push({
      type: 'young_email',
      description: `Email domain was registered only ${emailAge} days ago`,
      source: 'FraudFinder',
      severity: 'warning',
    });
  }

  // Phone owner mismatch: +5
  if (data.phoneVerification?.ownerMatch === false) {
    raw += 5;
    factors.push({
      category: 'fraud',
      description: 'Phone number owner does not match applicant',
      impact: 5,
      severity: 'low',
    });
    signals.push({
      type: 'phone_mismatch',
      description: 'Phone number is registered to a different person',
      source: 'FraudFinder',
      severity: 'warning',
    });
  }

  return { raw, factors, signals };
}

// ---------------------------------------------------------------------------
// Credit scoring - 15% weight (optional)
// ---------------------------------------------------------------------------

function scoreCredit(
  creditResult: any | null,
): { raw: number; factors: FraudFactor[]; signals: FraudSignal[] } {
  const factors: FraudFactor[] = [];
  const signals: FraudSignal[] = [];

  if (!creditResult) {
    // Credit not pulled is acceptable; contribute 0 raw points
    return { raw: 0, factors, signals };
  }

  let raw = 0;

  const data = creditResult as CreditReportResponse;

  // No credit file on record: +10
  if (!data.scores || data.scores.length === 0) {
    raw += 10;
    factors.push({
      category: 'credit',
      description: 'No credit file found for applicant',
      impact: 10,
      severity: 'medium',
    });
    signals.push({
      type: 'no_credit_file',
      description: 'Applicant has no credit file on record',
      source: 'CreditBureau',
      severity: 'warning',
    });
  }

  // Bankruptcy records: +5 each
  const publicRecords = data.publicRecords || [];
  const bankruptcies = publicRecords.filter((pr: any) => {
    const desc = (pr.description || pr.type || pr.publicRecordType || '').toLowerCase();
    return desc.includes('bankrupt');
  });
  if (bankruptcies.length > 0) {
    const impact = bankruptcies.length * 5;
    raw += impact;
    factors.push({
      category: 'credit',
      description: `${bankruptcies.length} bankruptcy record(s) found`,
      impact,
      severity: bankruptcies.length > 1 ? 'high' : 'medium',
    });
    signals.push({
      type: 'bankruptcy',
      description: `Applicant has ${bankruptcies.length} bankruptcy record(s)`,
      source: 'CreditBureau',
      severity: 'danger',
    });
  }

  // Address changes > 3: +5
  const addressChanges = data.summary?.recentAddressChanges ?? 0;
  if (addressChanges > 3) {
    raw += 5;
    factors.push({
      category: 'credit',
      description: `High number of recent address changes (${addressChanges})`,
      impact: 5,
      severity: 'low',
    });
    signals.push({
      type: 'frequent_address_changes',
      description: `Applicant has ${addressChanges} recent address changes`,
      source: 'CreditBureau',
      severity: 'warning',
    });
  }

  return { raw, factors, signals };
}

// ---------------------------------------------------------------------------
// Duplicate detection - 15% weight
// ---------------------------------------------------------------------------

async function scoreDuplicates(
  applicationId: string,
  application: any,
): Promise<{ raw: number; factors: FraudFactor[]; signals: FraudSignal[] }> {
  const factors: FraudFactor[] = [];
  const signals: FraudSignal[] = [];
  let raw = 0;

  // Look for other applications (not the current one) that share identity markers
  const otherApps = await prisma.application.findMany({
    where: {
      id: { not: applicationId },
      status: { not: 'ARCHIVED' },
    },
    select: {
      id: true,
      applicantFirstName: true,
      applicantLastName: true,
      applicantEmail: true,
      applicantPhone: true,
      applicantSSN: true,
      applicantAddress1: true,
    },
  });

  // Same SSN but different name: +50
  if (application.applicantSSN) {
    const ssnMatches = otherApps.filter(
      (a) =>
        a.applicantSSN === application.applicantSSN &&
        (a.applicantFirstName?.toLowerCase() !== application.applicantFirstName?.toLowerCase() ||
          a.applicantLastName?.toLowerCase() !== application.applicantLastName?.toLowerCase()),
    );
    if (ssnMatches.length > 0) {
      raw += 50;
      factors.push({
        category: 'duplicate',
        description: `SSN matches ${ssnMatches.length} other application(s) with a different name`,
        impact: 50,
        severity: 'critical',
      });
      signals.push({
        type: 'ssn_name_mismatch',
        description: 'Same SSN used with different names across applications',
        source: 'DuplicateDetection',
        severity: 'critical',
      });
    }
  }

  // Same address: +20
  if (application.applicantAddress1) {
    const addrNorm = application.applicantAddress1.toLowerCase().trim();
    const addrMatches = otherApps.filter(
      (a) => a.applicantAddress1 && a.applicantAddress1.toLowerCase().trim() === addrNorm,
    );
    if (addrMatches.length > 0) {
      raw += 20;
      factors.push({
        category: 'duplicate',
        description: `Address matches ${addrMatches.length} other application(s)`,
        impact: 20,
        severity: 'high',
      });
      signals.push({
        type: 'duplicate_address',
        description: 'Same address found on another application',
        source: 'DuplicateDetection',
        severity: 'danger',
      });
    }
  }

  // Same email: +15
  if (application.applicantEmail) {
    const emailNorm = application.applicantEmail.toLowerCase().trim();
    const emailMatches = otherApps.filter(
      (a) => a.applicantEmail && a.applicantEmail.toLowerCase().trim() === emailNorm,
    );
    if (emailMatches.length > 0) {
      raw += 15;
      factors.push({
        category: 'duplicate',
        description: `Email matches ${emailMatches.length} other application(s)`,
        impact: 15,
        severity: 'medium',
      });
      signals.push({
        type: 'duplicate_email',
        description: 'Same email address found on another application',
        source: 'DuplicateDetection',
        severity: 'warning',
      });
    }
  }

  // Same phone: +10
  if (application.applicantPhone) {
    const phoneNorm = application.applicantPhone.replace(/\D/g, '');
    const phoneMatches = otherApps.filter(
      (a) => a.applicantPhone && a.applicantPhone.replace(/\D/g, '') === phoneNorm,
    );
    if (phoneMatches.length > 0) {
      raw += 10;
      factors.push({
        category: 'duplicate',
        description: `Phone matches ${phoneMatches.length} other application(s)`,
        impact: 10,
        severity: 'low',
      });
      signals.push({
        type: 'duplicate_phone',
        description: 'Same phone number found on another application',
        source: 'DuplicateDetection',
        severity: 'warning',
      });
    }
  }

  return { raw, factors, signals };
}

// ---------------------------------------------------------------------------
// Main assessment function
// ---------------------------------------------------------------------------

export async function assessApplication(applicationId: string): Promise<FraudAssessment> {
  // 1. Fetch application
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error(`Application not found: ${applicationId}`);
  }

  // 2. Fetch all screening results for this application
  const screeningResults = await prisma.screeningResult.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'desc' },
  });

  // Extract the most recent completed result for each type
  const identityResult = screeningResults.find(
    (r) => r.type === 'IDENTITY' && r.status === 'COMPLETED',
  );
  const fraudResult = screeningResults.find(
    (r) => r.type === 'FRAUD' && r.status === 'COMPLETED',
  );
  const creditResult = screeningResults.find(
    (r) => r.type === 'CREDIT' && r.status === 'COMPLETED',
  );

  // Parse raw responses
  const identityData = identityResult?.rawResponse ? (identityResult.rawResponse as any) : null;
  const fraudData = fraudResult?.rawResponse ? (fraudResult.rawResponse as any) : null;
  const creditData = creditResult?.rawResponse ? (creditResult.rawResponse as any) : null;

  // 3. Run scoring algorithm
  const identity = scoreIdentity(identityData);
  const fraud = scoreFraud(fraudData);
  const credit = scoreCredit(creditData);
  const duplicate = await scoreDuplicates(applicationId, application);

  // Calculate weighted score
  const hasCreditData = creditData !== null;
  let weightedScore: number;

  if (hasCreditData) {
    // All four components contribute
    weightedScore =
      identity.raw * WEIGHT_IDENTITY +
      fraud.raw * WEIGHT_FRAUD +
      credit.raw * WEIGHT_CREDIT +
      duplicate.raw * WEIGHT_DUPLICATE;
  } else {
    // Redistribute credit weight proportionally across other categories
    const totalOtherWeight = WEIGHT_IDENTITY + WEIGHT_FRAUD + WEIGHT_DUPLICATE;
    const identityAdj = WEIGHT_IDENTITY / totalOtherWeight;
    const fraudAdj = WEIGHT_FRAUD / totalOtherWeight;
    const duplicateAdj = WEIGHT_DUPLICATE / totalOtherWeight;

    weightedScore =
      identity.raw * identityAdj +
      fraud.raw * fraudAdj +
      duplicate.raw * duplicateAdj;
  }

  const overallScore = clamp(Math.round(weightedScore), 0, 100);
  const overallRisk = riskFromScore(overallScore);
  const recommendation = recommendationFromScore(overallScore);

  // Collect all factors and signals
  const factors: FraudFactor[] = [
    ...identity.factors,
    ...fraud.factors,
    ...credit.factors,
    ...duplicate.factors,
  ];

  const signals: FraudSignal[] = [
    ...identity.signals,
    ...fraud.signals,
    ...credit.signals,
    ...duplicate.signals,
  ];

  // 4. Create FraudDecision record (upsert so re-runs update)
  await prisma.fraudDecision.upsert({
    where: { applicationId },
    create: {
      applicationId,
      overallScore,
      overallRisk,
      recommendation: recommendation as any,
      factors: factors as any,
      signals: signals as any,
    },
    update: {
      overallScore,
      overallRisk,
      recommendation: recommendation as any,
      factors: factors as any,
      signals: signals as any,
      decidedAt: new Date(),
      overriddenBy: null,
      overrideReason: null,
    },
  });

  // 5. Update application status based on recommendation
  let newStatus: 'APPROVED' | 'REVIEWED' | 'DENIED';
  switch (recommendation) {
    case 'APPROVE':
      newStatus = 'APPROVED';
      break;
    case 'REVIEW':
      newStatus = 'REVIEWED';
      break;
    case 'DENY':
      newStatus = 'DENIED';
      break;
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: newStatus },
  });

  return {
    overallScore,
    overallRisk,
    recommendation,
    factors,
    signals,
  };
}
