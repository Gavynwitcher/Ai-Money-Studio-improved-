"use client";

import {
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useMemo,
  useState
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, currency } from "@/lib/utils";
import { type HelocDisclosureUrls, type HelocApplicationFormInput } from "@/lib/heloc/types";
import { createEmptyHelocApplication, validateHelocApplication } from "@/lib/heloc/validation";

type HelocApplicationFormProps = {
  lenderName: string;
  disclosures: HelocDisclosureUrls;
};

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; reference: string; mode: "mock" | "api"; message: string }
  | { status: "error"; message: string };

const maritalStatusOptions = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "separated", label: "Separated" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" }
];

const citizenshipOptions = [
  { value: "us_citizen", label: "U.S. citizen" },
  { value: "permanent_resident", label: "Permanent resident" },
  { value: "non_permanent_resident", label: "Non-permanent resident" },
  { value: "other", label: "Other" }
];

const preferredContactMethodOptions = [
  { value: "email", label: "Email" },
  { value: "primary_phone", label: "Primary phone" },
  { value: "secondary_phone", label: "Secondary phone" },
  { value: "work_phone", label: "Work phone" }
];

const housingStatusOptions = [
  { value: "own", label: "Own" },
  { value: "rent", label: "Rent" },
  { value: "live_with_family", label: "Live with family" },
  { value: "other", label: "Other" }
];

const identificationTypeOptions = [
  { value: "drivers_license", label: "Driver's license" },
  { value: "state_id", label: "State ID" },
  { value: "military_id", label: "Military ID" },
  { value: "passport", label: "Passport" }
];

const occupancyOptions = [
  { value: "primary_residence", label: "Primary residence" },
  { value: "second_home", label: "Second home" },
  { value: "investment", label: "Investment property" }
];

const propertyTypeOptions = [
  { value: "single_family", label: "Single-family" },
  { value: "townhome", label: "Townhome" },
  { value: "condo", label: "Condo" },
  { value: "multi_family", label: "Multi-family" },
  { value: "manufactured", label: "Manufactured home" },
  { value: "other", label: "Other" }
];

const loanPurposeOptions = [
  { value: "home_improvement", label: "Home improvement" },
  { value: "debt_consolidation", label: "Debt consolidation" },
  { value: "major_expense", label: "Major expense" },
  { value: "reserve_line", label: "Emergency or reserve line" },
  { value: "other", label: "Other" }
];

const employmentStatusOptions = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-employed" },
  { value: "retired", label: "Retired" },
  { value: "unemployed", label: "Unemployed" },
  { value: "military", label: "Military" },
  { value: "other", label: "Other" }
];

const lienPositionOptions = [
  { value: "first", label: "First lien" },
  { value: "second", label: "Second lien" }
];

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" }
];

const disclosureItems = [
  {
    key: "reviewedHelocBrochure",
    urlKey: "helocBrochureUrl",
    title: "HELOC brochure",
    description: "Review product basics, line usage, draw periods, repayment, and variable-rate behavior."
  },
  {
    key: "reviewedEarlyDisclosures",
    urlKey: "earlyDisclosureUrl",
    title: "Early disclosures",
    description: "Review fees, rate assumptions, property requirements, and important application disclosures."
  },
  {
    key: "acceptedESign",
    urlKey: "eSignUrl",
    title: "E-SIGN consent",
    description: "Review how disclosures may be delivered electronically and what consent means for this application."
  },
  {
    key: "reviewedPrivacyNotice",
    urlKey: "privacyUrl",
    title: "Privacy notice",
    description: "Review how borrower information may be collected, used, and shared."
  }
] as const;

function setValueAtPath<T>(source: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const root = Array.isArray(source) ? [...source] : { ...(source as Record<string, unknown>) };
  let cursor = root as Record<string, unknown>;
  let original = source as unknown as Record<string, unknown>;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const originalValue = original[key] as Record<string, unknown>;
    const clonedValue = Array.isArray(originalValue) ? [...originalValue] : { ...originalValue };
    cursor[key] = clonedValue;
    cursor = clonedValue as Record<string, unknown>;
    original = originalValue;
  }

  cursor[keys[keys.length - 1]] = value as never;
  return root as T;
}

function getFieldId(path: string) {
  return `heloc-${path.split(".").join("-")}`;
}

