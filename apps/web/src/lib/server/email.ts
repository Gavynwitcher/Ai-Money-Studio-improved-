type ContactOwnerAlertInput = {
  inquiryId: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  createdAt: Date;
};

type ContactOwnerAlertResult =
  | { status: "sent"; providerId: string | null; error: null }
  | { status: "pending_configuration"; providerId: null; error: string }
  | { status: "failed"; providerId: null; error: string };

type ContactCustomerConfirmationInput = {
  inquiryId: string;
  name: string;
  email: string;
  createdAt: Date;
};

type ContactCustomerConfirmationResult = ContactOwnerAlertResult;

type TransactionalEmailInput = {
  to: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  tags?: string[];
};

type TransactionalEmailResult =
  | { status: "sent"; providerId: string | null; error: null }
  | { status: "pending_configuration"; providerId: null; error: string }
  | { status: "failed"; providerId: null; error: string };

type EmailProvider = "brevo" | "resend" | null;

function getOwnerRecipient() {
  return process.env.CONTACT_OWNER_ALERT_TO?.trim() || "sales@hibark.com";
}

function getFromAddress() {
  return (
    process.env.BREVO_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "hello@northline.app"
  );
}

function getFromName() {
  return process.env.BREVO_FROM_NAME?.trim() || process.env.CONTACT_FROM_NAME?.trim() || "Northline";
}

function getEmailProvider(): EmailProvider {
  if (process.env.BREVO_API_KEY?.trim()) return "brevo";
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  return null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendViaBrevo(input: TransactionalEmailInput): Promise<TransactionalEmailResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    return {
      status: "pending_configuration",
      providerId: null,
      error: "BREVO_API_KEY is not configured."
    };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        Accept: "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: getFromName(),
          email: getFromAddress()
        },
        to: input.to.map((email) => ({ email })),
        replyTo: input.replyTo ? { email: input.replyTo } : undefined,
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
        tags: input.tags
      })
    });

    const payload = (await response.json().catch(() => ({}))) as {
      messageId?: string;
      code?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        status: "failed",
        providerId: null,
        error: payload.message || payload.code || "Brevo rejected the request."
      };
    }

    return {
      status: "sent",
      providerId: payload.messageId ?? null,
      error: null
    };
  } catch (error) {
    return {
      status: "failed",
      providerId: null,
      error: error instanceof Error ? error.message : "Unknown Brevo delivery error."
    };
  }
}

async function sendViaResend(input: TransactionalEmailInput): Promise<TransactionalEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      status: "pending_configuration",
      providerId: null,
      error: "RESEND_API_KEY is not configured."
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: input.to,
        reply_to: input.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      return {
        status: "failed",
        providerId: null,
        error: payload.message || payload.error || "Resend rejected the request."
      };
    }

    return {
      status: "sent",
      providerId: payload.id ?? null,
      error: null
    };
  } catch (error) {
    return {
      status: "failed",
      providerId: null,
      error: error instanceof Error ? error.message : "Unknown Resend delivery error."
    };
  }
}

async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<TransactionalEmailResult> {
  const provider = getEmailProvider();

  if (provider === "brevo") {
    return sendViaBrevo(input);
  }

  if (provider === "resend") {
    return sendViaResend(input);
  }

  return {
    status: "pending_configuration",
    providerId: null,
    error: "No transactional email provider is configured. Add BREVO_API_KEY or RESEND_API_KEY."
  };
}

export function getContactOwnerRecipient() {
  return getOwnerRecipient();
}

export async function sendContactOwnerAlert(input: ContactOwnerAlertInput): Promise<ContactOwnerAlertResult> {
  const recipient = getOwnerRecipient();
  const subject = `New Northline contact inquiry from ${input.name}`;
  const submittedAt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(input.createdAt);

  const safeInquiryId = escapeHtml(input.inquiryId.slice(0, 8).toUpperCase());
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeCompany = escapeHtml(input.company || "Not provided");
  const safeSubmittedAt = escapeHtml(submittedAt);
  const safeMessage = escapeHtml(input.message);

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0b1f33; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">New contact inquiry</h2>
      <p style="margin: 0 0 16px;">A new request was submitted through Northline.</p>
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
        <tr><td style="padding: 8px 0; font-weight: 700;">Reference</td><td style="padding: 8px 0;">${safeInquiryId}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Name</td><td style="padding: 8px 0;">${safeName}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Email</td><td style="padding: 8px 0;">${safeEmail}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Company</td><td style="padding: 8px 0;">${safeCompany}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Submitted</td><td style="padding: 8px 0;">${safeSubmittedAt}</td></tr>
      </table>
      <div style="padding: 16px; background: #f5f8fb; border: 1px solid #d9e3ec; border-radius: 12px;">
        <p style="margin: 0 0 8px; font-weight: 700;">Message</p>
        <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
      </div>
    </div>
  `;

  const text = [
    "New contact inquiry",
    "",
    `Reference: ${input.inquiryId.slice(0, 8).toUpperCase()}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Company: ${input.company || "Not provided"}`,
    `Submitted: ${submittedAt}`,
    "",
    "Message:",
    input.message
  ].join("\n");

  return sendTransactionalEmail({
    to: [recipient],
    replyTo: input.email,
    subject,
    html,
    text,
    tags: ["northline", "contact-inquiry"]
  });
}

export async function sendContactCustomerConfirmation(
  input: ContactCustomerConfirmationInput
): Promise<ContactCustomerConfirmationResult> {
  const submittedAt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(input.createdAt);

  const safeName = escapeHtml(input.name);
  const safeReference = escapeHtml(input.inquiryId.slice(0, 8).toUpperCase());
  const safeSubmittedAt = escapeHtml(submittedAt);
  const subject = "We received your Northline request";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0b1f33; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">Your request is in queue</h2>
      <p style="margin: 0 0 12px;">Hi ${safeName},</p>
      <p style="margin: 0 0 16px;">
        Thanks for reaching out to Northline. We logged your request and our team will follow up shortly.
      </p>
      <div style="padding: 16px; background: #f5f8fb; border: 1px solid #d9e3ec; border-radius: 12px;">
        <p style="margin: 0 0 8px; font-weight: 700;">Reference</p>
        <p style="margin: 0 0 12px;">${safeReference}</p>
        <p style="margin: 0 0 8px; font-weight: 700;">Submitted</p>
        <p style="margin: 0;">${safeSubmittedAt}</p>
      </div>
      <p style="margin: 16px 0 0;">
        You can continue reviewing Northline while we prepare next steps for onboarding, account connectivity, and workflow fit.
      </p>
    </div>
  `;

  const text = [
    "We received your Northline request",
    "",
    `Hi ${input.name},`,
    "",
    "Thanks for reaching out to Northline. We logged your request and our team will follow up shortly.",
    "",
    `Reference: ${input.inquiryId.slice(0, 8).toUpperCase()}`,
    `Submitted: ${submittedAt}`
  ].join("\n");

  return sendTransactionalEmail({
    to: [input.email],
    subject,
    html,
    text,
    tags: ["northline", "contact-confirmation"]
  });
}
