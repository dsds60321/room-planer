import { MeasurePage } from "@/features/room-measure/measure-page";

export default async function FloorplanMeasureRoute({
  params,
}: {
  params: Promise<{ homeId: string; floorplanId: string }>;
}) {
  const { homeId, floorplanId } = await params;

  return <MeasurePage homeId={homeId} floorplanId={floorplanId} />;
}
