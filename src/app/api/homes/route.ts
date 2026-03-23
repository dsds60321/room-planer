import { z } from "zod";

import { createHome, listHomes } from "@/lib/server/project-shell-repo";

const createSchema = z.object({
  name: z.string().trim().min(1, "집 이름을 입력해 주세요.").max(255),
});

export async function GET() {
  const homes = await listHomes();
  return Response.json(homes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const home = await createHome(parsed.data.name);
  return Response.json(home, { status: 201 });
}
