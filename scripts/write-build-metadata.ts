import { mkdir, writeFile } from "node:fs/promises";

const outputPath = "reports/build-metadata.json";

const metadata = {
  application: "PulseCart",
  generatedAt: new Date().toISOString(),
  git: {
    sha: process.env.GITHUB_SHA ?? process.env.GIT_SHA ?? "local",
    ref: process.env.GITHUB_REF_NAME ?? process.env.GIT_REF ?? "local"
  },
  build: {
    runId: process.env.GITHUB_RUN_ID ?? "local",
    actor: process.env.GITHUB_ACTOR ?? "local"
  }
};

await mkdir("reports", { recursive: true });
await writeFile(outputPath, `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
