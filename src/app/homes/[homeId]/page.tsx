import { FloorplanSelectionPage } from "@/features/project-shell/floorplan-selection-page";

export default async function HomeFloorplansPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;

  return <FloorplanSelectionPage homeId={homeId} />;
}
