interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Kirim email lewat Resend (https://resend.com).
 * Bila RESEND_API_KEY belum diisi, email tidak dikirim dan link dicetak ke
 * console server supaya alur verifikasi tetap bisa diuji secara lokal.
 */
export async function sendMail(message: MailMessage): Promise<{ delivered: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.info(
      `\n[blox-mail:dev] RESEND_API_KEY belum diisi — email ke ${message.to} tidak dikirim.`,
      `\n[blox-mail:dev] ${message.subject}\n${message.text}\n`,
    );
    return { delivered: false, error: "RESEND_API_KEY belum dikonfigurasi" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM?.trim() || "BLOX MANAGER <onboarding@resend.dev>",
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[blox-mail] Resend menolak permintaan:", response.status, detail);
      return { delivered: false, error: "Gagal mengirim email" };
    }

    return { delivered: true };
  } catch (error) {
    console.error("[blox-mail] Tidak dapat menghubungi Resend:", error);
    return { delivered: false, error: "Gagal mengirim email" };
  }
}
