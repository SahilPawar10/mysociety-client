import { redirect } from "next/navigation";
import ResourceCrudClient from "@/components/portal/ResourceCrudClient";

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  // Expenses moved into the Debits tab.
  if (resource === "society-expense") {
    redirect("/portal/accounts");
  }
  return <ResourceCrudClient resource={resource} />;
}
