import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Output directories
const vercelOutput = join(rootDir, '.vercel/output');
const staticDir = join(vercelOutput, 'static');
const funcDir = join(vercelOutput, 'functions/api/trpc.func');

try {
  // Clean and create directories
  if (existsSync(vercelOutput)) {
    rmSync(vercelOutput, { recursive: true });
  }
  mkdirSync(staticDir, { recursive: true });
  mkdirSync(funcDir, { recursive: true });
  
  // Copy static files from dist/public to .vercel/output/static
  execSync(`cp -r dist/public/* ${staticDir}/`, { cwd: rootDir, stdio: 'inherit' });
  
  // Bundle API function
  execSync(`npx esbuild api/trpc.ts --bundle --platform=node --format=esm --outfile=${funcDir}/index.mjs --external:pg-native`, {
    cwd: rootDir,
    stdio: 'inherit'
  });
  
  // Create function config
  writeFileSync(join(funcDir, '.vc-config.json'), JSON.stringify({
    runtime: "nodejs20.x",
    handler: "index.mjs",
    launcherType: "Nodejs",
    maxDuration: 30
  }, null, 2));
  
  // Create routes config
  writeFileSync(join(vercelOutput, 'config.json'), JSON.stringify({
    version: 3,
    routes: [
      { src: "/api/trpc/(.*)", dest: "/api/trpc" },
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/index.html" }
    ]
  }, null, 2));
  
  console.log('✅ Vercel Build Output created successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
