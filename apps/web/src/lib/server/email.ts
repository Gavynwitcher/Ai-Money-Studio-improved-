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

function getOwnerRecipient() {
  return process.env.CONTACT_OWNER_ALERT_TO?.trim() || "sales@hibark.com";
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
}

export function getContactOwnerRecipient() {
  return getOwnerRecipient();
}

export async function sendContactOwnerAlert(input: ContactOwnerAlertInput): Promise<ContactOwnerAlertResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    return {
      status: "pending_configuration",
      providerId: null,
      error: "RESEND_API_KEY is not configured."
    };
  }

  const recipient = getOwnerRecipient();
  const subject = `New Northline contact inquiry from ${input.name}`;
  const submittedAt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(input.createdAt);

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0b1f33; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">New contact inquiry</h2>
      <p style="margin: 0 0 16px;">A new request was submitted through Northline.</p>
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
        <tr><td style="padding: 8px 0; font-weight: 700;">Reference</td><td style="padding: 8px 0;">${input.inquiryId.slice(0, 8).toUpperCase()}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Name</td><td style="padding: 8px 0;">${input.name}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Email</td><td style="padding: 8px 0;">${input.email}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Company</td><td style="padding: 8px 0;">${input.company || "Not provided"}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Submitted</td><td style="padding: 8px 0;">${submittedAt}</td></tr>
      </table>
      <div style="padding: 16px; background: #f5f8fb; border: 1px solid #d9e3ec; border-radius: 12px;">
        <p style="margin: 0 0 8px; font-weight: 700;">Message</p>
        <p style="margin: 0; white-space: pre-wrap;">${input.message}</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [recipient],
        reply_to: input.email,
        subject,
        html
      })
    });

    const payload = (await response.json()) as { id?: string; message?: string; error?: string };
    if (!response.ok) {
      return {
        status: "failed",
        providerId: null,
        error: payload.message || payload.error || "Email provider rejected the request."
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
      error: error instanceof Error ? error.message : "Unknown email delivery error."
    };
  }
}
