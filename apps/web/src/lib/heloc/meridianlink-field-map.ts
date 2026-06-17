import { type MeridianLinkSubmissionEnvelope } from "@/lib/heloc/types";

export const meridianLinkFieldMapProfile = "placeholder-v1";

export const meridianLinkFieldMap: Record<string, string> = {
  "submission.reference": "CUSTOMIZE_ME.APPLICATION_REFERENCE",
  "submission.submittedAt": "CUSTOMIZE_ME.SUBMITTED_AT",
  "submission.lenderName": "CUSTOMIZE_ME.LENDER_NAME",
  "application.applicant.firstName": "CUSTOMIZE_ME.APPLICANT_FIRST_NAME",
  "application.applicant.middleName": "CUSTOMIZE_ME.APPLICANT_MIDDLE_NAME",
  "application.applicant.lastName": "CUSTOMIZE_ME.APPLICANT_LAST_NAME",
  "application.applicant.suffix": "CUSTOMIZE_ME.APPLICANT_SUFFIX",
  "application.applicant.email": "CUSTOMIZE_ME.APPLICANT_EMAIL",
  "application.applicant.phone": "CUSTOMIZE_ME.APPLICANT_PHONE",
  "application.applicant.secondaryPhone": "CUSTOMIZE_ME.APPLICANT_SECONDARY_PHONE",
  "application.applicant.workPhone": "CUSTOMIZE_ME.APPLICANT_WORK_PHONE",
  "application.applicant.dateOfBirth": "CUSTOMIZE_ME.APPLICANT_DOB",
  "application.applicant.ssnLast4": "CUSTOMIZE_ME.APPLICANT_SSN_LAST4",
  "application.applicant.maritalStatus": "CUSTOMIZE_ME.APPLICANT_MARITAL_STATUS",
  "application.applicant.citizenshipStatus": "CUSTOMIZE_ME.APPLICANT_CITIZENSHIP_STATUS",
  "application.applicant.preferredContactMethod": "CUSTOMIZE_ME.PREFERRED_CONTACT_METHOD",
  "application.applicant.address.street1": "CUSTOMIZE_ME.APPLICANT_ADDRESS_1",
  "application.applicant.address.street2": "CUSTOMIZE_ME.APPLICANT_ADDRESS_2",
  "application.applicant.address.city": "CUSTOMIZE_ME.APPLICANT_CITY",
  "application.applicant.address.state": "CUSTOMIZE_ME.APPLICANT_STATE",
  "application.applicant.address.postalCode": "CUSTOMIZE_ME.APPLICANT_POSTAL_CODE",
  "application.applicant.housingStatus": "CUSTOMIZE_ME.APPLICANT_HOUSING_STATUS",
  "application.applicant.yearsAtAddress": "CUSTOMIZE_ME.APPLICANT_YEARS_AT_ADDRESS",
  "application.applicant.monthsAtAddress": "CUSTOMIZE_ME.APPLICANT_MONTHS_AT_ADDRESS",
  "application.applicant.identification.idType": "CUSTOMIZE_ME.ID_TYPE",
  "application.applicant.identification.idNumber": "CUSTOMIZE_ME.ID_NUMBER",
  "application.applicant.identification.idState": "CUSTOMIZE_ME.ID_STATE",
  "application.applicant.identification.idIssuedDate": "CUSTOMIZE_ME.ID_ISSUED_DATE",
  "application.applicant.identification.idExpirationDate": "CUSTOMIZE_ME.ID_EXPIRATION_DATE",
  "application.loan.zipCode": "CUSTOMIZE_ME.LOAN_ZIP_CODE",
  "application.loan.branchLocation": "CUSTOMIZE_ME.BRANCH_LOCATION",
  "application.loan.requestedLineAmount": "CUSTOMIZE_ME.LOAN_REQUESTED_LINE_AMOUNT",
  "application.loan.purpose": "CUSTOMIZE_ME.LOAN_PURPOSE",
  "application.loan.occupancy": "CUSTOMIZE_ME.LOAN_OCCUPANCY",
  "application.loan.lienPosition": "CUSTOMIZE_ME.LOAN_LIEN_POSITION",
  "application.loan.estimatedCLTV": "CUSTOMIZE_ME.LOAN_ESTIMATED_CLTV",
  "application.loan.requestedDrawAtClosing": "CUSTOMIZE_ME.LOAN_DRAW_AT_CLOSING",
  "application.loan.branchOrOfficer": "CUSTOMIZE_ME.LOAN_BRANCH_OR_OFFICER",
  "application.loan.promoCode": "CUSTOMIZE_ME.LOAN_PROMO_CODE",
  "application.loan.contractorWorkLast90Days": "CUSTOMIZE_ME.CONTRACTOR_WORK_LAST_90_DAYS",
  "application.loan.workingWithLoanOfficer": "CUSTOMIZE_ME.WORKING_WITH_LOAN_OFFICER",
  "application.loan.currentMortgagePayment": "CUSTOMIZE_ME.CURRENT_MORTGAGE_PAYMENT",
  "application.property.address.street1": "CUSTOMIZE_ME.PROPERTY_ADDRESS_1",
  "application.property.address.street2": "CUSTOMIZE_ME.PROPERTY_ADDRESS_2",
  "application.property.address.city": "CUSTOMIZE_ME.PROPERTY_CITY",
  "application.property.address.state": "CUSTOMIZE_ME.PROPERTY_STATE",
  "application.property.address.postalCode": "CUSTOMIZE_ME.PROPERTY_POSTAL_CODE",
  "application.property.propertyType": "CUSTOMIZE_ME.PROPERTY_TYPE",
  "application.property.unitCount": "CUSTOMIZE_ME.PROPERTY_UNIT_COUNT",
  "application.property.estimatedValue": "CUSTOMIZE_ME.PROPERTY_ESTIMATED_VALUE",
  "application.property.estimatedFirstMortgageBalance":
    "CUSTOMIZE_ME.PROPERTY_FIRST_MORTGAGE_BALANCE",
  "application.property.estimatedSecondLienBalance":
    "CUSTOMIZE_ME.PROPERTY_SECOND_LIEN_BALANCE",
  "application.property.occupancy": "CUSTOMIZE_ME.PROPERTY_OCCUPANCY",
  "application.property.yearAcquired": "CUSTOMIZE_ME.PROPERTY_YEAR_ACQUIRED",
  "application.employment.status": "CUSTOMIZE_ME.EMPLOYMENT_STATUS",
  "application.employment.employerName": "CUSTOMIZE_ME.EMPLOYER_NAME",
  "application.employment.title": "CUSTOMIZE_ME.EMPLOYMENT_TITLE",
  "application.employment.yearsWithEmployer": "CUSTOMIZE_ME.YEARS_WITH_EMPLOYER",
  "application.employment.businessOwner": "CUSTOMIZE_ME.BUSINESS_OWNER",
  "application.income.monthlyGrossIncome": "CUSTOMIZE_ME.MONTHLY_GROSS_INCOME",
  "application.income.otherMonthlyIncome": "CUSTOMIZE_ME.OTHER_MONTHLY_INCOME",
  "application.income.otherIncomeDescription": "CUSTOMIZE_ME.OTHER_INCOME_DESCRIPTION",
  "application.disclosures.helocBrochureUrl": "CUSTOMIZE_ME.HELOC_BROCHURE_URL",
  "application.disclosures.earlyDisclosureUrl": "CUSTOMIZE_ME.EARLY_DISCLOSURE_URL",
  "application.disclosures.privacyUrl": "CUSTOMIZE_ME.PRIVACY_NOTICE_URL",
  "application.disclosures.eSignUrl": "CUSTOMIZE_ME.ESIGN_URL",
  "application.consents.reviewedHelocBrochure": "CUSTOMIZE_ME.CONSENT_REVIEWED_HELOC_BROCHURE",
  "application.consents.reviewedEarlyDisclosures":
    "CUSTOMIZE_ME.CONSENT_REVIEWED_EARLY_DISCLOSURES",
  "application.consents.acceptedESign": "CUSTOMIZE_ME.CONSENT_ACCEPTED_ESIGN",
  "application.consents.acceptedCreditPull": "CUSTOMIZE_ME.CONSENT_ACCEPTED_CREDIT_PULL",
  "application.consents.certifiedInformation": "CUSTOMIZE_ME.CONSENT_CERTIFIED_INFORMATION",
  "application.consentTimestamps.reviewedHelocBrochure":
    "CUSTOMIZE_ME.CONSENT_TS_REVIEWED_HELOC_BROCHURE",
  "application.consentTimestamps.reviewedEarlyDisclosures":
    "CUSTOMIZE_ME.CONSENT_TS_REVIEWED_EARLY_DISCLOSURES",
  "application.consentTimestamps.acceptedESign": "CUSTOMIZE_ME.CONSENT_TS_ACCEPTED_ESIGN",
  "application.consentTimestamps.acceptedCreditPull":
    "CUSTOMIZE_ME.CONSENT_TS_ACCEPTED_CREDIT_PULL",
  "application.consentTimestamps.certifiedInformation":
    "CUSTOMIZE_ME.CONSENT_TS_CERTIFIED_INFORMATION",
  "application.meta.userAgent": "CUSTOMIZE_ME.META_USER_AGENT",
  "application.meta.ipAddress": "CUSTOMIZE_ME.META_IP_ADDRESS"
};

function getValueAtPath(source: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, source);
}

export function buildMeridianLinkMappedFields(payload: MeridianLinkSubmissionEnvelope) {
  return Object.entries(meridianLinkFieldMap).reduce<Record<string, unknown>>(
    (accumulator, [sourcePath, targetField]) => {
      accumulator[targetField] = getValueAtPath(payload, sourcePath) ?? null;
      return accumulator;
    },
    {}
  );
}
