import { z } from "zod";

import {
  createFloorplan,
  getHomeWithFloorplans,
} from "@/lib/server/project-shell-repo";

const createSchema = z.object({
  name: z.string().trim().min(1, "도면 이름을 입력해 주세요.").max(255),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ homeId: string }> },
) {
  const { homeId } = await params;
  const payload = await getHomeWithFloorplans(homeId);

  if (!payload.home) {
    return Response.json({ message: "집 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  return Response.json(payload);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ homeId: string }> },
) {
  const { homeId } = await params;
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const floorplan = await createFloorplan(homeId, parsed.data.name);
  return Response.json(floorplan, { status: 201 });
}
