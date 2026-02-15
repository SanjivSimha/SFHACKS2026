import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApplicantData } from '../types';
import { verifyIdentity } from '../services/flexid';
import { checkFraud, extractFraudSignals } from '../services/fraud-finder';
import { pullCreditReport } from '../services/credit';
import { checkCriminal, getCriminalResults } from '../services/criminal';
import { checkEviction, getEvictionResults } from '../services/eviction';
import { assessApplication } from '../services/fraud-engine';

const router = Router();
const prisma = new PrismaClient();

// All screening routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps a Prisma Application row to the ApplicantData format consumed by the
 * CRS service wrappers.
 */
function toApplicantData(app: any): ApplicantData {
  return {
    firstName: app.applicantFirstName,
    lastName: app.applicantLastName,
    email: app.applicantEmail,
    phone: app.applicantPhone || undefined,
    ssn: app.applicantSSN || undefined,
    dateOfBirth: app.applicantDOB ? app.applicantDOB.toISOString().split('T')[0] : undefined,
    address1: app.applicantAddress1 || undefined,
    address2: app.applicantAddress2 || undefined,
    city: app.applicantCity || undefined,
    state: app.applicantState || undefined,
    zip: app.applicantZip || undefined,
    ipAddress: app.ipAddress || undefined,
  };
}

