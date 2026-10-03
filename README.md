# C4L Author

A TinyMCE editor plugin for Moodle that extends the original [Components for Learning (C4L)](https://moodle.org/plugins/tiny_c4l) with an enhanced authoring experience. It opens a modal with a WYSIWYG editable view of the editor content, constrained to a readable column width, and provides a full set of C4L visual components designed explicitly for learning.

C4L Author is built on top of the [Components for Learning](https://componentsforlearning.org) project and includes all its components, plus additional features such as:

- A distraction-free modal editor with comfortable reading width.
- Convert to: transform any component into another compatible one.
- AI suggest: AI-powered analysis that suggests C4L components for your content.
- Component variants and full-width options.
- Custom components defined by the administrator.
- Documentation tooltips for each component.

## Installation

Install the plugin from the Site Administration area (Plugins > Install plugins > Install plugin from ZIP file).

Once installed, a button will appear in the TinyMCE editor toolbar. Clicking it opens the C4L Author modal where you can edit content and insert components.

## Configuration

Settings are available at Site Administration > Plugins > Text Editors > TinyMCE editor > C4L Author:

- **General**: enable/disable component preview on hover, documentation tooltips, overlay mode, and configure which components are available to students.
- **AI suggest**: enable/disable the AI suggestion feature and configure component types and rates.
- **Custom components**: define additional components with custom HTML and CSS.

## AI suggest requirements

The AI suggest feature uses Moodle's built-in AI subsystem (available from Moodle 4.5). The site administrator must configure an AI provider (such as OpenAI or Ollama) and supply their own API key at Site Administration > AI. No API key is bundled with this plugin.

If no AI provider is configured, the AI suggest button will display a message prompting the administrator to set one up. The AI suggest feature can also be disabled entirely from the plugin settings.

## Dark mode

Moodle has no dark mode of its own, so this plugin follows Bootstrap's colour-mode
attribute, which Boost already compiles: everything below applies when
`data-bs-theme="dark"` is set on the `<html>` element.

On Boost that attribute appears once *Enable colour modes* is ticked, under *Site
administration → Appearance → Themes → Boost → Experimental*. It is off by default,
and until it is on there is no dark mode to follow and nothing here changes.

**It works out of the box.** There is nothing to switch on. This differs from
`tiny_c4l`, which ships the dark values for its own interface commented out as two
opt-in blocks; here the plugin interface binds to Boost's custom properties instead,
so it tracks whatever the theme does.

### How it is put together

Colours live in `scss/_tokens.scss` as CSS custom properties, in two tiers. The same
layer ships in `tiny_c4l`, so the two plugins render a component identically; this
copy adds the tokens for the parts C4L has no equivalent of.

The split that matters is **who owns the colour**:

- **The components are C4L's.** A "tip" is magenta on every Moodle, light or dark, so
  nothing in that half resolves to a theme variable. The colour mode supplies a
  boolean — is the page dark? — never a colour. Dark values come from C4L's reference
  document.
- **The plugin interface is the editor's own chrome**, and the modal it lives in is a
  Bootstrap modal in the host document, so its tokens bind to `--bs-*`. The one
  exception is the floating variant toolbar: it sits *inside* the editor iframe next
  to the components, so it follows C4L's palette rather than the theme's.

Two structural things happen in dark mode. The component tints collapse into the
surface — in light the hue is carried by the fill, in dark by the accent bar, the icon
and the ink, because large saturated dark fills muddy — and a 1px border does the
delineation instead. And the text on solid fills inverts to near-black, because those
fills lighten rather than darken.

### Recolouring a component

Override the tier-2 aliases, not the primitives. To make key concepts green on every
site, in your theme's raw SCSS or in *Additional HTML*:

```css
:root, [data-bs-theme="dark"] {
    --c4l-keyconcept-bg:     #f1fbf5;
    --c4l-keyconcept-accent: #1cc460;
}
```

These are only custom properties, so nothing has to be rebuilt.

### Icons

Component badges and glyphs are rendered as alpha masks: the SVG carries the shape and
the colour comes from a token, so one asset serves both modes. Masks for the component
picker's icons live in `pix/mask/`.

Seventeen of the picker's icons are drawn in two tones — the glyph, plus a pale backing
shape. A mask carries one alpha channel and cannot express two colours, so light mode
keeps the two-tone assets and only dark swaps in the flattened masks. In dark those
icons lose the backing shape, which is the right trade: on a dark button a pale fill is
exactly what should not be there.

### Known gaps

- **`pix/statement-tag.svg`** keeps its colour baked in. It is two-tone and is used
  through `content: url(...)` rather than as a mask, so it does not follow the mode.
- **`mobileapp/styles.css`** has no dark mode. The Moodle app does not use
  `data-bs-theme`; it has its own dark mode via Ionic, which needs a separate
  approach.

## Building from source

The compiled `styles.css` and `editor_styles.css` are generated from `scss/`:

```sh
npm install
npm run sass
```

JavaScript is built with Moodle's own Grunt setup, from the Moodle root:

```sh
npx grunt amd --root=public/lib/editor/tiny/plugins/c4lauthor
```

Note that Moodle pins Node to `>=22.11.0 <23`; a newer Node will fail the install.

## Capabilities

- `tiny/c4lauthor:viewplugin` — controls plugin visibility for any role.
- `tiny/c4lauthor:use` — allows using the plugin.
- `tiny/c4lauthor:aisuggest` — allows using the AI suggest feature.

## Fonts

This plugin includes the Figtree font family (SIL Open Font License 1.1), inherited from the Components for Learning project.

## Icons

Icons authored by Roger Segú, except for the following, licensed under Creative Commons CCBY: [Glasses](https://thenounproject.com/icon/70907/) by Austin Condiff, [Estimate](https://thenounproject.com/icon/1061038/) by xwoodhillx, [Quote](https://thenounproject.com/icon/77920/) by Rohith M S, [Pin](https://thenounproject.com/icon/689105/) by Icons fest, [Bulb](https://thenounproject.com/icon/1175583/) by Adrien Coquet, [Date](https://thenounproject.com/icon/1272092/) by Karan, [Success](https://thenounproject.com/icon/3405499/) by Alice Design, [Clock](https://thenounproject.com/icon/2310543/) by Aybige, [Feedback](https://thenounproject.com/icon/651868/) by dilayorganci, [Star](https://thenounproject.com/icon/1368720/) by Zaff Studio, [Tag](https://thenounproject.com/icon/938953/) by Ananth, Redo and Book Open by [Unicons](https://github.com/Iconscout/unicons).

## Related projects

- [Components for Learning](https://componentsforlearning.org) — the parent project with documentation, usage recommendations and examples for all components.
- [tiny_c4l](https://moodle.org/plugins/tiny_c4l) — the original TinyMCE plugin for Moodle.
- [atto_c4l](https://moodle.org/plugins/atto_c4l) — the original Atto editor plugin.

## License

Licensed under the [GNU GPL v3 or later](http://www.gnu.org/copyleft/gpl.html).
