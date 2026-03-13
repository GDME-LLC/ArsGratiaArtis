import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const target = process.argv[2] ?? ".next";
const distDir = path.join(process.cwd(), target);

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
  console.log(`Removed stale build artifacts from ${target}.`);
} else {
  console.log(`No existing ${target} directory found.`);
}
