const esbuild = require('esbuild');

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
  esbuild.build(config).catch(() => process.exit(1));
}
