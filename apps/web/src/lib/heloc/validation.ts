import {
  helocConsentKeys,
  type HelocAddressInput,
  type HelocApplicationFormInput,
  type HelocDisclosureUrls,
  type HelocFieldErrors,
  type HelocConsentKey,
  type NormalizedHelocApplication
} from "@/lib/heloc/types";

type NormalizationOptions = {
  disclosures: HelocDisclosureUrls;
  userAgent: string;
  ipAddress?: string | null;
  submittedAt: string;
};

const emailPattern = /\S+@\S+\.\S+/;
const postalCodePattern = /^\d{5}(?:-\d{4})?$/;
const statePattern = /^[A-Z]{2}$/;
const ssnLast4Pattern = /^\d{4}$/;

const maritalStatusOptions = new Set([
  "single",
  "married",
  "separated",
  "divorced",
  "widowed"
]);
const citizenshipStatusOptions = new Set([
  "us_citizen",
  "permanent_resident",
  "non_permanent_resident",
  "other"
]);
const housingStatusOptions = new Set(["own", "rent", "live_with_family", "other"]);
const preferredContactMethodOptions = new Set(["email", "primary_phone", "secondary_phone", "work_phone"]);
const identificationTypeOptions = new Set(["drivers_license", "state_id", "military_id", "passport"]);
const loanPurposeOptions = new Set([
  "home_improvement",
  "debt_consolidation",
  "major_expense",
  "reserve_line",
  "other"
]);
const occupancyOptions = new Set(["primary_residence", "second_home", "investment"]);
const lienPositionOptions = new Set(["first", "second"]);
const yesNoOptions = new Set(["yes", "no"]);
const propertyTypeOptions = new Set([
  "single_family",
  "townhome",
  "condo",
  "multi_family",
  "manufactured",
  "other"
]);
const employmentStatusOptions = new Set([
  "employed",
  "self_employed",
  "retired",
  "unemployed",
  "military",
  "other"
]);

function cleanText(value: string, maxLength = 160) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanMultilineText(value: string, maxLength = 240) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanDigits(value: string) {
  return value.replace(/\D/g, "");
}

