export const helocConsentKeys = [
  "reviewedHelocBrochure",
  "reviewedEarlyDisclosures",
  "acceptedESign",
  "acceptedCreditPull",
  "certifiedInformation"
] as const;

export type HelocConsentKey = (typeof helocConsentKeys)[number];

export type HelocAddressInput = {
  street1: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
};

export type HelocDisclosureUrls = {
  helocBrochureUrl: string;
  earlyDisclosureUrl: string;
  privacyUrl: string;
  eSignUrl: string;
};

export type HelocApplicationFormInput = {
  applicant: {
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    email: string;
    phone: string;
    secondaryPhone: string;
    workPhone: string;
    dateOfBirth: string;
    ssnLast4: string;
    maritalStatus: string;
    citizenshipStatus: string;
    preferredContactMethod: string;
    address: HelocAddressInput;
    housingStatus: string;
    yearsAtAddress: string;
    monthsAtAddress: string;
    identification: {
      idType: string;
      idNumber: string;
      idState: string;
      idIssuedDate: string;
      idExpirationDate: string;
    };
  };
  loan: {
    zipCode: string;
    branchLocation: string;
    requestedLineAmount: string;
    purpose: string;
    occupancy: string;
    lienPosition: string;
    estimatedCLTV: string;
    requestedDrawAtClosing: string;
    branchOrOfficer: string;
    promoCode: string;
    contractorWorkLast90Days: string;
    workingWithLoanOfficer: string;
    currentMortgagePayment: string;
  };
  property: {
    address: HelocAddressInput;
    propertyType: string;
    unitCount: string;
    estimatedValue: string;
    estimatedFirstMortgageBalance: string;
    estimatedSecondLienBalance: string;
    occupancy: string;
    yearAcquired: string;
  };
  employment: {
    status: string;
    employerName: string;
    title: string;
    yearsWithEmployer: string;
    businessOwner: boolean;
  };
  income: {
    monthlyGrossIncome: string;
    otherMonthlyIncome: string;
    otherIncomeDescription: string;
  };
  consents: Record<HelocConsentKey, boolean>;
  consentTimestamps: Partial<Record<HelocConsentKey, string | null>>;
  meta: {
    userAgent: string;
    ipAddress?: string | null;
  };
};

export type HelocFieldErrors = Record<string, string>;

export type NormalizedHelocApplication = {
  applicant: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffix: string | null;
    email: string;
    phone: string;
    secondaryPhone: string | null;
    workPhone: string | null;
    dateOfBirth: string;
    ssnLast4: string;
    maritalStatus: string;
    citizenshipStatus: string;
    preferredContactMethod: string | null;
    address: {
      street1: string;
      street2: string | null;
      city: string;
      state: string;
      postalCode: string;
    };
    housingStatus: string;
    yearsAtAddress: number;
    monthsAtAddress: number;
    identification: {
      idType: string;
      idNumber: string;
      idState: string;
      idIssuedDate: string;
      idExpirationDate: string;
    };
  };
  loan: {
    zipCode: string;
    branchLocation: string | null;
    requestedLineAmount: number;
    purpose: string;
    occupancy: string;
    lienPosition: string;
    estimatedCLTV: number;
    requestedDrawAtClosing: number;
    branchOrOfficer: string | null;
    promoCode: string | null;
    contractorWorkLast90Days: boolean | null;
    workingWithLoanOfficer: boolean | null;
    currentMortgagePayment: number | null;
  };
  property: {
    address: {
      street1: string;
      street2: string | null;
      city: string;
      state: string;
      postalCode: string;
    };
    propertyType: string;
    unitCount: number;
    estimatedValue: number;
    estimatedFirstMortgageBalance: number;
    estimatedSecondLienBalance: number;
    occupancy: string;
    yearAcquired: number;
  };
  employment: {
    status: string;
    employerName: string | null;
    title: string | null;
    yearsWithEmployer: number | null;
    businessOwner: boolean;
  };
  income: {
    monthlyGrossIncome: number;
    otherMonthlyIncome: number;
    otherIncomeDescription: string | null;
  };
  disclosures: HelocDisclosureUrls;
  consents: Record<HelocConsentKey, boolean>;
  consentTimestamps: Record<HelocConsentKey, string>;
  meta: {
    userAgent: string;
    ipAddress: string | null;
    submittedAt: string;
  };
};

export type MeridianLinkSubmissionEnvelope = {
  submission: {
    reference: string;
    submittedAt: string;
    lenderName: string;
    mappingProfile: string;
  };
  application: NormalizedHelocApplication;
  mappedFields: Record<string, unknown>;
};
