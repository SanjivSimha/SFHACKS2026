import { config } from '../config';
import { authenticatedFetch } from './crs-auth';
import {
  ApplicantData,
  FraudFinderRequest,
  FraudFinderResponse,
  FraudSignal,
} from '../types';

/**
 * Normalizes a postal code to 5-digit or ZIP+4 format.
 */
function normalizePostalCode(zip: string): string {
  const digits = zip.replace(/\D/g, '');
  if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  if (digits.length >= 5) {
    return digits.slice(0, 5);
  }
  return zip;
}

/**
 * Determines risk level from the AtData risk score (0-100 scale).
 * AtData returns scores 0-100, where higher = riskier.
 * We normalize to 0-10 for our internal fraud engine.
 */
function riskLevelFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

/**
 * Normalizes AtData risk score (0-100) to our internal 0-10 scale.
 */
function normalizeRiskScore(atdataScore: number): number {
  return Math.round(atdataScore / 10);
}

/**
 * Extracts key fraud signals from the raw FraudFinder/AtData response.
 * The actual API response uses snake_case (e.g. email_validation, risk.postal).
 */
function extractFraudSignals(raw: any): FraudSignal[] {
  const signals: FraudSignal[] = [];

  // Email validation signals
  const emailValid = raw.email_validation || raw.emailValidation || raw.EmailValidation || {};
  if (emailValid.status === 'invalid' || emailValid.valid === false || emailValid.Valid === false) {
    signals.push({
      type: 'email_invalid',
      description: `Email address status: ${emailValid.status || 'invalid'} (code: ${emailValid.status_code || 'unknown'})`,
      source: 'FraudFinder',
      severity: 'warning',
    });
  }

  const domainType = emailValid.domain_type || emailValid.domainType;
  if (domainType === 'disposable' || domainType === 'temporary') {
    signals.push({
      type: 'email_domain_risk',
      description: `Email uses a ${domainType} domain`,
      source: 'FraudFinder',
      severity: 'danger',
    });
  }

  // Risk postal signals (address verification)
  const riskPostal = raw.risk?.postal || {};
  if (riskPostal.deliverability === 'undeliverable') {
    signals.push({
      type: 'address_undeliverable',
      description: `Address is undeliverable: ${riskPostal.deliverability_substatus || 'unknown reason'}`,
      source: 'FraudFinder',
      severity: 'danger',
    });
  }

  // Name match signals
  if (riskPostal.first_name_match === 'no_match' || riskPostal.last_name_match === 'no_match') {
    signals.push({
      type: 'name_address_mismatch',
      description: 'Name does not match postal records at this address',
      source: 'FraudFinder',
      severity: 'warning',
    });
  }

  // Phone-based signals (legacy format compatibility)
  const phone = raw.phoneVerification || raw.PhoneVerification || {};
  if (phone.prepaid === true || phone.Prepaid === true) {
    signals.push({
      type: 'prepaid_phone',
      description: 'Phone number is associated with a prepaid carrier',
      source: 'FraudFinder',
      severity: 'warning',
    });
  }
  if (phone.ownerMatch === false || phone.OwnerMatch === false) {
    signals.push({
      type: 'phone_owner_mismatch',
      description: 'Phone number owner does not match applicant name',
      source: 'FraudFinder',
      severity: 'warning',
    });
  }

  // IP-based signals (legacy format compatibility)
  const ip = raw.ipAnalysis || raw.IPAnalysis || {};
  if (ip.proxy === true || ip.Proxy === true || ip.vpn === true || ip.VPN === true) {
    signals.push({
      type: 'ip_proxy_vpn',
      description: 'IP address is associated with a proxy or VPN',
      source: 'FraudFinder',
      severity: 'danger',
    });
  }

  return signals;
}

/**
 * Maps ApplicantData to the FraudFinder request format and calls the FraudFinder API.
 * Email is required; name, phone, IP, and address are included when available.
 * 
 * The actual AtData/FraudFinder API response uses snake_case keys and returns:
 * - risk.score (0-100 scale)
 * - email_validation (email status)
 * - eam/dam (email/domain age metrics)
 * - risk.postal (address verification)
 */