function parseNumber(value: string) {
  if (!value.trim()) return null;

  const parsed = Number.parseFloat(value.replace(/[$,%\s,]/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parseInteger(value: string) {
  const parsed = parseNumber(value);
  if (parsed === null || !Number.isInteger(parsed)) return null;
  return parsed;
}

function parseYesNo(value: string) {
  if (!value.trim()) return null;
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function normalizeAddress(
  input: HelocAddressInput,
  prefix: "applicant.address" | "property.address",
  fieldErrors: HelocFieldErrors
) {
  const street1 = cleanText(input.street1, 120);
  const street2 = cleanText(input.street2, 120);
  const city = cleanText(input.city, 80);
  const state = cleanText(input.state, 2).toUpperCase();
  const postalCode = cleanText(input.postalCode, 10);

  if (!street1) fieldErrors[`${prefix}.street1`] = "Street address is required.";
  if (!city) fieldErrors[`${prefix}.city`] = "City is required.";
  if (!statePattern.test(state)) fieldErrors[`${prefix}.state`] = "Use a two-letter state code.";
  if (!postalCodePattern.test(postalCode)) {
    fieldErrors[`${prefix}.postalCode`] = "Enter a valid ZIP code.";
  }

  return {
    street1,
    street2: street2 || null,
    city,
    state,
    postalCode
  };
}

function normalizeConsentTimestamps(
  input: HelocApplicationFormInput,
  submittedAt: string
): Record<HelocConsentKey, string> {
  return helocConsentKeys.reduce<Record<HelocConsentKey, string>>((accumulator, key) => {
    const candidate = input.consentTimestamps[key];
    const date = candidate ? new Date(candidate) : null;
    accumulator[key] =
      date && !Number.isNaN(date.getTime()) ? date.toISOString() : submittedAt;
    return accumulator;
  }, {} as Record<HelocConsentKey, string>);
}

export function createEmptyHelocApplication(): HelocApplicationFormInput {
  return {
    applicant: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      email: "",
      phone: "",
      secondaryPhone: "",
      workPhone: "",
      dateOfBirth: "",
      ssnLast4: "",
      maritalStatus: "",
      citizenshipStatus: "",
      preferredContactMethod: "",
      address: {
        street1: "",
        street2: "",
        city: "",
        state: "",
        postalCode: ""
      },
      housingStatus: "",
      yearsAtAddress: ""
      ,
      monthsAtAddress: "",
      identification: {
        idType: "drivers_license",
        idNumber: "",
        idState: "",
        idIssuedDate: "",
        idExpirationDate: ""
      }
    },
    loan: {
      zipCode: "",
      branchLocation: "",
      requestedLineAmount: "",
      purpose: "",
      occupancy: "",
      lienPosition: "",
      estimatedCLTV: "",
      requestedDrawAtClosing: "",
      branchOrOfficer: "",
      promoCode: ""
      ,
      contractorWorkLast90Days: "",
      workingWithLoanOfficer: "",
      currentMortgagePayment: ""
    },
    property: {
      address: {
        street1: "",
        street2: "",
        city: "",
        state: "",
        postalCode: ""
      },
      propertyType: "",
      unitCount: "1",
      estimatedValue: "",
      estimatedFirstMortgageBalance: "",
      estimatedSecondLienBalance: "0",
      occupancy: "",
      yearAcquired: ""
    },
    employment: {
      status: "",
      employerName: "",
      title: "",
      yearsWithEmployer: "",
      businessOwner: false
    },
    income: {
      monthlyGrossIncome: "",
      otherMonthlyIncome: "0",
      otherIncomeDescription: ""
    },
    consents: {
      reviewedHelocBrochure: false,
      reviewedEarlyDisclosures: false,
      acceptedESign: false,
      acceptedCreditPull: false,
      certifiedInformation: false
    },
    consentTimestamps: {},
    meta: {
      userAgent: ""
    }
  };
}

export function validateHelocApplication(input: HelocApplicationFormInput) {
  return normalizeHelocApplication(input, {
    disclosures: {
      helocBrochureUrl: "about:blank",
      earlyDisclosureUrl: "about:blank",
      privacyUrl: "about:blank",
      eSignUrl: "about:blank"
    },
    userAgent: input.meta.userAgent || "",
    ipAddress: input.meta.ipAddress ?? null,
    submittedAt: new Date().toISOString()
  }).fieldErrors;
}

export function normalizeHelocApplication(
  input: HelocApplicationFormInput,
  options: NormalizationOptions
): { data?: NormalizedHelocApplication; fieldErrors: HelocFieldErrors } {
  const fieldErrors: HelocFieldErrors = {};

  const applicantAddress = normalizeAddress(input.applicant.address, "applicant.address", fieldErrors);
  const propertyAddress = normalizeAddress(input.property.address, "property.address", fieldErrors);

  const firstName = cleanText(input.applicant.firstName, 60);
  const middleName = cleanText(input.applicant.middleName, 60);
  const lastName = cleanText(input.applicant.lastName, 60);
  const suffix = cleanText(input.applicant.suffix, 20);
  const email = cleanText(input.applicant.email, 120).toLowerCase();
  const phone = cleanDigits(input.applicant.phone).slice(0, 10);
  const secondaryPhone = cleanDigits(input.applicant.secondaryPhone).slice(0, 10);
  const workPhone = cleanDigits(input.applicant.workPhone).slice(0, 10);
  const ssnLast4 = cleanDigits(input.applicant.ssnLast4).slice(0, 4);
  const maritalStatus = cleanText(input.applicant.maritalStatus, 32);
  const citizenshipStatus = cleanText(input.applicant.citizenshipStatus, 40);
  const preferredContactMethod = cleanText(input.applicant.preferredContactMethod, 32);
  const housingStatus = cleanText(input.applicant.housingStatus, 32);
  const yearsAtAddress = parseNumber(input.applicant.yearsAtAddress);
  const monthsAtAddress = parseInteger(input.applicant.monthsAtAddress);
  const idType = cleanText(input.applicant.identification.idType, 40);
  const idNumber = cleanText(input.applicant.identification.idNumber, 40);
  const idState = cleanText(input.applicant.identification.idState, 2).toUpperCase();
  const idIssuedDate = input.applicant.identification.idIssuedDate.trim();
  const idExpirationDate = input.applicant.identification.idExpirationDate.trim();

  if (!firstName) fieldErrors["applicant.firstName"] = "First name is required.";
  if (!lastName) fieldErrors["applicant.lastName"] = "Last name is required.";
  if (!emailPattern.test(email)) fieldErrors["applicant.email"] = "Enter a valid email address.";
  if (phone.length !== 10) fieldErrors["applicant.phone"] = "Enter a valid 10-digit phone number.";
  if (secondaryPhone && secondaryPhone.length !== 10) {
    fieldErrors["applicant.secondaryPhone"] = "Enter a valid 10-digit phone number.";
  }
  if (workPhone && workPhone.length !== 10) {
    fieldErrors["applicant.workPhone"] = "Enter a valid 10-digit phone number.";
  }
  if (!ssnLast4Pattern.test(ssnLast4)) fieldErrors["applicant.ssnLast4"] = "Enter the last four digits only.";
  if (!maritalStatusOptions.has(maritalStatus)) {
    fieldErrors["applicant.maritalStatus"] = "Select a marital status.";
  }
  if (!citizenshipStatusOptions.has(citizenshipStatus)) {
    fieldErrors["applicant.citizenshipStatus"] = "Select a citizenship status.";
  }
  if (preferredContactMethod && !preferredContactMethodOptions.has(preferredContactMethod)) {
    fieldErrors["applicant.preferredContactMethod"] = "Select a preferred contact method.";
  }
  if (!housingStatusOptions.has(housingStatus)) {
    fieldErrors["applicant.housingStatus"] = "Select a housing status.";
  }
  if (yearsAtAddress === null || yearsAtAddress < 0 || yearsAtAddress > 99) {
    fieldErrors["applicant.yearsAtAddress"] = "Enter years at current address.";
  }
  if (monthsAtAddress === null || monthsAtAddress < 0 || monthsAtAddress > 11) {
    fieldErrors["applicant.monthsAtAddress"] = "Enter months at current address.";
  }
  if (!identificationTypeOptions.has(idType)) {
    fieldErrors["applicant.identification.idType"] = "Select an ID type.";
  }
  if (!idNumber) {
    fieldErrors["applicant.identification.idNumber"] = "ID number is required.";
  }
  if (!statePattern.test(idState)) {
    fieldErrors["applicant.identification.idState"] = "Use a two-letter state code.";
  }

  const dob = input.applicant.dateOfBirth.trim();
  const dobDate = dob ? new Date(`${dob}T00:00:00Z`) : null;
  const now = new Date();
  if (!dob || !dobDate || Number.isNaN(dobDate.getTime())) {
    fieldErrors["applicant.dateOfBirth"] = "Enter a valid date of birth.";
  } else {
    const age = now.getUTCFullYear() - dobDate.getUTCFullYear();
    if (age < 18) {
      fieldErrors["applicant.dateOfBirth"] = "Applicants must be at least 18 years old.";
    }
  }
  const issuedDate = idIssuedDate ? new Date(`${idIssuedDate}T00:00:00Z`) : null;
  const expirationDate = idExpirationDate ? new Date(`${idExpirationDate}T00:00:00Z`) : null;
  if (!idIssuedDate || !issuedDate || Number.isNaN(issuedDate.getTime())) {
    fieldErrors["applicant.identification.idIssuedDate"] = "Enter a valid ID issued date.";
  }
  if (!idExpirationDate || !expirationDate || Number.isNaN(expirationDate.getTime())) {
    fieldErrors["applicant.identification.idExpirationDate"] = "Enter a valid ID expiration date.";
  } else if (expirationDate <= now) {
    fieldErrors["applicant.identification.idExpirationDate"] = "ID must not be expired.";
  }

  const loanZipCode = cleanText(input.loan.zipCode, 10);
  const branchLocation = cleanText(input.loan.branchLocation, 120);
  const requestedLineAmount = parseNumber(input.loan.requestedLineAmount);
  const loanPurpose = cleanText(input.loan.purpose, 40);
  const loanOccupancy = cleanText(input.loan.occupancy, 40);
  const lienPosition = cleanText(input.loan.lienPosition, 20);
  const estimatedCLTV = parseNumber(input.loan.estimatedCLTV);
  const requestedDrawAtClosing = parseNumber(input.loan.requestedDrawAtClosing);
  const branchOrOfficer = cleanText(input.loan.branchOrOfficer, 80);
  const promoCode = cleanText(input.loan.promoCode, 40);
  const contractorWorkLast90Days = parseYesNo(cleanText(input.loan.contractorWorkLast90Days, 3));
  const workingWithLoanOfficer = parseYesNo(cleanText(input.loan.workingWithLoanOfficer, 3));
  const currentMortgagePayment = parseNumber(input.loan.currentMortgagePayment);

  if (!postalCodePattern.test(loanZipCode)) {
    fieldErrors["loan.zipCode"] = "Enter a valid ZIP code.";
  }
  if (requestedLineAmount === null || requestedLineAmount < 1000) {
    fieldErrors["loan.requestedLineAmount"] = "Enter the requested line amount.";
  }
  if (!branchLocation) {
    fieldErrors["loan.branchLocation"] = "Select or enter the branch location.";
  }
  if (!loanPurposeOptions.has(loanPurpose)) fieldErrors["loan.purpose"] = "Select a loan purpose.";
  if (!occupancyOptions.has(loanOccupancy)) fieldErrors["loan.occupancy"] = "Select loan occupancy.";
  if (!lienPositionOptions.has(lienPosition)) fieldErrors["loan.lienPosition"] = "Select a lien position.";
  if (estimatedCLTV === null || estimatedCLTV <= 0 || estimatedCLTV > 150) {
    fieldErrors["loan.estimatedCLTV"] = "Enter an estimated CLTV between 1 and 150.";
  }
  if (requestedDrawAtClosing === null || requestedDrawAtClosing < 0) {
    fieldErrors["loan.requestedDrawAtClosing"] = "Enter the requested draw at closing.";
  }
  if (!yesNoOptions.has(cleanText(input.loan.contractorWorkLast90Days, 3))) {
    fieldErrors["loan.contractorWorkLast90Days"] = "Answer the contractor question.";
  }
  if (!yesNoOptions.has(cleanText(input.loan.workingWithLoanOfficer, 3))) {
    fieldErrors["loan.workingWithLoanOfficer"] = "Answer the loan officer question.";
  }
  if (currentMortgagePayment !== null && currentMortgagePayment < 0) {
    fieldErrors["loan.currentMortgagePayment"] = "Mortgage payment cannot be negative.";
  }

  const propertyType = cleanText(input.property.propertyType, 40);
  const unitCount = parseInteger(input.property.unitCount);
  const estimatedValue = parseNumber(input.property.estimatedValue);
  const estimatedFirstMortgageBalance = parseNumber(input.property.estimatedFirstMortgageBalance);
  const estimatedSecondLienBalance = parseNumber(input.property.estimatedSecondLienBalance) ?? 0;
  const propertyOccupancy = cleanText(input.property.occupancy, 40);
  const yearAcquired = parseInteger(input.property.yearAcquired);

  if (!propertyTypeOptions.has(propertyType)) fieldErrors["property.propertyType"] = "Select a property type.";
  if (unitCount === null || unitCount < 1 || unitCount > 8) {
    fieldErrors["property.unitCount"] = "Enter a valid unit count.";
  }
  if (estimatedValue === null || estimatedValue <= 0) {
    fieldErrors["property.estimatedValue"] = "Enter the estimated property value.";
  }
  if (estimatedFirstMortgageBalance === null || estimatedFirstMortgageBalance < 0) {
    fieldErrors["property.estimatedFirstMortgageBalance"] =
      "Enter the estimated first mortgage balance.";
  }
  if (estimatedSecondLienBalance < 0) {
    fieldErrors["property.estimatedSecondLienBalance"] =
      "Second lien balance cannot be negative.";
  }
  if (!occupancyOptions.has(propertyOccupancy)) {
    fieldErrors["property.occupancy"] = "Select property occupancy.";
  }
  if (yearAcquired === null || yearAcquired < 1900 || yearAcquired > now.getUTCFullYear()) {
    fieldErrors["property.yearAcquired"] = "Enter the year the property was acquired.";
  }

  const employmentStatus = cleanText(input.employment.status, 40);
  const employerName = cleanText(input.employment.employerName, 120);
  const title = cleanText(input.employment.title, 80);
  const yearsWithEmployer = parseNumber(input.employment.yearsWithEmployer);
  const needsEmployerDetails = ["employed", "self_employed", "military"].includes(employmentStatus);

  if (!employmentStatusOptions.has(employmentStatus)) {
    fieldErrors["employment.status"] = "Select an employment status.";
  }
  if (needsEmployerDetails && !employerName) {
    fieldErrors["employment.employerName"] = "Employer name is required.";
  }
  if (needsEmployerDetails && !title) {
    fieldErrors["employment.title"] = "Job title is required.";
  }
  if (needsEmployerDetails && (yearsWithEmployer === null || yearsWithEmployer < 0 || yearsWithEmployer > 80)) {
    fieldErrors["employment.yearsWithEmployer"] = "Enter years with employer.";
  }

  const monthlyGrossIncome = parseNumber(input.income.monthlyGrossIncome);
  const otherMonthlyIncome = parseNumber(input.income.otherMonthlyIncome) ?? 0;
  const otherIncomeDescription = cleanMultilineText(input.income.otherIncomeDescription, 160);

  if (monthlyGrossIncome === null || monthlyGrossIncome <= 0) {
    fieldErrors["income.monthlyGrossIncome"] = "Enter monthly gross income.";
  }
  if (otherMonthlyIncome < 0) {
    fieldErrors["income.otherMonthlyIncome"] = "Other monthly income cannot be negative.";
  }
  if (otherMonthlyIncome > 0 && !otherIncomeDescription) {
    fieldErrors["income.otherIncomeDescription"] = "Describe the other monthly income.";
  }

  for (const consentKey of helocConsentKeys) {
    if (!input.consents[consentKey]) {
      fieldErrors[`consents.${consentKey}`] = "This acknowledgement is required.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    fieldErrors,
    data: {
      applicant: {
        firstName,
        middleName: middleName || null,
        lastName,
        suffix: suffix || null,
        email,
        phone,
        secondaryPhone: secondaryPhone || null,
        workPhone: workPhone || null,
        dateOfBirth: dob,
        ssnLast4,
        maritalStatus,
        citizenshipStatus,
        preferredContactMethod: preferredContactMethod || null,
        address: applicantAddress,
        housingStatus,
        yearsAtAddress: yearsAtAddress ?? 0,
        monthsAtAddress: monthsAtAddress ?? 0,
        identification: {
          idType,
          idNumber,
          idState,
          idIssuedDate,
          idExpirationDate
        }
      },
      loan: {
        zipCode: loanZipCode,
        branchLocation: branchLocation || null,
        requestedLineAmount: requestedLineAmount ?? 0,
        purpose: loanPurpose,
        occupancy: loanOccupancy,
        lienPosition,
        estimatedCLTV: estimatedCLTV ?? 0,
        requestedDrawAtClosing: requestedDrawAtClosing ?? 0,
        branchOrOfficer: branchOrOfficer || null,
        promoCode: promoCode || null,
        contractorWorkLast90Days,
        workingWithLoanOfficer,
        currentMortgagePayment
      },
      property: {
        address: propertyAddress,
        propertyType,
        unitCount: unitCount ?? 1,
        estimatedValue: estimatedValue ?? 0,
        estimatedFirstMortgageBalance: estimatedFirstMortgageBalance ?? 0,
        estimatedSecondLienBalance,
        occupancy: propertyOccupancy,
        yearAcquired: yearAcquired ?? now.getUTCFullYear()
      },
      employment: {
        status: employmentStatus,
        employerName: employerName || null,
        title: title || null,
        yearsWithEmployer: yearsWithEmployer,
        businessOwner: Boolean(input.employment.businessOwner)
      },
      income: {
        monthlyGrossIncome: monthlyGrossIncome ?? 0,
        otherMonthlyIncome,
        otherIncomeDescription: otherIncomeDescription || null
      },
      disclosures: options.disclosures,
      consents: helocConsentKeys.reduce(
        (accumulator, key) => ({
          ...accumulator,
          [key]: Boolean(input.consents[key])
        }),
        {} as Record<HelocConsentKey, boolean>
      ),
      consentTimestamps: normalizeConsentTimestamps(input, options.submittedAt),
      meta: {
        userAgent: cleanMultilineText(options.userAgent || input.meta.userAgent || "", 240),
        ipAddress: options.ipAddress?.trim() || null,
        submittedAt: options.submittedAt
      }
    }
  };
}
