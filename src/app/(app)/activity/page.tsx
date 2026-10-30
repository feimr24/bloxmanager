import { Suspense } from "react";
import type { Metadata } from "next";
import { ActivityView } from "@/components/activity/activity-view";
import { Skeleton } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Aktivitas",
  description: "Pantau sesi bermain dan perangkat yang digunakan secara real-time.",
};

export default function ActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        </div>
      }
    >
      <ActivityView />
    </Suspense>
  );
}
