// Runs a Java project's Gradle wrapper from Nx targets, on any OS.
// The wrapper downloads Gradle 9.8; the build's toolchain downloads Java 25
// when the machine only has an older JDK (17 or later runs Gradle itself).
//
// Usage: node tools/scripts/gradle.mjs <project dir> <task> [args...]
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const [dir, ...args] = process.argv.slice(2);
if (!dir || args.length === 0) {
  console.error(
    'Usage: node tools/scripts/gradle.mjs <project dir> <task> [args...]',
  );
  process.exit(1);
}
const windows = process.platform === 'win32';
const result = spawnSync(
  windows ? 'gradlew.bat' : './gradlew',
  [...args, '--console=plain'],
  { cwd: resolve(dir), stdio: 'inherit', shell: windows },
);
process.exit(result.status ?? 1);
