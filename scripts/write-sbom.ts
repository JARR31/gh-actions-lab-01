import { readFile, mkdir, writeFile } from "node:fs/promises";

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const packageFiles = [
  "package.json",
  "packages/domain/package.json",
  "apps/api/package.json",
  "apps/web/package.json"
];

const components = [];

for (const path of packageFiles) {
  const pkg = JSON.parse(await readFile(path, "utf8")) as PackageJson;
  for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
    components.push({
      type: "library",
      scope: "required",
      name,
      version,
      package: pkg.name ?? path
    });
  }

  for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
    components.push({
      type: "library",
      scope: "development",
      name,
      version,
      package: pkg.name ?? path
    });
  }
}

const sbom = {
  bomFormat: "PulseCart placeholder SBOM",
  specVersion: "0.0-placeholder",
  serialNumber: "urn:uuid:00000000-0000-0000-0000-000000000000",
  version: 1,
  metadata: {
    generatedAt: new Date().toISOString(),
    note: "This is a non-production dependency inventory placeholder. Replace with a real CycloneDX or SPDX generator in CI."
  },
  components
};

await mkdir("reports", { recursive: true });
await writeFile("reports/sbom.json", `${JSON.stringify(sbom, null, 2)}\n`);
console.log("Wrote reports/sbom.json placeholder");
