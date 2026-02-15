import { config } from '../config';
import { authenticatedFetch } from './crs-auth';
import {
  ApplicantData,
  CriminalRequest,
  EvictionResponse,
} from '../types';

/**
 * Formats DOB to MM-dd-yyyy format as required by the Eviction API.
 * CRITICAL: Eviction API expects MM-dd-yyyy, NOT YYYY-MM-DD (same as Criminal).
 */
function formatDOBForEviction(dob: string): string {
  // Handle YYYY-MM-DD input
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const [year, month, day] = dob.split('-');
    return `${month}-${day}-${year}`;
  }
  // Handle MM/DD/YYYY input
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
    const [month, day, year] = dob.split('/');
    return `${month}-${day}-${year}`;
  }
  // Handle MM-DD-YYYY input (already correct format)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
    return dob;
  }
  // Fallback: attempt parsing as date
  const date = new Date(dob);
  if (!isNaN(date.getTime())) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${month}-${day}-${year}`;
  }
  return dob;
}

/**
 * Formats SSN with dashes as XXX-XX-XXXX for the Eviction API.
 * CRITICAL: Eviction API expects SSN WITH dashes (same as Criminal).
 */
function formatSSNWithDashes(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');
  if (digits.length !== 9) {
    throw new Error(`Invalid SSN: expected 9 digits, got ${digits.length}`);
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/**
 * Splits a full street address into houseNumber and streetName.
 * e.g., "456 Oak Ave" -> { houseNumber: "456", streetName: "Oak Ave" }
 */
function splitAddress(address: string): { houseNumber: string; streetName: string } {
  const trimmed = address.trim();
  const match = trimmed.match(/^(\d+[\w-]*)\s+(.+)$/);
  if (match) {
    return {
      houseNumber: match[1],
      streetName: match[2],
    };
  }
  return {
    houseNumber: '',
    streetName: trimmed,
  };
}

/**
 * Generates a unique reference ID for the eviction check request.
 */
function generateReference(applicantData: ApplicantData): string {
  const timestamp = Date.now();
  const name = `${applicantData.firstName}-${applicantData.lastName}`.toLowerCase().replace(/\s+/g, '-');
  return `grant-shield-eviction-${name}-${timestamp}`;
}

/**
 * Submits an eviction records check request.
 * Uses the same request schema as Criminal (CriminalRequest).
 * DOB format: MM-dd-yyyy. SSN format: XXX-XX-XXXX (with dashes).
 * Address is split into houseNumber and streetName.
 */
export async function checkEviction(applicantData: ApplicantData): Promise<{ requestId: string; rawResponse: any }> {
  const { baseUrl } = config.crs;

  if (!applicantData.dateOfBirth) {
    throw new Error('Date of birth is required for eviction records check');
  }

  const subjectInfo: CriminalRequest['subjectInfo'] = {
    first: applicantData.firstName,
    last: applicantData.lastName,
    dob: formatDOBForEviction(applicantData.dateOfBirth),
  };

  if (applicantData.middleName) {
    subjectInfo.middle = applicantData.middleName;
  }

  if (applicantData.ssn) {
    subjectInfo.ssn = formatSSNWithDashes(applicantData.ssn);
  }

  if (applicantData.address1) {
    const { houseNumber, streetName } = splitAddress(applicantData.address1);
    subjectInfo.houseNumber = houseNumber;
    subjectInfo.streetName = streetName;
  }

  if (applicantData.city) {
    subjectInfo.city = applicantData.city;
  }

  if (applicantData.state) {
    subjectInfo.state = applicantData.state;
  }

  if (applicantData.zip) {
    subjectInfo.zip = applicantData.zip;
  }

  const requestBody: CriminalRequest = {
    reference: generateReference(applicantData),
    subjectInfo,
  };

  try {
    const response = await authenticatedFetch(`${baseUrl}/eviction/new-request`, {
      method: 'POST',
      data: requestBody,
    });

    const raw = response.data;
    const requestId: string = raw.id || raw.requestId || raw.Id || raw.RequestId || '';

    return {
      requestId,
      rawResponse: raw,
    };
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.response.data?.message || error.message;

      if (status === 400) {
        throw new Error(`Eviction check validation error: ${message}`);
      }
      if (status === 401) {
        throw new Error(`Eviction check authentication error: ${message}`);
      }
      if (status >= 500) {
        throw new Error(`Eviction check server error (HTTP ${status}): ${message}`);
      }
      throw new Error(`Eviction check request failed (HTTP ${status}): ${message}`);
    }
    throw new Error(`Eviction check request failed: ${error.message}`);
  }
}

/**
 * Retrieves the results of a previously submitted eviction records check.
 * The eviction check is asynchronous: submit with checkEviction(), then poll with getEvictionResults().
 */
export async function getEvictionResults(id: string): Promise<EvictionResponse> {
  const { baseUrl } = config.crs;

  if (!id) {
    throw new Error('Request ID is required to retrieve eviction check results');
  }

  try {
    const response = await authenticatedFetch(`${baseUrl}/eviction/get-response/${id}`, {
      method: 'GET',
    });

    const raw = response.data;

    // Parse candidates and evictions from the raw response
    const candidates: EvictionResponse['candidates'] = (raw.candidates || raw.Candidates || raw.records || []).map(
      (candidate: any) => ({
        name: candidate.name || candidate.Name || `${candidate.first || ''} ${candidate.last || ''}`.trim(),
        evictions: (candidate.evictions || candidate.Evictions || candidate.filings || []).map(
          (eviction: any) => ({
            court: eviction.court || eviction.Court,
            filingDate: eviction.filingDate || eviction.FilingDate || eviction.date,
            caseNumber: eviction.caseNumber || eviction.CaseNumber || eviction.caseId,
            plaintiff: eviction.plaintiff || eviction.Plaintiff,
            judgmentAmount: eviction.judgmentAmount ?? eviction.JudgmentAmount ?? eviction.amount,
          }),
        ),
      }),
    );

    const evictionResponse: EvictionResponse = {
      candidates,
      rawResponse: raw,
    };

    return evictionResponse;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.response.data?.message || error.message;

      if (status === 404) {
        throw new Error(`Eviction check results not found for ID: ${id}. The check may still be processing.`);
      }
      if (status === 401) {
        throw new Error(`Eviction check authentication error: ${message}`);
      }
      if (status >= 500) {
        throw new Error(`Eviction check server error (HTTP ${status}): ${message}`);
      }
      throw new Error(`Eviction check results request failed (HTTP ${status}): ${message}`);
    }
    throw new Error(`Eviction check results request failed: ${error.message}`);
  }
}