// ---------------------------------------------------------------------------
// POST /:applicationId/run - Full screening pipeline
// ---------------------------------------------------------------------------
router.post('/:applicationId/run', async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Screening] 🚀 Starting screening pipeline for application: ${applicationId}`);
    console.log(`${'='.repeat(60)}`);

    // 1. Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    console.log(`[Screening] Applicant: ${application.applicantFirstName} ${application.applicantLastName} (${application.applicantEmail})`);
    console.log(`[Screening] Program: ${application.programType}, Amount: $${application.requestedAmount}`);

    // Mark as screening
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'SCREENING' },
    });

    const applicant = toApplicantData(application);
    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    // 2. FlexID identity verification
    console.log('\n[Screening] Step 1/4: Identity Verification (FlexID)...');
    try {
      const identityResponse = await verifyIdentity(applicant);
      const riskLevel = identityResponse.cviScore >= 40 ? 'low' : identityResponse.cviScore >= 20 ? 'medium' : 'high';
      const sr = await prisma.screeningResult.create({
        data: {
          applicationId,
          type: 'IDENTITY',
          status: 'COMPLETED',
          rawResponse: identityResponse as any,
          score: identityResponse.cviScore,
          riskLevel,
          flags: identityResponse.riskIndicators as any,
        },
      });
      results.identity = sr;
      console.log(`[Screening] ✅ Identity: CVI=${identityResponse.cviScore}, risk=${riskLevel}`);
    } catch (err: any) {
      console.error('[Screening] ❌ Identity check failed:', err.message);
      errors.identity = err.message;
      await prisma.screeningResult.create({
        data: {
          applicationId,
          type: 'IDENTITY',
          status: 'ERROR',
          rawResponse: { error: err.message } as any,
        },
      });
    }

    // 3. FraudFinder fraud check
    console.log('\n[Screening] Step 2/4: Fraud Analysis (FraudFinder)...');
    try {
      const fraudResponse = await checkFraud(applicant);
      const fraudSignals = extractFraudSignals(fraudResponse.rawResponse);
      const sr = await prisma.screeningResult.create({
        data: {
          applicationId,
          type: 'FRAUD',
          status: 'COMPLETED',
          rawResponse: fraudResponse as any,
          score: fraudResponse.riskScore,
          riskLevel: fraudResponse.riskLevel,
          flags: fraudSignals as any,
        },
      });
      results.fraud = sr;
      console.log(`[Screening] ✅ Fraud: score=${fraudResponse.riskScore}/10, risk=${fraudResponse.riskLevel}, signals=${fraudSignals.length}`);
    } catch (err: any) {
      console.error('[Screening] ❌ Fraud check failed:', err.message);
      errors.fraud = err.message;
      await prisma.screeningResult.create({
        data: {
          applicationId,
          type: 'FRAUD',
          status: 'ERROR',
          rawResponse: { error: err.message } as any,
        },
      });
    }

    // 4. Credit report (only for high-value grants > $10,000)
    const requestedAmount = application.requestedAmount ?? 0;
    if (requestedAmount > 10000) {
      console.log('\n[Screening] Step 3/4: Credit Report (Experian)...');
      try {
        const creditResponse = await pullCreditReport(applicant);
        const primaryScore = creditResponse.scores?.[0]?.value ?? null;
        const sr = await prisma.screeningResult.create({
          data: {
            applicationId,
            type: 'CREDIT',
            status: 'COMPLETED',
            rawResponse: creditResponse as any,
            score: primaryScore,
            riskLevel: primaryScore
              ? primaryScore >= 700
                ? 'low'
                : primaryScore >= 600
                  ? 'medium'
                  : 'high'
              : 'unknown',
            flags: {
              totalAccounts: creditResponse.summary?.totalAccounts,
              delinquentCount: creditResponse.summary?.delinquentCount,
              publicRecords: creditResponse.publicRecords?.length ?? 0,
            } as any,
          },
        });
        results.credit = sr;
        console.log(`[Screening] ✅ Credit: score=${primaryScore}`);
      } catch (err: any) {
        console.error('[Screening] ❌ Credit check failed:', err.message);
        errors.credit = err.message;
        await prisma.screeningResult.create({
          data: {
            applicationId,
            type: 'CREDIT',
            status: 'ERROR',
            rawResponse: { error: err.message } as any,
          },
        });
      }
    } else {
      console.log(`\n[Screening] Step 3/4: Credit Report — skipped (amount $${requestedAmount} <= $10,000)`);
    }

    // 5. Run fraud engine assessment
    console.log('\n[Screening] Step 4/4: Fraud Engine Assessment...');
    let assessment: any = null;
    try {
      assessment = await assessApplication(applicationId);
      results.assessment = assessment;
      console.log(`[Screening] ✅ Assessment: score=${assessment.overallScore}/100, risk=${assessment.overallRisk}, recommendation=${assessment.recommendation}`);
    } catch (err: any) {
      console.error('[Screening] ❌ Fraud assessment failed:', err.message);
      errors.assessment = err.message;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Screening] 🏁 Pipeline complete. Errors: ${Object.keys(errors).length}`);
    console.log(`${'='.repeat(60)}\n`);

    return res.json({
      applicationId,
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      assessment,
    });
  } catch (err: any) {
    console.error('Run screening pipeline error:', err);
    return res.status(500).json({ error: 'Screening pipeline failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /:applicationId/run/:type - Run individual screening check
// ---------------------------------------------------------------------------
router.post('/:applicationId/run/:type', async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId, type } = req.params;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const applicant = toApplicantData(application);
    let screeningResult: any;

    switch (type.toLowerCase()) {
      case 'identity': {
        const response = await verifyIdentity(applicant);
        screeningResult = await prisma.screeningResult.create({
          data: {
            applicationId,
            type: 'IDENTITY',
            status: 'COMPLETED',
            rawResponse: response as any,
            score: response.cviScore,
            riskLevel: response.cviScore >= 40 ? 'low' : response.cviScore >= 20 ? 'medium' : 'high',
            flags: response.riskIndicators as any,
          },
        });
        break;
      }

      case 'fraud': {
        const response = await checkFraud(applicant);
        const signals = extractFraudSignals(response.rawResponse);
        screeningResult = await prisma.screeningResult.create({
          data: {
            applicationId,
            type: 'FRAUD',
            status: 'COMPLETED',
            rawResponse: response as any,
            score: response.riskScore,
            riskLevel: response.riskLevel,
            flags: signals as any,
          },
        });
        break;
      }

      case 'credit': {
        const response = await pullCreditReport(applicant);
        const primaryScore = response.scores?.[0]?.value ?? null;
        screeningResult = await prisma.screeningResult.create({
          data: {
            applicationId,
            type: 'CREDIT',
            status: 'COMPLETED',
            rawResponse: response as any,
            score: primaryScore,
            riskLevel: primaryScore
              ? primaryScore >= 700
                ? 'low'
                : primaryScore >= 600
                  ? 'medium'
                  : 'high'
              : 'unknown',
            flags: {
              totalAccounts: response.summary?.totalAccounts,
              delinquentCount: response.summary?.delinquentCount,
              publicRecords: response.publicRecords?.length ?? 0,
            } as any,
          },
        });
        break;
      }

      case 'criminal': {
        const submitResponse = await checkCriminal(applicant);
        // Create a pending result with the request ID
        screeningResult = await prisma.screeningResult.create({
          data: {
            applicationId,
            type: 'CRIMINAL',
            status: 'PENDING',
            crsRequestId: submitResponse.requestId,
            rawResponse: submitResponse.rawResponse as any,
          },
        });

        // Attempt to poll for results (may still be processing)
        try {
          const results = await getCriminalResults(submitResponse.requestId);
          const totalOffenses = results.candidates.reduce(
            (sum, c) => sum + (c.offenses?.length || 0),
            0,
          );
          screeningResult = await prisma.screeningResult.update({
            where: { id: screeningResult.id },
            data: {
              status: 'COMPLETED',
              rawResponse: results as any,
              score: totalOffenses,
              riskLevel: totalOffenses === 0 ? 'low' : totalOffenses <= 2 ? 'medium' : 'high',
              flags: results.candidates as any,
            },
          });
        } catch {
          // Results not ready yet; the pending record has the crsRequestId for later polling
        }
        break;
      }

      case 'eviction': {
        const submitResponse = await checkEviction(applicant);
        screeningResult = await prisma.screeningResult.create({
          data: {
            applicationId,
            type: 'EVICTION',
            status: 'PENDING',
            crsRequestId: submitResponse.requestId,
            rawResponse: submitResponse.rawResponse as any,
          },
        });

        // Attempt to poll for results
        try {
          const results = await getEvictionResults(submitResponse.requestId);
          const totalEvictions = results.candidates.reduce(
            (sum, c) => sum + (c.evictions?.length || 0),
            0,
          );
          screeningResult = await prisma.screeningResult.update({
            where: { id: screeningResult.id },
            data: {
              status: 'COMPLETED',
              rawResponse: results as any,
              score: totalEvictions,
              riskLevel: totalEvictions === 0 ? 'low' : totalEvictions <= 2 ? 'medium' : 'high',
              flags: results.candidates as any,
            },
          });
        } catch {
          // Results not ready yet
        }
        break;
      }

      default:
        return res.status(400).json({
          error: `Invalid screening type: ${type}. Valid types: identity, fraud, credit, criminal, eviction`,
        });
    }

    return res.json(screeningResult);
  } catch (err: any) {
    console.error(`Run ${req.params.type} screening error:`, err);
    return res.status(500).json({ error: `Failed to run ${req.params.type} screening: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// GET /:applicationId/results - Get all screening results for an application
// ---------------------------------------------------------------------------
router.get('/:applicationId/results', async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const results = await prisma.screeningResult.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(results);
  } catch (err: any) {
    console.error('Get screening results error:', err);
    return res.status(500).json({ error: 'Failed to get screening results' });
  }
});

// ---------------------------------------------------------------------------
// GET /:applicationId/pdf - Generate a PDF screening report
// ---------------------------------------------------------------------------
router.get('/:applicationId/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        screeningResults: { orderBy: { createdAt: 'desc' } },
        fraudDecision: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="screening-report-${applicationId}.pdf"`,
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('GrantShield Screening Report', { align: 'center' });
    doc.moveDown();

    // Application details
    doc.fontSize(14).text('Application Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Application ID: ${application.id}`);
    doc.text(`Program: ${application.programType}`);
    doc.text(`Status: ${application.status}`);
    doc.text(`Applicant: ${application.applicantFirstName} ${application.applicantLastName}`);
    doc.text(`Email: ${application.applicantEmail}`);
    if (application.applicantPhone) doc.text(`Phone: ${application.applicantPhone}`);
    if (application.applicantAddress1) {
      doc.text(
        `Address: ${application.applicantAddress1}${application.applicantAddress2 ? ' ' + application.applicantAddress2 : ''}, ${application.applicantCity || ''}, ${application.applicantState || ''} ${application.applicantZip || ''}`,
      );
    }
    if (application.requestedAmount) {
      doc.text(`Requested Amount: $${application.requestedAmount.toLocaleString()}`);
    }
    doc.text(`Submitted: ${application.createdAt.toISOString().split('T')[0]}`);
    doc.moveDown();

    // Fraud Decision
    if (application.fraudDecision) {
      const fd = application.fraudDecision;
      doc.fontSize(14).text('Fraud Assessment', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Overall Score: ${fd.overallScore}/100`);
      doc.text(`Risk Level: ${fd.overallRisk}`);
      doc.text(`Recommendation: ${fd.recommendation}`);
      if (fd.overriddenBy) {
        doc.text(`Override By: ${fd.overriddenBy}`);
        doc.text(`Override Reason: ${fd.overrideReason || 'N/A'}`);
      }
      doc.moveDown(0.5);

      // Factors
      const factors = (fd.factors as any[]) || [];
      if (factors.length > 0) {
        doc.fontSize(12).text('Risk Factors:', { underline: true });
        doc.fontSize(10);
        for (const f of factors) {
          doc.text(`  [${f.severity}] ${f.category}: ${f.description} (impact: ${f.impact})`);
        }
        doc.moveDown(0.5);
      }

      // Signals
      const signals = (fd.signals as any[]) || [];
      if (signals.length > 0) {
        doc.fontSize(12).text('Fraud Signals:', { underline: true });
        doc.fontSize(10);
        for (const s of signals) {
          doc.text(`  [${s.severity}] ${s.type}: ${s.description} (source: ${s.source})`);
        }
        doc.moveDown(0.5);
      }
    }
    doc.moveDown();

    // Screening Results
    doc.fontSize(14).text('Screening Results', { underline: true });
    doc.moveDown(0.5);

    for (const sr of application.screeningResults) {
      doc.fontSize(11).text(`${sr.type} Check`, { underline: true });
      doc.fontSize(10);
      doc.text(`  Status: ${sr.status}`);
      if (sr.score !== null) doc.text(`  Score: ${sr.score}`);
      if (sr.riskLevel) doc.text(`  Risk Level: ${sr.riskLevel}`);
      doc.text(`  Date: ${sr.createdAt.toISOString().split('T')[0]}`);
      doc.moveDown(0.5);
    }

    // Footer
    doc.moveDown();
    doc.fontSize(8).text(
      `Generated by GrantShield on ${new Date().toISOString()} | Confidential`,
      { align: 'center' },
    );

    doc.end();
  } catch (err: any) {
    console.error('Generate PDF error:', err);
    return res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

export default router;
