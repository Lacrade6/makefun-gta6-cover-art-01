// Vice Coast Cover Studio — entry program (Node 22, standard library only).
// Copies app/ and screenshots/ from beside this file into the output
// directory (/output, or $MAKEFUN_OUTPUT_DIR outside the grader) and writes
// dossier.json with the kit library's buildDossier, under this bounty's caps.

import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

mkdirSync(outDir, { recursive: true });
cpSync(join(here, "app"), join(outDir, "app"), { recursive: true });
cpSync(join(here, "screenshots"), join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`Vice Coast Cover Studio: app and screenshots copied to ${outDir}, dossier.json written (${dossier.length} bytes).`);
