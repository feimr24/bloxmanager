import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun BLOX MANAGER dengan verifikasi email.",
};

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return <RegisterForm />;
}
