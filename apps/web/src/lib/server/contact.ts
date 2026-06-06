import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  getContactOwnerRecipient,
  sendContactCustomerConfirmation,
  sendContactOwnerAlert
} from "@/lib/server/email";

export type ContactSubmissionInput = {
  name: string;
  email: string;
  company?: string;
  message: string;
};

export type ContactNotificationPayload = {
  id: string;
  title: string;
  message: string;
  channel: string;
  sentAt: string;
  acknowledgedAt: string | null;
};

export type ContactInquiryPayload = {
  id: string;
  reference: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
  createdAt: string;
  ownerAlertEmail: string;
  ownerAlertStatus: string;
  ownerAlertSentAt: string | null;
  ownerAlertError: string | null;
  notifications: ContactNotificationPayload[];
};

type LocalContactNotificationRecord = {
  id: string;
  title: string;
  message: string;
  channel: string;
  sentAt: string;
  acknowledgedAt: string | null;
};

type LocalContactInquiryRecord = {
  id: string;
  name: string;
  email: string;
  emailNormalized: string;
  company: string | null;
  message: string;
  status: string;
  source: string;
  ownerAlertEmail: string;
  ownerAlertStatus: string;
  ownerAlertSentAt: string | null;
  ownerAlertError: string | null;
  createdAt: string;
  updatedAt: string;
  notifications: LocalContactNotificationRecord[];
};

const LOCAL_CONTACT_STORE_PATH = join(process.cwd(), ".northline-local", "contact-inquiries.json");

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateInput(input: ContactSubmissionInput) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const company = input.company?.trim() || null;
  const message = input.message.trim();

  if (!name || !email || !message) {
    throw new Error("Please complete the required fields.");
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (name.length > 120) {
    throw new Error("Keep the name under 120 characters.");
  }

  if (company && company.length > 160) {
    throw new Error("Keep the company name under 160 characters.");
  }

  if (message.length > 4000) {
    throw new Error("Keep the message under 4000 characters.");
  }

  return { name, email, company, message };
}

function isDatabaseUnavailable(error: unknown) {
  return error instanceof Error && /Can't reach database server|connect ECONNREFUSED|localhost:5432/i.test(error.message);
}

function serializeLocalInquiry(inquiry: LocalContactInquiryRecord): ContactInquiryPayload {
  return {
    id: inquiry.id,
    reference: inquiry.id.slice(0, 8).toUpperCase(),
    name: inquiry.name,
    email: inquiry.email,
    company: inquiry.company,
    message: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.createdAt,
    ownerAlertEmail: inquiry.ownerAlertEmail,
    ownerAlertStatus: inquiry.ownerAlertStatus,
    ownerAlertSentAt: inquiry.ownerAlertSentAt,
    ownerAlertError: inquiry.ownerAlertError,
    notifications: inquiry.notifications
  };
}

