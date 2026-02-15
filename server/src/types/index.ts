export interface ApplicantData {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  phone?: string;
  ssn?: string;
  dateOfBirth?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  ipAddress?: string;
  driverLicenseNumber?: string;
  driverLicenseState?: string;
}

export interface FlexIDRequest {
  firstName: string;
  lastName: string;
  ssn?: string;
  dateOfBirth?: string;
  streetAddress1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  homePhone?: string;
  workPhone?: string;
  email?: string;
  driverLicenseNumber?: string;
  driverLicenseState?: string;
  ipAddress?: string;
  useDOBFilter?: boolean;
  dobRadius?: number;
  includeDLVerification?: boolean;
  includeSSNVerification?: boolean;
  includeEmailVerification?: boolean;
  includeAllRiskIndicators?: boolean;
  includeVerifiedElementSummary?: boolean;
}

export interface FlexIDResponse {
  cviScore: number;
  riskIndicators: RiskIndicator[];
  verifiedElementSummary?: VerifiedElementSummary;
  ssnVerification?: { valid: boolean; issuedStartDate?: string; issuedEndDate?: string };
  emailVerification?: { valid: boolean };
  rawResponse: any;
}

export interface RiskIndicator {
  code: string;
  description: string;
  riskLevel: string;
}

export interface VerifiedElementSummary {
  name: boolean;
  address: boolean;
  ssn: boolean;
  dob: boolean;
  phone: boolean;
  email: boolean;
}

export interface FraudFinderRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  ipAddress?: string;
  userAgent?: string;
  address?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export interface FraudFinderResponse {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  emailValidation: {
    valid: boolean;
    domainAge?: number;
    velocity?: number;
    popularity?: number;
    longevity?: number;
    domainRisk?: string;
  };
  phoneVerification?: {
    lineType?: string;
    carrier?: string;
    prepaid?: boolean;
    ownerMatch?: boolean;
    ownerName?: string;
  };
  ipAnalysis?: {
    country?: string;
    region?: string;
    city?: string;
    proxy?: boolean;
    vpn?: boolean;
    routingType?: string;
  };
  addressDeliverability?: {
    deliverable?: boolean;
    type?: string;
  };
  rawResponse: any;
}

export interface CreditReportRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  ssn?: string;
  birthDate?: string;
  email?: string;
  phoneNumber?: string;
  addresses: {
    borrowerResidencyType: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  }[];
}

export interface CreditReportResponse {
  scores: { model: string; value: number }[];
  tradelines: any[];
  inquiries: any[];
  publicRecords: any[];
  summary: {
    totalAccounts: number;
    totalBalance: number;
    delinquentCount: number;
    recentAddressChanges: number;
  };
  rawResponse: any;
}

export interface CriminalRequest {
  reference: string;
  subjectInfo: {
    first: string;
    last: string;
    middle?: string;
    dob: string;
    ssn?: string;
    houseNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface CriminalResponse {
  candidates: {
    name: string;
    offenses: {
      description: string;
      statute?: string;
      date?: string;
      disposition?: string;
      court?: string;
      sentence?: string;
    }[];
  }[];
  rawResponse: any;
}

export interface EvictionResponse {
  candidates: {
    name: string;
    evictions: {
      court?: string;
      filingDate?: string;
      caseNumber?: string;
      plaintiff?: string;
      judgmentAmount?: number;
    }[];
  }[];
  rawResponse: any;
}

export interface FraudFactor {
  category: string;
  description: string;
  impact: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface FraudSignal {
  type: string;
  description: string;
  source: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
}

export interface FraudAssessment {
  overallScore: number;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'APPROVE' | 'REVIEW' | 'DENY';
  factors: FraudFactor[];
  signals: FraudSignal[];
}
