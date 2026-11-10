# Third-party notices

This package is MIT licensed (see [LICENSE](./LICENSE)). It redistributes one
third-party asset, listed below with its own license.

## Space Grotesk

- **What ships**: a subset of the Space Grotesk variable font, embedded as a
  base64 WOFF2 data URI inside `lib/client.js` (the `@font-face` rule in the
  effort popover's stylesheet). It is not a separate file on disk.
- **Upstream**: <https://github.com/floriankarsten/space-grotesk>
- **Copyright**: Copyright 2020 The Space Grotesk Project Authors
  (<https://github.com/floriankarsten/space-grotesk>)
- **License**: SIL Open Font License, Version 1.1

The full license text is reproduced in
[docs/OFL-SpaceGrotesk.txt](./docs/OFL-SpaceGrotesk.txt).

The font is used unmodified apart from subsetting to the Latin range declared
by the `unicode-range` in the same `@font-face` rule. The OFL permits embedding
and redistribution in this form; the font is not sold on its own, and the
copyright notice above travels with it.

## Runtime dependencies

The published package has no runtime dependencies. `@deepseek-ai/schemastery`
is a dependency of the Node half and is provided by the DSH host at runtime;
`react` is a peer dependency supplied by the host's shared module table.
