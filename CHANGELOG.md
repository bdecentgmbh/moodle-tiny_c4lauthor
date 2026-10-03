# Changelog

## 1.2.0-beta

### Added

- Dark mode. The plugin now follows Bootstrap's colour-mode attribute, so on Boost it
  tracks *Enable colour modes* with no configuration: the components a course renders,
  the component picker's icons, the modal interface, the AI, code and precision views,
  and the editor content itself. See the Dark mode section of the README.
- A colour token layer in `scss/_tokens.scss`: the palette as CSS custom properties in
  two tiers, so a site can recolour a single component by overriding one alias without
  rebuilding anything. The same layer ships in `tiny_c4l`, so a component renders
  identically in both plugins.
- `package.json`, so `npm run sass` rebuilds `styles.css` and `editor_styles.css`
  reproducibly. See the Building from source section of the README.
- `CHANGELOG.md` — this file. Releases before 1.2.0-beta are not recorded here.

### Changed

- `styles.css` and `editor_styles.css` ship expanded rather than minified, which is
  what every tiny plugin in core does and what lets stylelint check them. Minifying
  here saved nothing, since Moodle minifies the aggregated CSS when serving it. The
  declarations are unchanged; the diffs are now readable.
- Component badges and glyphs are drawn as alpha masks rather than coloured SVGs, so
  one asset serves both colour modes and takes its colour from a token. Component
  rendering in light mode is unchanged.
- The component picker's interface greys now come from the shared token layer. Four of
  them shift slightly in light mode: label and pill text from `#495057` to `#424b62`,
  group headers from `#6e767e` to `#535d76`, component button labels from `#1e1e1e` to
  `#424b62`, and button and menu hover from `#f0f3f7` to `#e7ebef`.
- The focus ring on precision-view fields is more visible, having moved to the shared
  focus token.
- The inner editor uses TinyMCE's `oxide-dark` skin on a dark page. Because TinyMCE
  cannot swap a skin on a live instance, the skin is fixed when the modal opens: a page
  that changes colour mode with the modal open keeps the skin it started with until the
  modal is reopened.

### Fixed

- Learning outcomes: the fold under the title tab sat 12px too high. The value came from
  `tiny_c4l`, where the title is an `<h6>` beside a nested `<ul>`; here it is an `<li>`
  of the outer list.
- Learning outcomes and Statement with the `full-width` variant overflowed their
  container, the first because of the title tab that hangs off the left edge, the second
  because of its shadow and tag. They are now capped at 99% and 96%.
- Figure, `caption` variant: a missing closing quote on the caption's `aria-label` swallowed
  the "Source:" line into the attribute, so it never rendered.

### Known gaps

- `pix/statement-tag.svg` keeps its colour baked in; it is two-tone and used through
  `content: url(...)` rather than as a mask, so it does not follow the colour mode.
- `mobileapp/styles.css` has no dark mode. The Moodle app does not use
  `data-bs-theme`; its dark mode comes from Ionic and needs a separate approach.
- Seventeen of the picker's icons are two-tone in light mode and lose their pale
  backing shape in dark, where a single-channel mask cannot express two colours.
