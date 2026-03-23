import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");
const standaloneNextDir = join(standaloneDir, ".next");
const standaloneStaticDir = join(standaloneNextDir, "static");
const staticDir = join(root, ".next", "static");
const publicDir = join(root, "public");
const standalonePublicDir = join(standaloneDir, "public");
const standaloneServerFile = join(standaloneDir, "server.js");
const standaloneCryptoCompatShim = `const nodeCrypto = require("node:crypto");

function fallbackRandomUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = nodeCrypto.webcrypto ?? {};
}

if (typeof globalThis.crypto.randomUUID !== "function") {
  globalThis.crypto.randomUUID =
    typeof nodeCrypto.randomUUID === "function"
      ? (...args) => nodeCrypto.randomUUID(...args)
      : fallbackRandomUUID;
}

`;

function patchStandaloneServer() {
  if (!existsSync(standaloneServerFile)) {
    return;
  }

  const source = readFileSync(standaloneServerFile, "utf8");

  if (source.includes("fallbackRandomUUID")) {
    return;
  }

  writeFileSync(standaloneServerFile, `${standaloneCryptoCompatShim}${source}`);
}

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

patchStandaloneServer();

console.log("standalone 배포 폴더 준비 완료");
