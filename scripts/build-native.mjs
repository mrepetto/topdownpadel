import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readableCSS } from './readable-css.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'web');
const output = path.join(root, 'native/www');
fs.mkdirSync(output, { recursive: true });
// Rebuild only this generated directory. The web/ source remains shared.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const excluded = /^(website|generaladmin|admin|telemetry)([.-]|$)/;
let count = 0;
for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
  if (!entry.isFile()) throw new Error(`Review asset subdirectory before packaging: ${entry.name}`);
  if (excluded.test(entry.name) || entry.name === 'gameplay.mp4') continue;
  let content = fs.readFileSync(path.join(source, entry.name));
  if (entry.name.endsWith('.css')) content = readableCSS(content.toString());
  if (entry.name === 'index.html') {
    content = content.toString().replace('<html lang="en">', '<html lang="en" data-layout="mobile">');
    if (!content.includes('data-layout="mobile"')) throw new Error('Mobile layout marker missing');
  }
  fs.writeFileSync(path.join(output, entry.name), content);
  count++;
}
console.log(`Packaged ${count} game files in native/www (native integration still requires device validation).`);
