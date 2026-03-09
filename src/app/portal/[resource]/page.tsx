import ResourceCrudClient from "@/components/portal/ResourceCrudClient";

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  return <ResourceCrudClient resource={resource} />;
}
