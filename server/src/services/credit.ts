import { config } from '../config';
import { authenticatedFetch } from './crs-auth';
import {
  ApplicantData,
  CreditReportRequest,
  CreditReportResponse,
} from '../types';

/**
 * Strips all non-digit characters from SSN. Returns 9-digit string with NO dashes.
 */
function sanitizeSSNForCredit(ssn: string): string {
  return ssn.replace(/\D/g, '');
}

/**
 * Ensures date is in YYYY-MM-DD format for credit bureau requests.
 */
function normalizeDOB(dob: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return dob;
  }
  const parts = dob.split(/[\/\-]/);
  if (parts.length === 3) {
    const [month, day, year] = parts;
    if (year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return dob;
}

/**
 * Maps bureau name to the correct API endpoint path.
 */
function getBureauEndpoint(bureau: string): string {
  switch (bureau.toLowerCase()) {
    case 'experian':
      return '/experian/credit-profile/credit-report/standard/exp-prequal-vantage4';
    default:
      throw new Error(`Unsupported credit bureau: ${bureau}. Currently only 'experian' is supported.`);
  }
}

/**
 * Pulls a credit report for the applicant from the specified bureau.
 * Defaults to Experian. This should only be used for high-value grants (>$10,000).
 *
 * SSN must be 9 digits with no dashes. DOB must be YYYY-MM-DD.
 * Address data is structured as an array with borrowerResidencyType.
 */
export async function pullCreditReport(
  applicantData: ApplicantData,
  bureau: string = 'experian',
): Promise<CreditReportResponse> {
  const { baseUrl } = config.crs;

  if (!applicantData.ssn) {
    throw new Error('SSN is required for credit report pull');
  }

  if (!applicantData.address1 || !applicantData.city || !applicantData.state || !applicantData.zip) {
    throw new Error('Complete address (address1, city, state, zip) is required for credit report pull');
  }

  const endpoint = getBureauEndpoint(bureau);

  const requestBody: CreditReportRequest = {
    firstName: applicantData.firstName,
    lastName: applicantData.lastName,
    ssn: sanitizeSSNForCredit(applicantData.ssn),
    addresses: [
      {
        borrowerResidencyType: 'Current',
        addressLine1: applicantData.address1,
        city: applicantData.city,
        state: applicantData.state,
        postalCode: applicantData.zip,
      },
    ],
  };

  if (applicantData.middleName) {
    requestBody.middleName = applicantData.middleName;
  }

  if (applicantData.suffix) {
    requestBody.suffix = applicantData.suffix;
  }

  if (applicantData.dateOfBirth) {
    requestBody.birthDate = normalizeDOB(applicantData.dateOfBirth);
  }

  if (applicantData.email) {
    requestBody.email = applicantData.email;
  }

  if (applicantData.phone) {
    requestBody.phoneNumber = applicantData.phone;
  }

  if (applicantData.address2) {
    requestBody.addresses[0].addressLine2 = applicantData.address2;
  }

  try {
    const response = await authenticatedFetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      data: requestBody,
    });

    const raw = response.data;

    // Extract credit scores
    const scores: CreditReportResponse['scores'] = (raw.scores || raw.Scores || raw.creditScore || []).map(
      (s: any) => ({
        model: s.model || s.Model || s.scoreName || 'VantageScore4',
        value: s.value ?? s.Value ?? s.score ?? 0,
      }),
    );

    // Extract tradelines (credit accounts)
    const tradelines = raw.tradelines || raw.Tradelines || raw.tradeLines || [];

    // Extract inquiries
    const inquiries = raw.inquiries || raw.Inquiries || [];

    // Extract public records
    const publicRecords = raw.publicRecords || raw.PublicRecords || [];

    // Build summary from raw data
    const summary: CreditReportResponse['summary'] = {
      totalAccounts: tradelines.length,
      totalBalance: tradelines.reduce((sum: number, t: any) => {
        const balance = t.currentBalance ?? t.CurrentBalance ?? t.balance ?? 0;
        return sum + (typeof balance === 'number' ? balance : parseFloat(balance) || 0);
      }, 0),
      delinquentCount: tradelines.filter((t: any) => {
        const status = (t.paymentStatus || t.PaymentStatus || t.accountStatus || '').toLowerCase();
        return status.includes('delinquent') || status.includes('late') || status.includes('past due');
      }).length,
      recentAddressChanges: raw.recentAddressChanges ?? raw.RecentAddressChanges ?? 0,
    };

    const creditResponse: CreditReportResponse = {
      scores,
      tradelines,
      inquiries,
      publicRecords,
      summary,
      rawResponse: raw,
    };

    return creditResponse;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.response.data?.message || error.message;

      if (status === 400) {
        throw new Error(`Credit report validation error: ${message}`);
      }
      if (status === 401) {
        throw new Error(`Credit report authentication error: ${message}`);
      }
      if (status === 403) {
        throw new Error(`Credit report access denied: ${message}`);
      }
      if (status >= 500) {
        throw new Error(`Credit bureau server error (HTTP ${status}): ${message}`);
      }
      throw new Error(`Credit report request failed (HTTP ${status}): ${message}`);
    }
    throw new Error(`Credit report request failed: ${error.message}`);
  }
}
