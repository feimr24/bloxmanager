interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAIL_FROM?.trim());
}

/**
 * Kirim email lewat Resend (https://resend.com).
 * Bila RESEND_API_KEY belum diisi, email tidak dikirim. Link tidak pernah
 * ditulis ke log karena mengandung token verifikasi/reset.
 */
export async function sendMail(message: MailMessage): Promise<{ delivered: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();

  if (!apiKey || !from) {
    return {
      delivered: false,
      error: !apiKey ? "RESEND_API_KEY belum dikonfigurasi" : "MAIL_FROM belum dikonfigurasi",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      console.error("[blox-mail] Resend menolak permintaan:", response.status);
      return { delivered: false, error: "Gagal mengirim email" };
    }

    return { delivered: true };
  } catch (error) {
    console.error("[blox-mail] Tidak dapat menghubungi Resend:", error);
    return { delivered: false, error: "Gagal mengirim email" };
  }
}
