import { prisma } from "@/lib/prisma";
import { getContactOwnerRecipient, sendContactOwnerAlert } from "@/lib/server/email";

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

  if (message.length < 20) {
    throw new Error("Add a little more detail so the team knows how to help.");
  }

  if (message.length > 4000) {
    throw new Error("Keep the message under 4000 characters.");
  }

  return { name, email, company, message };
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

  const updatedInquiry = await prisma.contactInquiry.update({
    where: { id: inquiry.id },
    data: {
      ownerAlertStatus: ownerAlertResult.status,
      ownerAlertSentAt: ownerAlertResult.status === "sent" ? new Date() : null,
      ownerAlertError: ownerAlertResult.error
    },
    include: {
      notifications: {
        orderBy: { sentAt: "desc" }
      }
    }
  });

  return serializeInquiry(updatedInquiry);
}

export async function getContactInquiriesByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!/\S+@\S+\.\S+/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }

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
}

export async function getContactInbox() {
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
}
