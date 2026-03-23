import { z } from "zod";

import {
  deleteFloorplan,
  renameFloorplan,
} from "@/lib/server/project-shell-repo";

const updateSchema = z.object({
  name: z.string().trim().min(1, "도면 이름을 입력해 주세요.").max(255),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ homeId: string; floorplanId: string }> },
) {
  const { homeId, floorplanId } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  await renameFloorplan(homeId, floorplanId, parsed.data.name);
  return Response.json({ id: floorplanId, homeId, name: parsed.data.name });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ homeId: string; floorplanId: string }> },
) {
  const { homeId, floorplanId } = await params;
  await deleteFloorplan(homeId, floorplanId);
  return new Response(null, { status: 204 });
}