function Field({
  label,
  path,
  error,
  hint,
  children,
  required = false
}: {
  label: string;
  path: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  const fieldId = getFieldId(path);
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--navy)]" htmlFor={fieldId}>
      <span className="flex items-center gap-2">
        {label}
        {required ? <span className="text-[var(--danger)]">*</span> : null}
      </span>
      {children}
      {hint ? <span id={hintId} className="text-xs font-normal text-[var(--muted)]">{hint}</span> : null}
      {error ? (
        <span id={errorId} className="text-xs font-semibold text-[var(--danger)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function Section({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[30px] p-6 sm:p-7">
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">{description}</p>
      </div>
      <div className="grid gap-5">{children}</div>
    </Card>
  );
}

function FormInput({
  path,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode
}: {
  path: string;
  value: string;
  onChange: (path: string, value: string) => void;
  onBlur: (path: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      id={getFieldId(path)}
      name={path}
      type={type}
      value={value}
      onChange={(event) => onChange(path, event.target.value)}
      onBlur={() => onBlur(path)}
      autoComplete={autoComplete}
      inputMode={inputMode}
      placeholder={placeholder}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${getFieldId(path)}-error` : undefined}
      className={cn(
        "rounded-2xl border bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]",
        error ? "border-[var(--danger)]" : "border-[var(--line)]"
      )}
    />
  );
}

function SelectInput({
  path,
  value,
  onChange,
  onBlur,
  error,
  options
}: {
  path: string;
  value: string;
  onChange: (path: string, value: string) => void;
  onBlur: (path: string) => void;
  error?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      id={getFieldId(path)}
      name={path}
      value={value}
      onChange={(event) => onChange(path, event.target.value)}
      onBlur={() => onBlur(path)}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${getFieldId(path)}-error` : undefined}
      className={cn(
        "rounded-2xl border bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]",
        error ? "border-[var(--danger)]" : "border-[var(--line)]"
      )}
    >
      <option value="">Select</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Checkbox({
  path,
  checked,
  onChange,
  error,
  label,
  description
}: {
  path: string;
  checked: boolean;
  onChange: (path: string, value: boolean) => void;
  error?: string;
  label: string;
  description: string;
}) {
  return (
    <label
      htmlFor={getFieldId(path)}
      className={cn(
        "flex gap-3 rounded-[22px] border px-4 py-4",
        error ? "border-[rgba(178,67,67,0.35)] bg-[rgba(178,67,67,0.06)]" : "border-[var(--line)] bg-white/90"
      )}
    >
      <input
        id={getFieldId(path)}
        name={path}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(path, event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-[var(--line-strong)] text-[var(--teal)]"
      />
      <span className="block">
        <span className="block text-sm font-semibold text-[var(--navy)]">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{description}</span>
        {error ? <span className="mt-2 block text-xs font-semibold text-[var(--danger)]">{error}</span> : null}
      </span>
    </label>
  );
}

export function HelocApplicationForm({ lenderName, disclosures }: HelocApplicationFormProps) {
  const [values, setValues] = useState<HelocApplicationFormInput>(() => createEmptyHelocApplication());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const [hasStartedApplication, setHasStartedApplication] = useState(false);

  const validationCount = useMemo(() => Object.keys(errors).length, [errors]);
  const showEmployerFields = ["employed", "self_employed", "military"].includes(values.employment.status);

  function updateField(path: string, nextValue: string | boolean) {
    setValues((current) => setValueAtPath(current, path, nextValue));
    setErrors((current) => {
      if (!current[path]) return current;
      const nextErrors = { ...current };
      delete nextErrors[path];
      return nextErrors;
    });
    if (submission.status !== "idle") {
      setSubmission({ status: "idle" });
    }
  }

  function updateConsent(path: string, checked: boolean) {
    const consentKey = path.replace("consents.", "");
    const timestampPath = `consentTimestamps.${consentKey}`;
    setValues((current) => {
      const withConsent = setValueAtPath(current, path, checked);
      return setValueAtPath(withConsent, timestampPath, checked ? new Date().toISOString() : null);
    });
    setErrors((current) => {
      if (!current[path]) return current;
      const nextErrors = { ...current };
      delete nextErrors[path];
      return nextErrors;
    });
    if (submission.status !== "idle") {
      setSubmission({ status: "idle" });
    }
  }

  function handleBlur(path: string) {
    const nextErrors = validateHelocApplication(values);
    setErrors((current) => {
      const merged = { ...current };
      if (nextErrors[path]) {
        merged[path] = nextErrors[path];
      } else {
        delete merged[path];
      }
      return merged;
    });
  }

  function copyApplicantAddressToProperty() {
    setValues((current) =>
      setValueAtPath(current, "property.address", {
        ...current.applicant.address
      })
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      ...values,
      meta: {
        ...values.meta,
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : values.meta.userAgent
      }
    };

    const nextErrors = validateHelocApplication(payload);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setValues(payload);
      setSubmission({
        status: "error",
        message: "Please review the highlighted fields before submitting."
      });
      document.getElementById("heloc-form-status")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    try {
      setSubmission({ status: "submitting" });
      setValues(payload);

      const response = await fetch("/api/heloc-applications", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseBody = (await response.json()) as {
        success: boolean;
        reference?: string;
        mode?: "mock" | "api";
        message?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok || !responseBody.success || !responseBody.reference || !responseBody.mode) {
        if (responseBody.fieldErrors) {
          setErrors(responseBody.fieldErrors);
        }
        throw new Error(responseBody.error ?? "Unable to submit the application.");
      }

      setErrors({});
      setSubmission({
        status: "success",
        reference: responseBody.reference,
        mode: responseBody.mode,
        message: responseBody.message ?? "Application submitted."
      });
      document.getElementById("heloc-form-status")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setSubmission({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to submit the application."
      });
    }
  }

  return (
    <form className="grid gap-6" noValidate onSubmit={handleSubmit}>
      <Card className="rounded-[30px] p-6 sm:p-7" id="heloc-form-status">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
              Online HELOC application
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em] text-[var(--navy)] sm:text-4xl">
              Apply with {lenderName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Complete Kitsap Bank&apos;s current-style home equity line application, review the required disclosures,
              and submit through the MeridianLink integration layer.
            </p>
          </div>
          <div className="rounded-[22px] border border-[var(--line)] bg-slate-50/90 px-4 py-3 text-sm text-[var(--muted)]">
            Current Kitsap Bank HELOC requests start at {currency(25000)} and remain subject to credit, collateral,
            and underwriting review.
          </div>
        </div>

        {submission.status === "error" ? (
          <div className="mt-5 rounded-[22px] border border-[rgba(178,67,67,0.24)] bg-[rgba(178,67,67,0.08)] px-4 py-4 text-sm text-[var(--danger)]">
            <p className="font-semibold">Submission needs attention</p>
            <p className="mt-1">{submission.message}</p>
          </div>
        ) : null}

        {submission.status === "success" ? (
          <div className="mt-5 rounded-[22px] border border-[rgba(30,142,99,0.24)] bg-[rgba(30,142,99,0.09)] px-4 py-4 text-sm text-[var(--success)]">
            <p className="font-semibold">Application received</p>
            <p className="mt-1">{submission.message}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--ocean)]">
              Reference {submission.reference} · {submission.mode === "mock" ? "Mock mode" : "API mode"}
            </p>
          </div>
        ) : null}

        {validationCount > 0 ? (
          <div className="mt-5 rounded-[22px] border border-[rgba(11,31,51,0.08)] bg-slate-50/90 px-4 py-4 text-sm text-[var(--muted)]">
            {validationCount} field{validationCount === 1 ? "" : "s"} still need review before the application can
            be submitted.
          </div>
        ) : null}

        {!hasStartedApplication ? (
          <div className="mt-6 grid gap-5">
            <div className="rounded-[26px] border border-[var(--line)] bg-white/95 p-5">
              <p className="text-sm leading-7 text-[var(--muted)]">
                Before getting started, please make sure you have completed the following items, as these will be
                needed in order to be able to submit your loan application.
              </p>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--navy)]">
                <p>• Identification - Have your Driver&apos;s License readily available.</p>
                <p>
                  • Unfreeze your Credit - If you have placed a freeze on your credit, please make sure you call the
                  appropriate credit bureaus to release your credit. Experian - 888.397.3742, Trans Union -
                  888.909.8872, Equifax - 888.298.0045.
                </p>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Once completed, please hit continue to start your application.
              </p>
            </div>

            <div className="rounded-[26px] border border-[rgba(11,31,51,0.08)] bg-[rgba(11,31,51,0.04)] p-5">
              <p className="text-sm font-semibold text-[var(--navy)]">Third-party application notice</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                You are about to leave Kitsap Bank&apos;s website. Third party websites are not covered by Kitsap
                Bank&apos;s Privacy Policy or security measures, nor does Kitsap Bank endorse, offer, guarantee, or
                recommend any product services offered on a third-party website.
              </p>
            </div>

            <div className="flex justify-start">
              <Button type="button" className="min-w-[180px]" onClick={() => setHasStartedApplication(true)}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {!hasStartedApplication ? null : (
        <>

      <Section
        title="Tell Us About Yourself"
        description="Use the same borrower details Kitsap Bank currently collects in its MeridianLink application, including contact preferences and identification."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="First name" path="applicant.firstName" error={errors["applicant.firstName"]} required>
            <FormInput
              path="applicant.firstName"
              value={values.applicant.firstName}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.firstName"]}
              autoComplete="given-name"
              placeholder="Jordan"
            />
          </Field>
          <Field label="Middle name" path="applicant.middleName" error={errors["applicant.middleName"]}>
            <FormInput
              path="applicant.middleName"
              value={values.applicant.middleName}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.middleName"]}
              autoComplete="additional-name"
              placeholder="A."
            />
          </Field>
          <Field label="Last name" path="applicant.lastName" error={errors["applicant.lastName"]} required>
            <FormInput
              path="applicant.lastName"
              value={values.applicant.lastName}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.lastName"]}
              autoComplete="family-name"
              placeholder="Fields"
            />
          </Field>
          <Field label="Suffix" path="applicant.suffix" error={errors["applicant.suffix"]}>
            <FormInput
              path="applicant.suffix"
              value={values.applicant.suffix}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.suffix"]}
              placeholder="Jr."
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Email address" path="applicant.email" error={errors["applicant.email"]} required>
            <FormInput
              path="applicant.email"
              value={values.applicant.email}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.email"]}
              autoComplete="email"
              placeholder="jordan@example.com"
            />
          </Field>
          <Field label="Mobile phone" path="applicant.phone" error={errors["applicant.phone"]} required>
            <FormInput
              path="applicant.phone"
              value={values.applicant.phone}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.phone"]}
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 555-1212"
            />
          </Field>
          <Field label="Secondary phone" path="applicant.secondaryPhone" error={errors["applicant.secondaryPhone"]}>
            <FormInput
              path="applicant.secondaryPhone"
              value={values.applicant.secondaryPhone}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.secondaryPhone"]}
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 555-1213"
            />
          </Field>
          <Field label="Work phone" path="applicant.workPhone" error={errors["applicant.workPhone"]}>
            <FormInput
              path="applicant.workPhone"
              value={values.applicant.workPhone}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.workPhone"]}
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 555-1214"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date of birth" path="applicant.dateOfBirth" error={errors["applicant.dateOfBirth"]} required>
            <FormInput
              path="applicant.dateOfBirth"
              value={values.applicant.dateOfBirth}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.dateOfBirth"]}
              type="date"
            />
          </Field>
          <Field
            label="Social Security number (last 4)"
            path="applicant.ssnLast4"
            error={errors["applicant.ssnLast4"]}
            hint="Only the last four digits are collected in this flow."
            required
          >
            <FormInput
              path="applicant.ssnLast4"
              value={values.applicant.ssnLast4}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.ssnLast4"]}
              inputMode="numeric"
              placeholder="1234"
            />
          </Field>
          <Field
            label="Preferred contact method"
            path="applicant.preferredContactMethod"
            error={errors["applicant.preferredContactMethod"]}
          >
            <SelectInput
              path="applicant.preferredContactMethod"
              value={values.applicant.preferredContactMethod}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.preferredContactMethod"]}
              options={preferredContactMethodOptions}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Marital status" path="applicant.maritalStatus" error={errors["applicant.maritalStatus"]} required>
            <SelectInput
              path="applicant.maritalStatus"
              value={values.applicant.maritalStatus}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.maritalStatus"]}
              options={maritalStatusOptions}
            />
          </Field>
          <Field
            label="Citizenship status"
            path="applicant.citizenshipStatus"
            error={errors["applicant.citizenshipStatus"]}
            required
          >
            <SelectInput
              path="applicant.citizenshipStatus"
              value={values.applicant.citizenshipStatus}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.citizenshipStatus"]}
              options={citizenshipOptions}
            />
          </Field>
        </div>

        <div className="rounded-[24px] border border-[var(--line)] bg-slate-50/85 p-5">
          <p className="text-sm font-semibold text-[var(--navy)]">Identification</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Have your driver&apos;s license or another government-issued ID ready before you submit.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="ID type" path="applicant.identification.idType" error={errors["applicant.identification.idType"]} required>
              <SelectInput
                path="applicant.identification.idType"
                value={values.applicant.identification.idType}
                onChange={updateField}
                onBlur={handleBlur}
                error={errors["applicant.identification.idType"]}
                options={identificationTypeOptions}
              />
            </Field>
            <Field label="ID number" path="applicant.identification.idNumber" error={errors["applicant.identification.idNumber"]} required>
              <FormInput
                path="applicant.identification.idNumber"
                value={values.applicant.identification.idNumber}
                onChange={updateField}
                onBlur={handleBlur}
                error={errors["applicant.identification.idNumber"]}
                placeholder="WDL123456789"
              />
            </Field>
            <Field label="ID state" path="applicant.identification.idState" error={errors["applicant.identification.idState"]} required>
              <FormInput
                path="applicant.identification.idState"
                value={values.applicant.identification.idState}
                onChange={updateField}
                onBlur={handleBlur}
                error={errors["applicant.identification.idState"]}
                placeholder="WA"
              />
            </Field>
            <Field
              label="ID date issued"
              path="applicant.identification.idIssuedDate"
              error={errors["applicant.identification.idIssuedDate"]}
              required
            >
              <FormInput
                path="applicant.identification.idIssuedDate"
                value={values.applicant.identification.idIssuedDate}
                onChange={updateField}
                onBlur={handleBlur}
                error={errors["applicant.identification.idIssuedDate"]}
                type="date"
              />
            </Field>
            <Field
              label="ID expiration date"
              path="applicant.identification.idExpirationDate"
              error={errors["applicant.identification.idExpirationDate"]}
              required
            >
              <FormInput
                path="applicant.identification.idExpirationDate"
                value={values.applicant.identification.idExpirationDate}
                onChange={updateField}
                onBlur={handleBlur}
                error={errors["applicant.identification.idExpirationDate"]}
                type="date"
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        title="Current Physical Address"
        description="Use your current physical address exactly as Kitsap Bank&apos;s live application requests it."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Street address" path="applicant.address.street1" error={errors["applicant.address.street1"]} required>
            <FormInput
              path="applicant.address.street1"
              value={values.applicant.address.street1}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.address.street1"]}
              autoComplete="address-line1"
              placeholder="100 Harbor Lane"
            />
          </Field>
          <Field label="Apartment, suite, or unit" path="applicant.address.street2" error={errors["applicant.address.street2"]}>
            <FormInput
              path="applicant.address.street2"
              value={values.applicant.address.street2}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.address.street2"]}
              autoComplete="address-line2"
              placeholder="Unit 3A"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" path="applicant.address.city" error={errors["applicant.address.city"]} required>
            <FormInput
              path="applicant.address.city"
              value={values.applicant.address.city}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.address.city"]}
              autoComplete="address-level2"
              placeholder="Seattle"
            />
          </Field>
          <Field label="State" path="applicant.address.state" error={errors["applicant.address.state"]} required>
            <FormInput
              path="applicant.address.state"
              value={values.applicant.address.state}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.address.state"]}
              autoComplete="address-level1"
              placeholder="WA"
            />
          </Field>
          <Field label="ZIP code" path="applicant.address.postalCode" error={errors["applicant.address.postalCode"]} required>
            <FormInput
              path="applicant.address.postalCode"
              value={values.applicant.address.postalCode}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.address.postalCode"]}
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="98101"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Housing status" path="applicant.housingStatus" error={errors["applicant.housingStatus"]} required>
            <SelectInput
              path="applicant.housingStatus"
              value={values.applicant.housingStatus}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.housingStatus"]}
              options={housingStatusOptions}
            />
          </Field>
          <Field label="Years at current address" path="applicant.yearsAtAddress" error={errors["applicant.yearsAtAddress"]} required>
            <FormInput
              path="applicant.yearsAtAddress"
              value={values.applicant.yearsAtAddress}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.yearsAtAddress"]}
              inputMode="decimal"
              placeholder="5"
            />
          </Field>
          <Field label="Months at current address" path="applicant.monthsAtAddress" error={errors["applicant.monthsAtAddress"]} required>
            <FormInput
              path="applicant.monthsAtAddress"
              value={values.applicant.monthsAtAddress}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["applicant.monthsAtAddress"]}
              inputMode="numeric"
              placeholder="0"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Provide loan information"
        description="These fields follow Kitsap Bank&apos;s current HELOC intake, including ZIP code, branch, occupancy, and loan officer questions."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="ZIP code" path="loan.zipCode" error={errors["loan.zipCode"]} required>
            <FormInput
              path="loan.zipCode"
              value={values.loan.zipCode}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.zipCode"]}
              inputMode="numeric"
              placeholder="98366"
            />
          </Field>
          <Field label="Branch location" path="loan.branchLocation" error={errors["loan.branchLocation"]} required>
            <FormInput
              path="loan.branchLocation"
              value={values.loan.branchLocation}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.branchLocation"]}
              placeholder="Port Orchard"
            />
          </Field>
          <Field label="Requested line amount" path="loan.requestedLineAmount" error={errors["loan.requestedLineAmount"]} required>
            <FormInput
              path="loan.requestedLineAmount"
              value={values.loan.requestedLineAmount}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.requestedLineAmount"]}
              inputMode="decimal"
              placeholder="85000"
            />
          </Field>
          <Field label="Loan purpose" path="loan.purpose" error={errors["loan.purpose"]} required>
            <SelectInput
              path="loan.purpose"
              value={values.loan.purpose}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.purpose"]}
              options={loanPurposeOptions}
            />
          </Field>
          <Field label="Occupancy" path="loan.occupancy" error={errors["loan.occupancy"]} required>
            <SelectInput
              path="loan.occupancy"
              value={values.loan.occupancy}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.occupancy"]}
              options={occupancyOptions}
            />
          </Field>
          <Field label="Lien position" path="loan.lienPosition" error={errors["loan.lienPosition"]} required>
            <SelectInput
              path="loan.lienPosition"
              value={values.loan.lienPosition}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.lienPosition"]}
              options={lienPositionOptions}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Estimated CLTV (%)" path="loan.estimatedCLTV" error={errors["loan.estimatedCLTV"]} required>
            <FormInput
              path="loan.estimatedCLTV"
              value={values.loan.estimatedCLTV}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.estimatedCLTV"]}
              inputMode="decimal"
              placeholder="72"
            />
          </Field>
          <Field
            label="Requested draw at closing"
            path="loan.requestedDrawAtClosing"
            error={errors["loan.requestedDrawAtClosing"]}
            required
          >
            <FormInput
              path="loan.requestedDrawAtClosing"
              value={values.loan.requestedDrawAtClosing}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.requestedDrawAtClosing"]}
              inputMode="decimal"
              placeholder="15000"
            />
          </Field>
          <Field label="Loan officer" path="loan.branchOrOfficer" error={errors["loan.branchOrOfficer"]}>
            <FormInput
              path="loan.branchOrOfficer"
              value={values.loan.branchOrOfficer}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.branchOrOfficer"]}
              placeholder="If applicable"
            />
          </Field>
          <Field label="Promo code" path="loan.promoCode" error={errors["loan.promoCode"]}>
            <FormInput
              path="loan.promoCode"
              value={values.loan.promoCode}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.promoCode"]}
              placeholder="SPRING26"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Has a contractor done construction or renovations within the past 90 days?"
            path="loan.contractorWorkLast90Days"
            error={errors["loan.contractorWorkLast90Days"]}
            required
          >
            <SelectInput
              path="loan.contractorWorkLast90Days"
              value={values.loan.contractorWorkLast90Days}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.contractorWorkLast90Days"]}
              options={yesNoOptions}
            />
          </Field>
          <Field
            label="Are you currently working with a loan officer?"
            path="loan.workingWithLoanOfficer"
            error={errors["loan.workingWithLoanOfficer"]}
            required
          >
            <SelectInput
              path="loan.workingWithLoanOfficer"
              value={values.loan.workingWithLoanOfficer}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.workingWithLoanOfficer"]}
              options={yesNoOptions}
            />
          </Field>
          <Field label="Current mortgage payment" path="loan.currentMortgagePayment" error={errors["loan.currentMortgagePayment"]}>
            <FormInput
              path="loan.currentMortgagePayment"
              value={values.loan.currentMortgagePayment}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["loan.currentMortgagePayment"]}
              inputMode="decimal"
              placeholder="2150"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Property information"
        description="Share the property details and existing lien balances for the subject property."
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={copyApplicantAddressToProperty}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--teal)]"
          >
            Use current address
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property street address" path="property.address.street1" error={errors["property.address.street1"]} required>
            <FormInput
              path="property.address.street1"
              value={values.property.address.street1}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.address.street1"]}
              placeholder="100 Harbor Lane"
            />
          </Field>
          <Field label="Apartment, suite, or unit" path="property.address.street2" error={errors["property.address.street2"]}>
            <FormInput
              path="property.address.street2"
              value={values.property.address.street2}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.address.street2"]}
              placeholder="Unit 3A"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" path="property.address.city" error={errors["property.address.city"]} required>
            <FormInput
              path="property.address.city"
              value={values.property.address.city}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.address.city"]}
              placeholder="Seattle"
            />
          </Field>
          <Field label="State" path="property.address.state" error={errors["property.address.state"]} required>
            <FormInput
              path="property.address.state"
              value={values.property.address.state}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.address.state"]}
              placeholder="WA"
            />
          </Field>
          <Field label="ZIP code" path="property.address.postalCode" error={errors["property.address.postalCode"]} required>
            <FormInput
              path="property.address.postalCode"
              value={values.property.address.postalCode}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.address.postalCode"]}
              inputMode="numeric"
              placeholder="98101"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Property type" path="property.propertyType" error={errors["property.propertyType"]} required>
            <SelectInput
              path="property.propertyType"
              value={values.property.propertyType}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.propertyType"]}
              options={propertyTypeOptions}
            />
          </Field>
          <Field label="Unit count" path="property.unitCount" error={errors["property.unitCount"]} required>
            <FormInput
              path="property.unitCount"
              value={values.property.unitCount}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.unitCount"]}
              inputMode="numeric"
              placeholder="1"
            />
          </Field>
          <Field label="Occupancy" path="property.occupancy" error={errors["property.occupancy"]} required>
            <SelectInput
              path="property.occupancy"
              value={values.property.occupancy}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.occupancy"]}
              options={occupancyOptions}
            />
          </Field>
          <Field label="Year acquired" path="property.yearAcquired" error={errors["property.yearAcquired"]} required>
            <FormInput
              path="property.yearAcquired"
              value={values.property.yearAcquired}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.yearAcquired"]}
              inputMode="numeric"
              placeholder="2016"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Estimated property value" path="property.estimatedValue" error={errors["property.estimatedValue"]} required>
            <FormInput
              path="property.estimatedValue"
              value={values.property.estimatedValue}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.estimatedValue"]}
              inputMode="decimal"
              placeholder="650000"
            />
          </Field>
          <Field
            label="Estimated first mortgage balance"
            path="property.estimatedFirstMortgageBalance"
            error={errors["property.estimatedFirstMortgageBalance"]}
            required
          >
            <FormInput
              path="property.estimatedFirstMortgageBalance"
              value={values.property.estimatedFirstMortgageBalance}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.estimatedFirstMortgageBalance"]}
              inputMode="decimal"
              placeholder="315000"
            />
          </Field>
          <Field
            label="Estimated second lien balance"
            path="property.estimatedSecondLienBalance"
            error={errors["property.estimatedSecondLienBalance"]}
          >
            <FormInput
              path="property.estimatedSecondLienBalance"
              value={values.property.estimatedSecondLienBalance}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["property.estimatedSecondLienBalance"]}
              inputMode="decimal"
              placeholder="0"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Financial Information"
        description="Use your current employment and income details. Other income only needs to be disclosed if you want it considered."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Employment status" path="employment.status" error={errors["employment.status"]} required>
            <SelectInput
              path="employment.status"
              value={values.employment.status}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["employment.status"]}
              options={employmentStatusOptions}
            />
          </Field>
          <Field label="Employer name" path="employment.employerName" error={errors["employment.employerName"]}>
            <FormInput
              path="employment.employerName"
              value={values.employment.employerName}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["employment.employerName"]}
              placeholder="Harbor Manufacturing"
            />
          </Field>
          <Field label="Title" path="employment.title" error={errors["employment.title"]}>
            <FormInput
              path="employment.title"
              value={values.employment.title}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["employment.title"]}
              placeholder="Operations manager"
            />
          </Field>
          <Field label="Years with employer" path="employment.yearsWithEmployer" error={errors["employment.yearsWithEmployer"]}>
            <FormInput
              path="employment.yearsWithEmployer"
              value={values.employment.yearsWithEmployer}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["employment.yearsWithEmployer"]}
              inputMode="decimal"
              placeholder="7"
            />
          </Field>
        </div>

        <Checkbox
          path="employment.businessOwner"
          checked={values.employment.businessOwner}
          onChange={updateField}
          label="I own 25% or more of the business listed above."
          description={
            showEmployerFields
              ? "Use this if the employer is a business you materially own or control."
              : "Leave this unchecked unless your income comes from a business you materially own."
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Monthly gross income" path="income.monthlyGrossIncome" error={errors["income.monthlyGrossIncome"]} required>
            <FormInput
              path="income.monthlyGrossIncome"
              value={values.income.monthlyGrossIncome}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["income.monthlyGrossIncome"]}
              inputMode="decimal"
              placeholder="12500"
            />
          </Field>
          <Field label="Other monthly income" path="income.otherMonthlyIncome" error={errors["income.otherMonthlyIncome"]}>
            <FormInput
              path="income.otherMonthlyIncome"
              value={values.income.otherMonthlyIncome}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["income.otherMonthlyIncome"]}
              inputMode="decimal"
              placeholder="0"
            />
          </Field>
          <Field
            label="Other income description"
            path="income.otherIncomeDescription"
            error={errors["income.otherIncomeDescription"]}
            hint="Required when other monthly income is greater than zero."
          >
            <FormInput
              path="income.otherIncomeDescription"
              value={values.income.otherIncomeDescription}
              onChange={updateField}
              onBlur={handleBlur}
              error={errors["income.otherIncomeDescription"]}
              placeholder="Rental income"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Disclosures and consents"
        description="Review the linked disclosures before submitting. Acknowledgements and timestamps are stored in the audit record with your application."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {disclosureItems.map((item) => {
            const href =
              item.urlKey === "helocBrochureUrl"
                ? disclosures.helocBrochureUrl
                : item.urlKey === "earlyDisclosureUrl"
                  ? disclosures.earlyDisclosureUrl
                  : item.urlKey === "eSignUrl"
                    ? disclosures.eSignUrl
                    : disclosures.privacyUrl;

            return (
              <div key={item.title} className="rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-[var(--navy)]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
                  </div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--teal)]"
                  >
                    Open
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3">
          <Checkbox
            path="consents.reviewedHelocBrochure"
            checked={values.consents.reviewedHelocBrochure}
            onChange={updateConsent}
            error={errors["consents.reviewedHelocBrochure"]}
            label="I reviewed the HELOC brochure."
            description="I opened and reviewed the HELOC product brochure before submitting this application."
          />
          <Checkbox
            path="consents.reviewedEarlyDisclosures"
            checked={values.consents.reviewedEarlyDisclosures}
            onChange={updateConsent}
            error={errors["consents.reviewedEarlyDisclosures"]}
            label="I reviewed the early disclosures."
            description="I opened and reviewed the early disclosures and fee information provided with this Kitsap Bank application."
          />
          <Checkbox
            path="consents.acceptedESign"
            checked={values.consents.acceptedESign}
            onChange={updateConsent}
            error={errors["consents.acceptedESign"]}
            label="I consent to electronic records and signatures."
            description="I reviewed the E-SIGN consent and agree that disclosures and signatures may be handled electronically where permitted."
          />
          <Checkbox
            path="consents.acceptedCreditPull"
            checked={values.consents.acceptedCreditPull}
            onChange={updateConsent}
            error={errors["consents.acceptedCreditPull"]}
            label="I authorize the lender to obtain credit and verification information."
            description="I authorize the lender to pull credit and verify information in connection with this HELOC application."
          />
          <Checkbox
            path="consents.certifiedInformation"
            checked={values.consents.certifiedInformation}
            onChange={updateConsent}
            error={errors["consents.certifiedInformation"]}
            label="I certify the information I provided is accurate to the best of my knowledge."
            description="I understand the application may be declined if the information I supplied is incomplete, inaccurate, or misleading."
          />
        </div>
      </Section>

      <Card className="rounded-[30px] p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Ready to submit
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              This application will be validated server-side, normalized, and then routed through the MeridianLink
              integration layer in either mock or API mode.
            </p>
          </div>
          <Button type="submit" className="min-w-[220px]">
            {submission.status === "submitting" ? "Submitting..." : "Submit HELOC application"}
          </Button>
        </div>
      </Card>
        </>
      )}
    </form>
  );
}
