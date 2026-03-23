import { FloorPlanResultPage } from "@/features/floor-plan-result/result-page";

export default async function FloorplanResultRoute({
  params,
}: {
  params: Promise<{ homeId: string; floorplanId: string }>;
}) {
  const { homeId, floorplanId } = await params;

  return <FloorPlanResultPage homeId={homeId} floorplanId={floorplanId} />;
}