async function readLocalContactStore() {
  try {
    const payload = await readFile(LOCAL_CONTACT_STORE_PATH, "utf8");
    const parsed = JSON.parse(payload) as LocalContactInquiryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeLocalContactStore(inquiries: LocalContactInquiryRecord[]) {
  await mkdir(dirname(LOCAL_CONTACT_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_CONTACT_STORE_PATH, JSON.stringify(inquiries, null, 2), "utf8");
}

async function createLocalContactInquiry(values: ReturnType<typeof validateInput>) {
  const now = new Date().toISOString();
  const id = randomUUID().replace(/-/g, "");

  const ownerAlertResult = await sendContactOwnerAlert({
    inquiryId: id,
    name: values.name,
    email: values.email,
    company: values.company,
    message: values.message,
    createdAt: new Date(now)
  });

  const customerConfirmationResult = await sendContactCustomerConfirmation({
    inquiryId: id,
    name: values.name,
    email: values.email,
    createdAt: new Date(now)
  });

  const inquiry: LocalContactInquiryRecord = {
    id,
    name: values.name,
    email: values.email,
    emailNormalized: values.email,
    company: values.company,
    message: values.message,
    status: "received",
    source: "contact_form",
    ownerAlertEmail: getContactOwnerRecipient(),
    ownerAlertStatus: ownerAlertResult.status,
    ownerAlertSentAt: ownerAlertResult.status === "sent" ? now : null,
    ownerAlertError: ownerAlertResult.error,
    createdAt: now,
    updatedAt: now,
    notifications: [
      {
        id: randomUUID().replace(/-/g, ""),
        channel: "in_app",
        title: "We received your message",
        message: `Thanks for reaching out to Northline. Your request is in our queue, and our team will follow up using ${values.email}.`,
        sentAt: now,
        acknowledgedAt: null
      },
      ...(customerConfirmationResult.status === "sent"
        ? [
            {
              id: randomUUID().replace(/-/g, ""),
              channel: "email",
              title: "Email confirmation sent",
              message: `We sent a confirmation to ${values.email} with your Northline request reference.`,
              sentAt: now,
              acknowledgedAt: null
            }
          ]
        : [])
    ]
  };

  const inquiries = await readLocalContactStore();
  inquiries.unshift(inquiry);
  await writeLocalContactStore(inquiries);

  return serializeLocalInquiry(inquiry);
}

function serializeInquiry(
  inquiry: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    message: string;
    status: string;
    createdAt: Date;
    ownerAlertEmail: string;
    ownerAlertStatus: string;
    ownerAlertSentAt: Date | null;
    ownerAlertError: string | null;
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      channel: string;
      sentAt: Date;
      acknowledgedAt: Date | null;
    }>;
  }
): ContactInquiryPayload {
  return {
    id: inquiry.id,
    reference: inquiry.id.slice(0, 8).toUpperCase(),
    name: inquiry.name,
    email: inquiry.email,
    company: inquiry.company,
    message: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.createdAt.toISOString(),
    ownerAlertEmail: inquiry.ownerAlertEmail,
    ownerAlertStatus: inquiry.ownerAlertStatus,
    ownerAlertSentAt: inquiry.ownerAlertSentAt?.toISOString() ?? null,
    ownerAlertError: inquiry.ownerAlertError ?? null,
    notifications: inquiry.notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      channel: notification.channel,
      sentAt: notification.sentAt.toISOString(),
      acknowledgedAt: notification.acknowledgedAt?.toISOString() ?? null
    }))
  };
}

export async function createContactInquiry(input: ContactSubmissionInput) {
  const values = validateInput(input);

  try {
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: values.name,
        email: values.email,
        emailNormalized: values.email,
        company: values.company,
        message: values.message,
        ownerAlertEmail: getContactOwnerRecipient(),
        notifications: {
          create: {
            channel: "in_app",
            title: "We received your message",
            message: `Thanks for reaching out to Northline. Your request is in our queue, and our team will follow up using ${values.email}.`
          }
        }
      },
      include: {
        notifications: {
          orderBy: { sentAt: "desc" }
        }
      }
    });

    const ownerAlertResult = await sendContactOwnerAlert({
      inquiryId: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      company: inquiry.company,
      message: inquiry.message,
      createdAt: inquiry.createdAt
    });

    const customerConfirmationResult = await sendContactCustomerConfirmation({
      inquiryId: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      createdAt: inquiry.createdAt
    });

    const updatedInquiry = await prisma.contactInquiry.update({
      where: { id: inquiry.id },
      data: {
        ownerAlertStatus: ownerAlertResult.status,
        ownerAlertSentAt: ownerAlertResult.status === "sent" ? new Date() : null,
        ownerAlertError: ownerAlertResult.error,
        notifications:
          customerConfirmationResult.status === "sent"
            ? {
                create: {
                  channel: "email",
                  title: "Email confirmation sent",
                  message: `We sent a confirmation to ${inquiry.email} with your Northline request reference.`
                }
              }
            : undefined
      },
      include: {
        notifications: {
          orderBy: { sentAt: "desc" }
        }
      }
    });

    return serializeInquiry(updatedInquiry);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return createLocalContactInquiry(values);
    }

    throw error;
  }
}

export async function getContactInquiriesByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!/\S+@\S+\.\S+/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }

  try {
    const inquiries = await prisma.contactInquiry.findMany({
      where: {
        emailNormalized: normalized
      },
      orderBy: { createdAt: "desc" },
      include: {
        notifications: {
          orderBy: { sentAt: "desc" }
        }
      },
      take: 5
    });

    return inquiries.map(serializeInquiry);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const inquiries = await readLocalContactStore();
      return inquiries
        .filter((inquiry) => inquiry.emailNormalized === normalized)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(serializeLocalInquiry);
    }

    throw error;
  }
}

export async function getContactInbox() {
  try {
    const inquiries = await prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        notifications: {
          orderBy: { sentAt: "desc" }
        }
      },
      take: 100
    });

    return inquiries.map(serializeInquiry);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const inquiries = await readLocalContactStore();
      return inquiries
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100)
        .map(serializeLocalInquiry);
    }

    throw error;
  }
}
