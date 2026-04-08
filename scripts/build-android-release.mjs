import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isWindows = process.platform === "win32";
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, "..");

const syncAndroidVersion = () => {
  const appConfigPath = path.join(projectRoot, "app.json");
  const buildGradlePath = path.join(projectRoot, "android", "app", "build.gradle");
  const appConfig = JSON.parse(readFileSync(appConfigPath, "utf8"));
  const versionCode = appConfig.expo.android.versionCode;
  const versionName = appConfig.expo.version;
  const buildGradle = readFileSync(buildGradlePath, "utf8")
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);

  writeFileSync(buildGradlePath, buildGradle);
  console.log(`Using Android versionCode=${versionCode} versionName=${versionName}`);
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: isWindows,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("npx", ["expo", "prebuild", "--platform", "android", "--no-install"]);
syncAndroidVersion();

run(isWindows ? "gradlew.bat" : "./gradlew", ["bundleRelease"], {
  cwd: "android",
});
