import type { Metadata } from "next";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export const metadata: Metadata = {
  title: "Kirim Ulang Verifikasi",
  description: "Kirim ulang email verifikasi akun BLOX MANAGER.",
};

export default async function ResendVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return <ResendVerificationForm initialEmail={email} />;
}
