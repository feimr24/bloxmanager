import type { Metadata } from "next";
import { GroupsView } from "@/components/groups/groups-view";

export const metadata: Metadata = {
  title: "Group",
  description: "Alokasikan akun ke environment PC, handphone, dan Redfingers secara massal.",
};

export default function GroupsPage() {
  return <GroupsView />;
}
