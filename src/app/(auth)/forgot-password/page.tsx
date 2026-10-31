import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Password",
  description: "Minta tautan reset password untuk akun BLOX MANAGER.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
