# 更新日志 / Changelog

本插件遵循[语义化版本](https://semver.org/lang/zh-CN/)。点开对应版本的 Release 或本文件的版本标题，即可查看该版本改了什么。

This project follows [Semantic Versioning](https://semver.org/). Pick a version below to see what changed.

## [0.4.1-fork.1] — 2026-11-11

本版本是本仓库的 fork，基于 `0.4.0` 加上一轮审计修复。版本号的 `-fork.1` 后缀标明它不是上游发布版；因为装的是 git 源，DSH 不会把它当作可从 registry 更新的包。

This is a fork of the repository: `0.4.0` plus one round of audit fixes. The `-fork.1` suffix marks it as not an upstream release. Installed from git, DSH never treats it as a registry-updatable package.

**中文**

- 修复「已保存」提示永远不出现：颜色切换器原本逐字段写入配置，每次写入都会推进命名空间 revision，触发组件重新采纳 Host 值并清掉刚设置的提示。现在八项字段作为一次原子 `mutate` 提交，并区分「本次保存导致的 revision」与「外部改动」。
- 修复保存失败后「应用」按钮永久禁用：格式错误与写入失败原本共用同一个 state，Host 拒绝一次写入就把按钮锁死、还把色码框标红。现在两者分开——格式错误才阻止保存，写入失败可直接重试。
- 修复切换「跟随档位颜色」开关会丢弃未保存的颜色编辑：开关写入自己的字段同样会推进 revision，导致组件用 Host 值覆盖草稿。现在只有配色真的变化时才采纳 Host 值。
- 补齐 provider 目录加载失败的提示：原本失败的 provider 会从菜单里静默消失，现在列出名称、失败原因和重试按钮。
- 补齐模型徽章显示：provider 声明的 `badge` 原本被丢弃，现在渲染在触发器和菜单行上，并按声明的 tone 着色。
- 思考强度滑块支持键盘操作：轨道现在有 `role="slider"`、可聚焦、报告 `aria-valuenow`，方向键逐档、Home/End 跳到两端；Escape 关闭任意打开中的菜单。
- 思考强度弹层的「强度 / 更快 / 更聪明」三个文案接入双语字典，不再是写死的英文。
- 移除未使用的 `remote` / `remote.session` 注入声明：本插件通过 `modelDirectories` 读取目录，不直接调 RPC，声明它们只会让插件多等待两个用不到的服务。
- 移除死代码：未使用的 `noiseFreq` 常量、从未被任何 CSS 规则读取的 `--flash-deep` 变量。
- 引入 TypeScript 类型检查（`tsc --noEmit`）并接入 CI；顺带修掉 5 个一直被掩盖的类型错误。CI 现在还校验重建产物与提交的 `lib/` 一致，并运行真实 SlotCore 兼容性检查。
- 补上内嵌 Space Grotesk 字体的 SIL OFL 许可证全文与第三方声明；此前只带 MIT LICENSE，属许可合规缺口。

**English**

- Fixed the "Saved" confirmation never appearing: the colour section wrote one field per call, and every write advanced the namespace revision, which made the component re-adopt the Host value and clear the note the save had just set. The eight fields now go in one atomic `mutate`, and a revision the save itself caused is told apart from an outside edit.
- Fixed Apply staying disabled forever after a refused save: format errors and write failures shared one state, so one refused Host write locked the button and painted the code field red. They are now separate — only an unparseable code blocks saving, and a refused write is directly retryable.
- Fixed toggling the seat-follow switch discarding unsaved colour edits: the switch writes its own field, which also advances the revision and made the component overwrite the draft with the Host value. The Host value is now adopted only when the colours actually changed.
- Added the missing provider-catalog failure rows: a failed provider used to vanish from the menu silently; it is now listed with its name, the failure reason, and a retry control.
- Added model badges: a provider-declared `badge` used to be dropped; it now renders on the trigger and menu rows, toned by the declared emphasis.
- The effort slider is keyboard operable: the track is a real `role="slider"` with a focus ring and `aria-valuenow`, arrow keys step one level, Home/End jump to the ends, and Escape closes any open menu.
- The effort popover's heading and both end captions now come from the bilingual dictionary instead of hardcoded English literals.
- Dropped the unused `remote` / `remote.session` injections: this plugin reads the catalog through `modelDirectories` and never calls the RPC itself, so declaring them only made it wait on services it does not use.
- Removed dead code: the unused `noiseFreq` constant and the `--flash-deep` custom property no CSS rule ever read.
- Added TypeScript type checking (`tsc --noEmit`) and wired it into CI, fixing five type errors it exposed. CI now also verifies a rebuild matches the committed `lib/` and runs the real-SlotCore compatibility check.
- Shipped the SIL OFL text and third-party notice for the embedded Space Grotesk subset; previously only the MIT LICENSE was present, which was a compliance gap.

## [0.4.0] — 2026-11-10

**中文**

- 新增「重置颜色」按钮：一键恢复插件自带的蓝色（主色 `#679EFE`、六项自动派生、清空逐项自定义），并立即写回配置。
- 新增「最高思考强度文字跟随档位值颜色」开关：开启后，座位上的最高强度文字使用弹窗档位值颜色；关闭则保持中性的座位文字色。开关即时预览并持久化。
- 修复思考强度滑块手柄在浅色模式下多出的投影：浅色模式曾额外叠加 `0 0 3px` 阴影，看起来比深色模式“凸起”；现在两种外观共用同一套手柄样式（以深色模式为准）。
- 含 0.3.2 的修复：色相轨道胶囊圆角、拖到最右端不再回弹。

**English**

- Added a "Reset colours" button: restores the shipped blue in one press (master `#679EFE`, all six slots derived, per-slot overrides cleared) and writes it back immediately.
- Added a "Top-effort text follows the effort-value colour" switch: when on, the seat's top-effort label uses the popover effort-value colour; when off it keeps the neutral seat colour. The switch previews immediately and persists.
- Fixed the extra shadow on the effort slider handle in light mode: light mode added a `0 0 3px` shadow that made the handle look raised compared with dark mode. Both appearances now share one handle style, using dark mode as the reference.
- Includes the 0.3.2 fixes: pill-shaped hue track and no jump-back at the far right.

## [0.3.2] — 2026-11-09

**中文**

- 修复色相滑块拖到最右端后弹回最左端：颜色取整成 hex 后，`359.9°` 这一类接近 360° 的色相会被量化成纯红并读回 `0°`；现在拖动时保留用户实际选中的色相，仅在从色码/预设等外部来源取色时重新换算。
- 色相轨道改为胶囊圆角（`border-radius: 999px`），即高度一半的标准圆角。
- 其余与 0.3.1 一致：SVG 圆形滑块、跟随系统明暗主题、应用按钮使用宿主主按钮令牌。

**English**

- Fixed the hue thumb snapping back to the far left: after quantisation to a hex value, hues just below 360° (such as `359.9°`) collapse to pure red and read back as `0°`. The picked hue is now kept while dragging and only re-derived when the colour comes from another source (hex field, presets).
- The hue track is a full pill (`border-radius: 999px`, i.e. half its height).
- Everything else matches 0.3.1: SVG circular thumbs, host light/dark appearance, and primary-button tokens for Apply.

## [0.3.1] — 2026-11-09

**中文**

- 取色器的色相滑块与饱和度/明度滑块改由 SVG 圆绘制：宿主会重置普通元素的 `border-radius`，此前的圆角方块即由此而来。
- 修复色相滑块拖到最右端会跳到最左端的问题：色相上限取 `359.9°`，避免 `hsl(360)` 在 RGB 往返后读回 `0°`。
- 「配色方式」标题去掉左侧图标；颜色区块整体改为跟随系统明暗主题。
- 「应用」按钮改用宿主主按钮的填充/文字令牌：修复深色主题下白底白字导致按钮不可见的问题。
- 取色器几何与描边沿用设计稿：16px 色相条、正方形饱和度/明度区、实心圆滑块。

**English**

- Hue and saturation/brightness thumbs are now drawn as SVG circles: the host reset rewrites `border-radius` on plain elements, which is why they rendered as rounded squares.
- Fixed the hue thumb jumping from the far right to the far left: hue now tops out at `359.9°`, so the RGB round trip cannot read `hsl(360)` back as `0°`.
- Removed the icon beside the palette-mode heading; the colour section now follows the host light/dark appearance.
- The Apply button uses the host's primary-button fill/label tokens, fixing the invisible white-on-white button in dark mode.
- Picker geometry and strokes follow the design: 16px hue bar, square saturation/brightness field, solid circular thumbs.

## [0.3.0] — 2026-11-09

**中文**

- 新增「颜色切换器」：在插件详情页内调整思考强度座位的六项配色（弹层档位值、档位圆点、滑块把手、滑块外发光、点阵底色、点阵闪烁），调整即时预览、点击「应用」后保存到插件配置，重启后仍然生效。
- 默认按主色（弹层档位值）自动派生其余五项，派生在 OKLab 感知色彩空间完成；把主色设为原来的 `#679EFE` 时，六项颜色与旧版逐位一致。
- 支持逐项自定义：切换到「逐项自定义配色」后六项可分别取色，留空的项继续跟随主色。
- 未安装设置服务或不提供本插件配置的宿主上不显示该区块，配色保持原样。
- 适配目标仍为 DSH `0.2.2-rc.1`；兼容范围保持 `>=0.1.5-alpha.1`。

**English**

- Added a colour switcher on the plugin's own detail page for the six effort-seat colours (effort value, effort dot, slider handle, slider glow, dot matrix, matrix flash). Edits preview immediately; Apply saves them to the plugin configuration, so they survive a restart.
- By default all five other slots derive from the main colour (the effort value) in OKLab perceptual space; keeping `#679EFE` reproduces the previous palette byte for byte.
- Per-slot customisation is available: switch to "Customise each slot" and pick each colour independently; cleared slots keep following the main colour.
- The section stays hidden on hosts without the settings service or without this plugin's configuration schema, and the shipped colours remain.
- Adaptation target stays DSH `0.2.2-rc.1`; the supported range stays `>=0.1.5-alpha.1`.

## [0.2.6] — 2026-10-26

**中文**

- 新增本更新日志，并在发布包中一同分发。
- 模型座位与思考强度座位改用与弹层一致的字体（Space Grotesk）；该字体只含拉丁字符，中文自动回退到官方座位所用的宿主字体，不会出现缺字。
- 思考强度座位由品牌蓝改为灰色（对齐官方模型座位的强度文案配色），并加粗到 600。
- 模型名与思考强度之间的间距由约 18px 收紧到 12px；按钮高度、圆角与内边距不变，悬停高亮仍各自独立。
- 弹层内 `Effort`、`Faster`、`Smarter` 的文字灰阶调淡一档；档位数值仍是主色。
- 适配目标更新为 DSH `0.2.1-rc.3`；兼容范围保持 `>=0.1.5-alpha.1`。

**English**

- Added this changelog and ship it inside the published package.
- Both seats now use the popup's typeface (Space Grotesk). That face covers Latin only, so Chinese text falls back to the host font the official seat uses — no missing glyphs.
- The effort seat switched from brand blue to the gray used by the official seat's effort caption, and is now weight 600.
- Tightened the gap between model name and effort from about 18px to 12px. Button height, radius and padding are unchanged, and each hover highlight stays independent.
- Popup `Effort`, `Faster` and `Smarter` labels are one step lighter gray; the value itself keeps the primary color.
- Adaptation target is now DSH `0.2.1-rc.3`; the supported range stays `>=0.1.5-alpha.1`.

## [0.2.5] — 2026-10-18

**中文**

- 修复思考强度档位文字在不同字体间切换（例如 `Max` 与中文「默认」）时的上下偏移：改为按当前平台字体实测的行高固定文字行高，按钮与弹层不再随着字号回退而升降。
- 调整思考强度时只让强度按钮进入忙碌状态，模型入口不再跟着变暗；模型列表项在请求完成前仍不可选，避免两个切换请求互相覆盖。

**English**

- Fixed vertical shifting when effort labels switch between Latin and fallback fonts (for example `Max` versus the Chinese default). Each label now pins the line box measured from the current platform's own font, so neither the trigger nor the popup moves.
- An effort change now only puts the effort trigger in its busy state; the model trigger no longer dims. Model rows stay disabled until the request settles, so two selections cannot overwrite each other.

## [0.2.4] — 2026-10-18

**中文**

- 修复与 DSH 0.2.1 官方模型选择器重复声明 `conversation.input.model.label` 子插槽导致的加载失败；同时改回显示模型目录提供的原名，不再声明官方已占用的子插槽。
- 修复模型列表加载完成后，切换模型失败的错误提示被隐藏的问题。
- 兼容范围恢复为 `>=0.1.5-alpha.1`，同时兼容旧版 `select()` 返回 `void`／抛错与新版的结果信封；已用 `0.1.5-alpha.1`、`0.2.0-rc.2`、`0.2.1-rc.2`、`0.2.1-rc.3` 的真实插槽实现验证注册与卸载。
- 移除已废弃的 invariant 机制；桌面端改为通过插件界面安装与更新。

**English**

- Fixed a load failure caused by declaring the same `conversation.input.model.label` child slot that the official DSH 0.2.1 selector already owns. The switcher now shows the catalog's original model name and leaves that child slot alone.
- Fixed the selection error being hidden once the model list finished loading.
- Restored the `>=0.1.5-alpha.1` compatibility range and handled both the legacy `select()` (returns `void` or throws) and the newer result envelope. Registration and unload were verified against the real slot implementations of `0.1.5-alpha.1`, `0.2.0-rc.2`, `0.2.1-rc.2` and `0.2.1-rc.3`.
- Removed the retired invariant mechanism; Desktop installs and updates through the plugin UI.

## [0.2.3] — 2026-10-02

**中文**

- 适配 DSH `0.2.0-rc.2`，使其能正常加载。

**English**

- Adapted to DSH `0.2.0-rc.2` so the plugin loads again.