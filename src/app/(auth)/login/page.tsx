import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke workspace BLOX MANAGER.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const flag = (value: string | string[] | undefined) => value === "1" || value === "true";

  if (await getCurrentUser()) redirect("/");

  return (
    <LoginForm
      verified={flag(params.verified)}
      reset={flag(params.reset)}
      registered={flag(params.registered)}
      showDemo={process.env.NODE_ENV !== "production"}
    />
  );
}
