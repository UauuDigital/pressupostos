const esbuild = require('esbuild');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const watch = process.argv.includes('--watch');

const config = {
  entryPoints: ['source/pressupostos-uauu/scripts/main.jsx'],
  bundle: true,
  minify: !watch,
  outfile: 'source/pressupostos-uauu/bundle.js',
  jsx: 'transform',
  target: ['es2017'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  logLevel: 'info',
};

if (watch) {
  esbuild.context(config).then(ctx => ctx.watch());
} else {
  esbuild.build(config).then(actualitzaVersions).catch(() => process.exit(1));
}

// Cache-busting automàtic: posa ?v=<hash del contingut> a cada CSS/JS local de
// index.html. Així, en canviar un fitxer, el navegador el baixa de nou encara
// que en tingués una còpia guardada (abans calia canviar el ?v= a mà).
function actualitzaVersions() {
  const dir = path.join(__dirname, 'source', 'pressupostos-uauu');
  const index = path.join(dir, 'index.html');
  const html = fs.readFileSync(index, 'utf8');
  const nou = html.replace(/((?:href|src)=")([^"?:]+\.(?:css|js))(?:\?v=[^"]*)?(")/g, (m, attr, ruta, fi) => {
    const fitxer = path.join(dir, ruta);
    if (!fs.existsSync(fitxer)) return m;
    const hash = crypto.createHash('sha256').update(fs.readFileSync(fitxer)).digest('hex').slice(0, 8);
    return `${attr}${ruta}?v=${hash}${fi}`;
  });
  if (nou !== html) {
    fs.writeFileSync(index, nou);
    console.log('index.html: versions (?v=) actualitzades');
  }
}
