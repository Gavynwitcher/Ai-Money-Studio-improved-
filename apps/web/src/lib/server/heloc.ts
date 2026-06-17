import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { getMeridianLinkConfig } from "@/lib/heloc/config";
import {
  buildMeridianLinkMappedFields,
  meridianLinkFieldMapProfile
} from "@/lib/heloc/meridianlink-field-map";
import { normalizeHelocApplication } from "@/lib/heloc/validation";
import {
  type HelocApplicationFormInput,
  type MeridianLinkSubmissionEnvelope
} from "@/lib/heloc/types";

type SubmissionSuccess = {
  success: true;
  status: number;
  body: {
    success: true;
    reference: string;
    submittedAt: string;
    mode: "mock" | "api";
    message: string;
  };
};

type SubmissionFailure = {
  success: false;
  status: number;
  body: {
    success: false;
    code: string;
    error: string;
    fieldErrors?: Record<string, string>;
  };
};

function resolveRuntimeDirectory() {
  const cwd = process.cwd();
  const appRoot = cwd.endsWith(path.join("apps", "web")) ? cwd : path.join(cwd, "apps", "web");
  return path.join(appRoot, ".runtime", "heloc");
}

async function ensureRuntimeDirectories() {
  const runtimeDir = resolveRuntimeDirectory();
  const previewDir = path.join(runtimeDir, "previews");
  await mkdir(previewDir, { recursive: true });
  return { runtimeDir, previewDir };
}

function getIpAddress(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip")?.trim() || null;
}

function buildReference() {
  return `HELOC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

async function writeAuditEvent(event: Record<string, unknown>) {
  const { runtimeDir } = await ensureRuntimeDirectories();
  await appendFile(path.join(runtimeDir, "audit-log.jsonl"), `${JSON.stringify(event)}\n`, "utf8");
}

async function writePreview(reference: string, payload: Record<string, unknown>) {
  const { previewDir } = await ensureRuntimeDirectories();
  const filePath = path.join(previewDir, `${reference}.json`);
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

function buildMeridianLinkPayload(
  reference: string,
  lenderName: string,
  submittedAt: string,
  application: NonNullable<ReturnType<typeof normalizeHelocApplication>["data"]>
): MeridianLinkSubmissionEnvelope {
  const envelope: MeridianLinkSubmissionEnvelope = {
    submission: {
      reference,
      submittedAt,
      lenderName,
      mappingProfile: meridianLinkFieldMapProfile
    },
    application,
    mappedFields: {}
  };

  return {
    ...envelope,
    mappedFields: buildMeridianLinkMappedFields(envelope)
  };
}

export async function submitHelocApplication(
  input: HelocApplicationFormInput,
  request: NextRequest
): Promise<SubmissionSuccess | SubmissionFailure> {
  const config = getMeridianLinkConfig();
  const reference = buildReference();
  const submittedAt = new Date().toISOString();
  const userAgent = request.headers.get("user-agent") || input.meta.userAgent || "";
  const ipAddress = getIpAddress(request) ?? input.meta.ipAddress ?? null;

  const normalization = normalizeHelocApplication(input, {
    disclosures: config.disclosures,
    userAgent,
    ipAddress,
    submittedAt
  });

  if (!normalization.data) {
    return {
      success: false,
      status: 422,
      body: {
        success: false,
        code: "VALIDATION_ERROR",
        error: "Please review the highlighted fields and try again.",
        fieldErrors: normalization.fieldErrors
      }
    };
  }

  const meridianLinkPayload = buildMeridianLinkPayload(
    reference,
    config.lenderName,
    submittedAt,
    normalization.data
  );

  const auditBase = {
    reference,
    submittedAt,
    mode: config.mode,
    lenderName: config.lenderName,
    applicantEmail: normalization.data.applicant.email,
    applicantName: `${normalization.data.applicant.firstName} ${normalization.data.applicant.lastName}`.trim(),
    requestedLineAmount: normalization.data.loan.requestedLineAmount,
    purpose: normalization.data.loan.purpose,
    consents: normalization.data.consents,
    consentTimestamps: normalization.data.consentTimestamps,
    userAgent: normalization.data.meta.userAgent,
    ipAddress: normalization.data.meta.ipAddress
  };

  if (config.mode === "mock") {
    await writePreview(reference, meridianLinkPayload);
    await writeAuditEvent({
      ...auditBase,
      status: "mock_saved"
    });

    return {
      success: true,
      status: 201,
      body: {
        success: true,
        reference,
        submittedAt,
        mode: "mock",
        message:
          "Application received. MeridianLink mock preview was saved locally for internal review."
      }
    };
  }

  if (!config.endpoint || !config.apiKey) {
    await writeAuditEvent({
      ...auditBase,
      status: "configuration_error",
      endpointConfigured: Boolean(config.endpoint)
    });

    return {
      success: false,
      status: 500,
      body: {
        success: false,
        code: "CONFIGURATION_ERROR",
        error:
          "MeridianLink API mode is enabled, but the endpoint or API key is missing on the server."
      }
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
        "x-api-key": config.apiKey
      },
      body: JSON.stringify(meridianLinkPayload),
      signal: controller.signal
    });
    const responseText = await response.text();
    const responseBody = safeParseJson(responseText);

    if (!response.ok) {
      await writeAuditEvent({
        ...auditBase,
        status: "upstream_error",
        upstreamStatus: response.status,
        upstreamBody: responseBody ?? responseText.slice(0, 500)
      });

      return {
        success: false,
        status: 502,
        body: {
          success: false,
          code: "UPSTREAM_ERROR",
          error:
            "The application was validated, but MeridianLink did not accept the submission. Review server logs and configuration before retrying."
        }
      };
    }

    await writeAuditEvent({
      ...auditBase,
      status: "submitted",
      upstreamStatus: response.status,
      upstreamReference:
        response.headers.get("x-request-id") ??
        (responseBody &&
        typeof responseBody === "object" &&
        "reference" in responseBody &&
        typeof responseBody.reference === "string"
          ? responseBody.reference
          : null)
    });

    return {
      success: true,
      status: 201,
      body: {
        success: true,
        reference,
        submittedAt,
        mode: "api",
        message: "Application received and forwarded to MeridianLink."
      }
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `MeridianLink request timed out after ${config.timeoutMs}ms.`
        : error instanceof Error
          ? error.message
          : "Unknown MeridianLink submission error.";

    await writeAuditEvent({
      ...auditBase,
      status: "network_error",
      error: message
    });

    return {
      success: false,
      status: 502,
      body: {
        success: false,
        code: "NETWORK_ERROR",
        error:
          "The application was validated, but the MeridianLink connection failed. Please try again shortly."
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}
