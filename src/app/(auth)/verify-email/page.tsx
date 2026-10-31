import type { Metadata } from "next";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verifikasi Email",
  description: "Verifikasi alamat email akun BLOX MANAGER.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return <VerifyEmailForm token={token} />;
}
