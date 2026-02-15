import { config } from '../config';
import { authenticatedFetch } from './crs-auth';
import {
  ApplicantData,
  FlexIDRequest,
  FlexIDResponse,
  RiskIndicator,
  VerifiedElementSummary,
} from '../types';

/**
 * Strips dashes and non-digit characters from an SSN, returning digits only.
 */
function sanitizeSSN(ssn: string): string {
  return ssn.replace(/\D/g, '');
}

/**
 * Ensures date is in YYYY-MM-DD format.
 * Accepts common date formats and normalizes them.
 */
function normalizeDOB(dob: string): string {
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return dob;
  }
  // Try parsing MM/DD/YYYY or MM-DD-YYYY
  const parts = dob.split(/[\/\-]/);
  if (parts.length === 3) {
    const [month, day, year] = parts;
    if (year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  // Fallback: return original and let the API reject if invalid
  return dob;
}

/**
 * Maps ApplicantData to the FlexID request format and calls the FlexID API.
 * Returns a structured FlexIDResponse with CVI score, risk indicators, and verification summary.
 *
 * NOTE: The LexisNexis sandbox may return empty responses for certain test data.
 * When this happens, we return a default response with a moderate CVI score
 * so the fraud engine can still function using other signals.
 */
export async function verifyIdentity(applicantData: ApplicantData): Promise<FlexIDResponse> {
  const { baseUrl } = config.crs;

  const requestBody: FlexIDRequest = {
    firstName: applicantData.firstName,
    lastName: applicantData.lastName,
    includeAllRiskIndicators: true,
    includeVerifiedElementSummary: true,
    includeSSNVerification: true,
    includeEmailVerification: true,
  };

  if (applicantData.ssn) {
    requestBody.ssn = sanitizeSSN(applicantData.ssn);
  }

  if (applicantData.dateOfBirth) {
    requestBody.dateOfBirth = normalizeDOB(applicantData.dateOfBirth);
  }

  if (applicantData.address1) {
    requestBody.streetAddress1 = applicantData.address1;
  }

  if (applicantData.city) {
    requestBody.city = applicantData.city;
  }

  if (applicantData.state) {
    requestBody.state = applicantData.state;
  }

  if (applicantData.zip) {
    requestBody.zipCode = applicantData.zip;
  }

  if (applicantData.phone) {
    requestBody.homePhone = applicantData.phone;
  }

  if (applicantData.email) {
    requestBody.email = applicantData.email;
  }

  if (applicantData.driverLicenseNumber) {
    requestBody.driverLicenseNumber = applicantData.driverLicenseNumber;
    requestBody.includeDLVerification = true;
  }

  if (applicantData.driverLicenseState) {
    requestBody.driverLicenseState = applicantData.driverLicenseState;
  }

  if (applicantData.ipAddress) {
    requestBody.ipAddress = applicantData.ipAddress;
  }

  try {
    console.log('[FlexID] Calling API for:', applicantData.firstName, applicantData.lastName);
    const response = await authenticatedFetch(`${baseUrl}/flex-id/flex-id`, {
      method: 'POST',
      data: requestBody,
    });

    const raw = response.data;
    console.log('[FlexID] Raw response:', JSON.stringify(raw, null, 2));

    // Extract risk indicators from the raw response
    const riskIndicators: RiskIndicator[] = (raw.riskIndicators || raw.RiskIndicators || []).map(
      (ri: any) => ({
        code: ri.code || ri.Code || '',
        description: ri.description || ri.Description || '',
        riskLevel: ri.riskLevel || ri.RiskLevel || 'unknown',
      }),
    );

    // Extract verified element summary
    let verifiedElementSummary: VerifiedElementSummary | undefined;
    const ves = raw.verifiedElementSummary || raw.VerifiedElementSummary;
    if (ves) {
      verifiedElementSummary = {
        name: !!ves.name || !!ves.Name,
        address: !!ves.address || !!ves.Address,
        ssn: !!ves.ssn || !!ves.SSN,
        dob: !!ves.dob || !!ves.DOB || !!ves.dateOfBirth,
        phone: !!ves.phone || !!ves.Phone,
        email: !!ves.email || !!ves.Email,
      };
    }

    // Extract SSN verification
    let ssnVerification: FlexIDResponse['ssnVerification'];
    const ssnV = raw.ssnVerification || raw.SSNVerification;
    if (ssnV) {
      ssnVerification = {
        valid: !!ssnV.valid || !!ssnV.Valid,
        issuedStartDate: ssnV.issuedStartDate || ssnV.IssuedStartDate,
        issuedEndDate: ssnV.issuedEndDate || ssnV.IssuedEndDate,
      };
    }

    // Extract email verification
    let emailVerification: FlexIDResponse['emailVerification'];
    const emailV = raw.emailVerification || raw.EmailVerification;
    if (emailV) {
      emailVerification = {
        valid: !!emailV.valid || !!emailV.Valid,
      };
    }

    const flexIDResponse: FlexIDResponse = {
      cviScore: raw.cviScore ?? raw.CVIScore ?? raw.cvi ?? 0,
      riskIndicators,
      verifiedElementSummary,
      ssnVerification,
      emailVerification,
      rawResponse: raw,
    };

    console.log(`[FlexID] ✅ Completed - CVI Score: ${flexIDResponse.cviScore}, Risk Indicators: ${riskIndicators.length}`);
    return flexIDResponse;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      const messages = responseData?.messages || [];
      const details = responseData?.details || [];
      const codes = responseData?.codes || [];
      const message = messages[0] || responseData?.error?.message || responseData?.message || error.message;
      const detail = details[0] || '';

      console.error(`[FlexID] ❌ API error (HTTP ${status}):`, JSON.stringify(responseData));

      // Handle LexisNexis sandbox returning empty responses (CRS779)
      // This is a known sandbox limitation - return a default moderate identity score
      if (codes.includes('CRS779') && detail?.includes('empty response')) {
        console.warn('[FlexID] ⚠️ LexisNexis sandbox returned empty response. Using default identity score.');
        return {
          cviScore: 30, // Moderate score - not too risky, not fully verified
          riskIndicators: [{
            code: 'SANDBOX',
            description: 'LexisNexis sandbox returned no data - using default moderate score',
            riskLevel: 'medium',
          }],
          verifiedElementSummary: undefined,
          ssnVerification: undefined,
          emailVerification: undefined,
          rawResponse: { sandboxFallback: true, originalError: responseData },
        };
      }

      if (status === 400) {
        throw new Error(`FlexID validation error: ${message}${detail ? ` - ${detail}` : ''}`);
      }
      if (status === 401) {
        throw new Error(`FlexID authentication error: ${message}`);
      }
      if (status >= 500) {
        throw new Error(`FlexID server error (HTTP ${status}): ${message}`);
      }
      throw new Error(`FlexID request failed (HTTP ${status}): ${message}`);
    }
    console.error('[FlexID] ❌ Network error:', error.message);
    throw new Error(`FlexID request failed: ${error.message}`);
  }
}
