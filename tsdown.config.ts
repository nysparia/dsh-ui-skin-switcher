import { defineConfig } from 'tsdown'

/**
 * Self-contained build for the standalone repository. Unlike the monorepo
 * preset (which imports shared config from ../tsdown.client.ts), this config
 * has no references outside the repo, so a git checkout builds with nothing
 * but its own devDependencies.
 *
 * `lib/` is committed and shipped prebuilt, so a source install needs no build
 * step and there is no `prepare` script: run `pnpm build` after editing `src/`
 * and commit the result alongside it.
 *
 * Outputs (matching the runtime contract dsh expects):
 * - lib/index.js                   ESM node half (no runtime imports)
 * - lib/client.js                   browser half wrapped in the
 *                                   window.__ModuleLoader__.load({id, factory})
 *                                   registration shell, react stays external
 */

const PKG_ID = '@domitor-syh/dsh-ui-skin-switcher'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: 'esm',
    platform: 'neutral',
    dts: false,
    sourcemap: false,
    external: [/^@deepseek-ai\//],
  },
  {
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: false,
    external: [/^@deepseek-ai\//, 'react'],
    outputOptions: {
      entryFileNames: '[name].js',
      banner:
        'window.__ModuleLoader__.load({\n' +
        `\tid: ${JSON.stringify(PKG_ID)},\n` +
        '\tfactory: (require) => {\n' +
        '\t\tvar module = { exports: {} };\n' +
        '\t\tvar exports = module.exports;\n' +
        '\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
      footer:
        '\t\treturn module.exports;\n' +
        '\t}\n' +
        '});',
    },
  },
])
