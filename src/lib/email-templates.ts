function layout(title: string, body: string, footer: string) {
  return `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:32px 16px;background:#f4f7fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16233a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
      <tr>
        <td style="padding-bottom:20px;">
          <span style="font-size:13px;font-weight:700;letter-spacing:.14em;color:#2452d4;">BLOX MANAGER</span>
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;border:1px solid #e3e9f3;border-radius:16px;padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#0b1526;">${title}</h1>
          ${body}
        </td>
      </tr>
      <tr>
        <td style="padding-top:18px;font-size:11.5px;line-height:1.6;color:#8795aa;">${footer}</td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;margin:6px 0 18px;padding:12px 20px;border-radius:10px;background:#3b6cf6;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>`;
}

export function verificationEmail({ username, link }: { username: string; link: string }) {
  return {
    subject: "Verifikasi email akun BLOX MANAGER",
    html: layout(
      "Konfirmasi alamat email",
      `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#2c3a51;">Halo <strong>${username}</strong>, satu langkah lagi. Klik tombol di bawah untuk memverifikasi email dan mengaktifkan akses dashboard.</p>
       ${button("Verifikasi email", link)}
       <p style="margin:0;font-size:12px;line-height:1.6;color:#5c6b83;">Link berlaku selama 24 jam. Bila kamu tidak membuat akun ini, abaikan email ini.</p>
       <p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:#8795aa;word-break:break-all;">${link}</p>`,
      "Email otomatis dari BLOX MANAGER. Jangan membalas email ini.",
    ),
    text: `Halo ${username},\n\nVerifikasi email akun BLOX MANAGER dengan membuka tautan berikut (berlaku 24 jam):\n${link}\n\nBila kamu tidak membuat akun ini, abaikan email ini.`,
  };
}

export function resetPasswordEmail({ username, link, minutes }: { username: string; link: string; minutes: number }) {
  return {
    subject: "Reset password BLOX MANAGER",
    html: layout(
      "Atur ulang password",
      `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#2c3a51;">Halo <strong>${username}</strong>, kami menerima permintaan reset password. Klik tombol di bawah untuk membuat password baru.</p>
       ${button("Buat password baru", link)}
       <p style="margin:0;font-size:12px;line-height:1.6;color:#5c6b83;">Link berlaku selama ${minutes} menit dan hanya bisa dipakai sekali. Bila kamu tidak meminta reset, abaikan email ini — password lama tetap aman.</p>
       <p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:#8795aa;word-break:break-all;">${link}</p>`,
      "Email otomatis dari BLOX MANAGER. Jangan membalas email ini.",
    ),
    text: `Halo ${username},\n\nBuat password baru BLOX MANAGER melalui tautan berikut (berlaku ${minutes} menit):\n${link}\n\nBila kamu tidak meminta reset, abaikan email ini.`,
  };
}
