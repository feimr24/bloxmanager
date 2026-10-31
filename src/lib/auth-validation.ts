export function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function validateEmail(email: string) {
  if (!email) return "Email wajib diisi";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Format email tidak valid";
  if (email.length > 254) return "Email terlalu panjang";
  return null;
}

export function validateUsername(username: string) {
  if (!username) return "Username wajib diisi";
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
    return "Username 3–32 karakter, hanya huruf, angka, dan garis bawah";
  }
  return null;
}

export function validatePassword(password: string) {
  if (!password) return "Password wajib diisi";
  if (password.length < 8) return "Password minimal 8 karakter";
  if (password.length > 128) return "Password maksimal 128 karakter";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password harus mengandung huruf dan angka";
  }
  return null;
}
