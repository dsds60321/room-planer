import { FloorPlanEditorPage } from "@/features/floor-plan/editor-page";

export default async function FloorplanEditorRoute({
  params,
}: {
  params: Promise<{ homeId: string; floorplanId: string }>;
}) {
  const { homeId, floorplanId } = await params;

  return <FloorPlanEditorPage homeId={homeId} floorplanId={floorplanId} />;
}
