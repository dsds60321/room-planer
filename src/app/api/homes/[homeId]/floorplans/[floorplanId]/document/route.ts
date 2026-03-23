import { z } from "zod";

import {
  getFloorplanDocument,
  saveFloorplanDocument,
} from "@/lib/server/project-shell-repo";
import { type Placement, type Room } from "@/types";

const documentSchema = z.object({
  floorplanId: z.string().min(1),
  rooms: z.custom<Room[]>((value) => Array.isArray(value), {
    message: "rooms는 배열이어야 합니다.",
  }),
  placements: z.custom<Placement[]>((value) => Array.isArray(value), {
    message: "placements는 배열이어야 합니다.",
  }),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ homeId: string; floorplanId: string }> },
) {
  const { homeId, floorplanId } = await params;
  const payload = await getFloorplanDocument(homeId, floorplanId);

  if (!payload.home || !payload.floorplan || !payload.document) {
    return Response.json({ message: "도면 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  return Response.json(payload);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ homeId: string; floorplanId: string }> },
) {
  const { homeId, floorplanId } = await params;
  const body = await request.json();
  const parsed = documentSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  await saveFloorplanDocument(
    homeId,
    floorplanId,
    parsed.data.rooms,
    parsed.data.placements,
  );

  const payload = await getFloorplanDocument(homeId, floorplanId);
  return Response.json(payload);
}
