import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountsView } from "@/components/accounts/accounts-view";
import { Skeleton } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Master Account",
  description: "Kelola kredensial, status, dan alokasi seluruh akun Roblox.",
};

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        </div>
      }
    >
      <AccountsView />
    </Suspense>
  );
}
