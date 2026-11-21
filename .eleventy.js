const fs = require('node:fs');
const path = require('node:path');

module.exports = (eleventyConfig) => {
  const cssRoot = path.resolve('assets/css');
  const bundleCss = async () => {
    const manifest = await fs.promises.readFile(path.join(cssRoot, 'manifest.css'), 'utf8');
    const imports = [...manifest.matchAll(/^\s*@import\s+url\(["'](.+?)["']\);?\s*$/gm)].map((match) => match[1]);
    let bundle = '';
    for (const file of imports) bundle += `\n/* ${file} */\n${await fs.promises.readFile(path.resolve(cssRoot, file), 'utf8')}\n`;
    await fs.promises.writeFile(path.join(cssRoot, 'main.css'), bundle.trimStart(), 'utf8');
  };

  for (const directory of ['assets/css', 'assets/js', 'assets/images', 'assets/fonts', 'assets/icons']) {
    eleventyConfig.addPassthroughCopy(directory);
  }
  eleventyConfig.addPassthroughCopy('preview.html');
  for (const target of ['assets/css/manifest.css', 'assets/css/base.css', 'assets/css/responsive.css', 'assets/css/components/', 'assets/css/sections/', 'assets/css/motion/']) {
    eleventyConfig.addWatchTarget(target);
  }
  eleventyConfig.addWatchTarget('assets/js/');
  eleventyConfig.on('eleventy.before', bundleCss);
  eleventyConfig.on('eleventy.after', ({ dir }) => {
    const output = path.resolve(dir.output);
    const builtIndex = path.join(output, 'index.html');
    if (fs.existsSync(builtIndex)) fs.copyFileSync(builtIndex, path.resolve('index.html'));
  });
  return {
    dir: { input: 'src', includes: '_includes', output: 'dist' },
    templateFormats: ['njk'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    passthroughFileCopy: true,
  };
};