export async function checkFraud(applicantData: ApplicantData): Promise<FraudFinderResponse> {
  const { baseUrl } = config.crs;

  if (!applicantData.email) {
    throw new Error('Email is required for FraudFinder verification');
  }

  const requestBody: FraudFinderRequest = {
    email: applicantData.email,
  };

  if (applicantData.firstName) {
    requestBody.firstName = applicantData.firstName;
  }

  if (applicantData.lastName) {
    requestBody.lastName = applicantData.lastName;
  }

  if (applicantData.phone) {
    requestBody.phoneNumber = applicantData.phone;
  }

  if (applicantData.ipAddress) {
    requestBody.ipAddress = applicantData.ipAddress;
  }

  // Include address if any address fields are provided
  if (applicantData.address1 || applicantData.city || applicantData.state || applicantData.zip) {
    requestBody.address = {};

    if (applicantData.address1) {
      requestBody.address.addressLine1 = applicantData.address1;
    }
    if (applicantData.city) {
      requestBody.address.city = applicantData.city;
    }
    if (applicantData.state) {
      requestBody.address.state = applicantData.state;
    }
    if (applicantData.zip) {
      requestBody.address.postalCode = normalizePostalCode(applicantData.zip);
    }
  }

  try {
    console.log('[FraudFinder] Calling API for:', applicantData.email);
    const response = await authenticatedFetch(`${baseUrl}/fraud-finder/fraud-finder`, {
      method: 'POST',
      data: requestBody,
    });

    const raw = response.data;
    console.log('[FraudFinder] Raw response:', JSON.stringify(raw, null, 2));

    // AtData returns risk.score on a 0-100 scale
    // We normalize to 0-10 for our internal fraud engine
    const atdataRiskScore: number = raw.risk?.score ?? raw.riskScore ?? raw.RiskScore ?? 0;
    const riskScore = normalizeRiskScore(atdataRiskScore);
    const riskLevel = riskLevelFromScore(atdataRiskScore);

    console.log(`[FraudFinder] AtData score: ${atdataRiskScore}/100 → normalized: ${riskScore}/10, level: ${riskLevel}`);

    // Extract email validation data from the actual AtData format
    const rawEmail = raw.email_validation || raw.emailValidation || raw.EmailValidation || {};
    const eam = raw.eam || {}; // Email Age Metrics
    const dam = raw.dam || {}; // Domain Age Metrics

    const emailValidation: FraudFinderResponse['emailValidation'] = {
      valid: rawEmail.status === 'valid' || rawEmail.valid === true || rawEmail.Valid === true,
      domainAge: dam.longevity ?? rawEmail.domainAge ?? rawEmail.DomainAge,
      velocity: eam.velocity ?? rawEmail.velocity ?? rawEmail.Velocity,
      popularity: eam.popularity ?? rawEmail.popularity ?? rawEmail.Popularity,
      longevity: eam.longevity ?? rawEmail.longevity ?? rawEmail.Longevity,
      domainRisk: raw.risk?.domain?.domain_risk_score !== undefined
        ? (raw.risk.domain.domain_risk_score > 50 ? 'high' : raw.risk.domain.domain_risk_score > 20 ? 'medium' : 'low')
        : rawEmail.domainRisk ?? rawEmail.DomainRisk,
    };

    // Phone verification (may not always be present in AtData response)
    let phoneVerification: FraudFinderResponse['phoneVerification'];
    const rawPhone = raw.phoneVerification || raw.PhoneVerification || raw.phone;
    if (rawPhone) {
      phoneVerification = {
        lineType: rawPhone.lineType ?? rawPhone.LineType ?? rawPhone.line_type,
        carrier: rawPhone.carrier ?? rawPhone.Carrier,
        prepaid: rawPhone.prepaid ?? rawPhone.Prepaid,
        ownerMatch: rawPhone.ownerMatch ?? rawPhone.OwnerMatch ?? rawPhone.owner_match,
        ownerName: rawPhone.ownerName ?? rawPhone.OwnerName ?? rawPhone.owner_name,
      };
    }

    // IP analysis (may not always be present)
    let ipAnalysis: FraudFinderResponse['ipAnalysis'];
    const rawIP = raw.ipAnalysis || raw.IPAnalysis || raw.ip;
    if (rawIP) {
      ipAnalysis = {
        country: rawIP.country ?? rawIP.Country,
        region: rawIP.region ?? rawIP.Region,
        city: rawIP.city ?? rawIP.City,
        proxy: rawIP.proxy ?? rawIP.Proxy,
        vpn: rawIP.vpn ?? rawIP.VPN,
        routingType: rawIP.routingType ?? rawIP.RoutingType ?? rawIP.routing_type,
      };
    }

    // Address deliverability from AtData risk.postal
    let addressDeliverability: FraudFinderResponse['addressDeliverability'];
    const rawPostal = raw.risk?.postal || raw.addressDeliverability || raw.AddressDeliverability;
    if (rawPostal) {
      addressDeliverability = {
        deliverable: rawPostal.deliverability === 'deliverable' || rawPostal.deliverable === true,
        type: rawPostal.deliverability_substatus ?? rawPostal.type ?? rawPostal.Type,
      };
    }

    const fraudResponse: FraudFinderResponse = {
      riskScore,
      riskLevel,
      emailValidation,
      phoneVerification,
      ipAnalysis,
      addressDeliverability,
      rawResponse: raw,
    };

    console.log('[FraudFinder] ✅ Check completed successfully');
    return fraudResponse;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      const message = responseData?.messages?.[0] || responseData?.error?.message || responseData?.message || error.message;
      const details = responseData?.details?.[0] || '';
      const codes = responseData?.codes?.[0] || '';

      console.error(`[FraudFinder] ❌ API error (HTTP ${status}):`, JSON.stringify(responseData));

      if (status === 400) {
        throw new Error(`FraudFinder validation error: ${message}${details ? ` - ${details}` : ''}${codes ? ` [${codes}]` : ''}`);
      }
      if (status === 401) {
        throw new Error(`FraudFinder authentication error: ${message}`);
      }
      if (status >= 500) {
        throw new Error(`FraudFinder server error (HTTP ${status}): ${message}`);
      }
      throw new Error(`FraudFinder request failed (HTTP ${status}): ${message}`);
    }
    console.error('[FraudFinder] ❌ Network error:', error.message);
    throw new Error(`FraudFinder request failed: ${error.message}`);
  }
}

export { extractFraudSignals };
