import { z } from "zod";

import {
  deleteHome,
  renameHome,
} from "@/lib/server/project-shell-repo";

const updateSchema = z.object({
  name: z.string().trim().min(1, "집 이름을 입력해 주세요.").max(255),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ homeId: string }> },
) {
  const { homeId } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  await renameHome(homeId, parsed.data.name);
  return Response.json({ id: homeId, name: parsed.data.name });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ homeId: string }> },
) {
  const { homeId } = await params;
  await deleteHome(homeId);
  return new Response(null, { status: 204 });
}
