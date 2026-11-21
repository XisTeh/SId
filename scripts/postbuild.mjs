import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const cssRoot = path.resolve('dist/assets/css');
const manifestPath = path.join(cssRoot, 'manifest.css');
const source = await readFile(manifestPath, 'utf8');
const importPattern = /^\s*@import\s+url\(["'](.+?)["']\);?\s*$/gm;
const imports = [...source.matchAll(importPattern)].map((match) => match[1]);
let bundled = '';
for (const file of imports) bundled += `\n/* ${file} */\n${await readFile(path.resolve(cssRoot, file), 'utf8')}\n`;
const output = `${bundled.trim()}\n`;
await writeFile(path.join(cssRoot, 'main.css'), output, 'utf8');
await writeFile(path.join(path.resolve('assets/css'), 'main.css'), output, 'utf8');
const version = createHash('sha256').update(output).digest('hex').slice(0, 10);
for (const htmlPath of [path.resolve('dist/index.html'), path.resolve('index.html')]) {
  const html = await readFile(htmlPath, 'utf8');
  await writeFile(htmlPath, html.replaceAll('assets/css/main.css"', `assets/css/main.css?v=${version}"`), 'utf8');
}
await writeFile(path.resolve('dist/.nojekyll'), '', 'utf8');
console.log(`CSS bundled: ${imports.length} modules -> local and dist main.css (v${version})`);
