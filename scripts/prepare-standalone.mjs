import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");
const standaloneNextDir = join(standaloneDir, ".next");
const standaloneStaticDir = join(standaloneNextDir, "static");
const staticDir = join(root, ".next", "static");
const publicDir = join(root, "public");
const standalonePublicDir = join(standaloneDir, "public");

if (!existsSync(standaloneDir)) {
  console.error("standalone output이 없습니다. 먼저 next build를 실행하세요.");
  process.exit(1);
}

mkdirSync(standaloneNextDir, { recursive: true });

if (existsSync(staticDir)) {
  cpSync(staticDir, standaloneStaticDir, { recursive: true });
}

if (existsSync(publicDir)) {
  cpSync(publicDir, standalonePublicDir, { recursive: true });
}

console.log("standalone 배포 폴더 준비 완료");
