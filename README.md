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

## Adding a component

Each component is two files:

- its declaration in `db/components.php`: id, category, sidebar icon, default text,
  docs strings, variants, its position in the "Convert to" menu and the fields
  precision mode offers. `\tiny_c4lauthor\local\components` documents every key.
- its markup in `templates/components/<name>.mustache`. The template gets
  `placeholder` (the text span, already HTML), `variantclasses`, `variantshtml`
  (HTML the active variants add, such as a caption) and `uniqid`. Strings use
  `{{#str}}key, tiny_c4lauthor{{/str}}`.

Add the strings to `lang/en/tiny_c4lauthor.php` and the styles to `scss/`. A variant
that adds HTML has its own template in `templates/variants/`. Precision fields that a
CSS selector alone cannot read or write name a handler from `amd/src/precise_handlers.js`.

`tests/local/components_test.php` checks that the declarations are consistent and
that each component renders exactly the markup in `tests/fixtures/components/`.
Changing a component's markup means updating its fixtures in the same commit.

`students => true` offers a component to students by default. The two student
settings list every component; one an admin has not seen there yet counts with its
default.

## Tabs, carousel and collapsible

These helpers are plain markup recognised by their classes, so they survive Moodle's
HTML cleaning (which removes `<button>`, `role`, `aria-*` and `data-*` for untrusted
content) and work with Bootstrap 4 and 5 alike. Without JavaScript, and in the Moodle
app, every tab, slide and collapsible content is shown. On the page,
`amd/src/runtime.js` adds the buttons, the ARIA attributes and the behaviour; a hook
callback loads it on every page, and it does nothing where these helpers are absent.

The runtime also reads the Bootstrap-based markup of the C4L Author bdecent build and
turns it into this markup when the page loads, so content made with that build keeps
working. A link block from that build keeps its address only in its text; the runtime
copies it into the link only if it is an http, https or mailto address.

In the C4L Author editor, `amd/src/editor_widgets.js` shows one tab or slide at a time,
with controls to switch, add and delete them and to add an image to a slide. The
controls are never saved.

## Standalone fallback

Uninstalling the plugin takes its styles and page script with it, so content made with
it loses its look, and tabs, carousels and collapsibles stop switching. *Site
administration > Plugins > Text editors > TinyMCE editor > C4L Author > Standalone
fallback* offers the content styles and the page script to copy into the site first:
the styles into the theme's Raw SCSS (served as a cached stylesheet), the script into
Additional HTML. They do not depend on Moodle's JavaScript.

Both are built into `dist/` by `node tools/build-standalone.mjs`: the styles from
`scss/standalone.scss` (content only, icons inlined once each), the script from
`amd/src/runtime.js`. CI fails when `dist/` does not match the sources, so run the
script after changing either.

## Adding components from another plugin

Another plugin adds components through the `\tiny_c4lauthor\hook\extend_components`
hook, without changing C4L Author. Register a callback in its `db/hooks.php`:

```php
$callbacks = [
    [
        'hook' => \tiny_c4lauthor\hook\extend_components::class,
        'callback' => [\local_example\hook_callbacks::class, 'extend_c4lauthor'],
    ],
];
```

and add components and editor stylesheets in the callback:

```php
public static function extend_c4lauthor(\tiny_c4lauthor\hook\extend_components $hook): void {
    $hook->add_component('local_example', 'banner', [
        'category' => 'templates',
        'template' => 'local_example/banner',
        'menuicon' => 'banner',
        'text' => 'Welcome to the course',
        'docs' => ['description' => 'banner_desc'],
        'variants' => ['full-width'],
        'precision' => [
            ['selector' => 'span[data-id]', 'label' => 'banner_text', 'type' => 'textarea', 'fallback' => true],
        ],
        'students' => false,
    ]);
    $hook->add_editor_stylesheet(new \moodle_url('/local/example/editor.css'));
    $hook->add_page_module('local_example/runtime');
}
```

A declaration takes the keys of `db/components.php`, except `id` and `convertible`.
Its template, icon (in the plugin's `pix/`) and strings belong to the plugin that adds
it; a string key may name another plugin as `component/key`. The label is the string
named like the component, or the one in `label`. The category may also be `templates`.
The name must be unique: lower case letters, digits and underscores, not used by
C4L Author. Its label and documentation strings are shown as text, without markup. A declaration C4L Author cannot use is left out with a developer debugging
message.

The plugin's `styles.css` styles the component on the page. The editor's content does
not load it, so add the same rules as an editor stylesheet. A page module's `init()`
runs on every page, for components that need behaviour, like tabs; it should return
quickly where its components are absent.

Instead of its template, a component can insert what an AMD module of the plugin
returns, for example after the teacher has picked something:

```php
'inserter' => 'local_example/banner_picker',
```

```js
export const insert = async({editor, component, selectedText, render}) => {
    // render() resolves with the component's own markup.
    return '<div class="c4lv-banner">...</div>'; // Or null to insert nothing.
};
```

The components can be filtered by the hook's `context`, the context of the editor.
The hook is called on every page with an editor, so keep the callback cheap.

## Building from source

The compiled `styles.css` and `editor_styles.css` are generated from `scss/`:

```sh
npm install
npm run sass
```

The standalone fallback in `dist/` is built from the plugin directory with
`node tools/build-standalone.mjs`.

JavaScript is built with Moodle's own Grunt setup, from the Moodle root:

```sh
npx grunt amd --root=public/lib/editor/tiny/plugins/c4lauthor
```

Note that Moodle pins Node to `>=22.11.0 <23`; a newer Node will fail the install.

## Capabilities

- `tiny/c4lauthor:viewplugin` — controls plugin visibility for any role.
- `tiny/c4lauthor:use` — allows using the plugin.
- `tiny/c4lauthor:aisuggest` — allows using the AI suggest feature.
- `tiny/c4lauthor:useallcomponents` — offers all components in the sidebar. Users without it see only the components listed for students in the settings. Teachers and managers have it by default. This steers authoring and is not access control.

## Icons

Icons authored by Roger Segú, except for the following, licensed under Creative Commons CCBY: [Glasses](https://thenounproject.com/icon/70907/) by Austin Condiff, [Estimate](https://thenounproject.com/icon/1061038/) by xwoodhillx, [Quote](https://thenounproject.com/icon/77920/) by Rohith M S, [Pin](https://thenounproject.com/icon/689105/) by Icons fest, [Bulb](https://thenounproject.com/icon/1175583/) by Adrien Coquet, [Date](https://thenounproject.com/icon/1272092/) by Karan, [Success](https://thenounproject.com/icon/3405499/) by Alice Design, [Clock](https://thenounproject.com/icon/2310543/) by Aybige, [Feedback](https://thenounproject.com/icon/651868/) by dilayorganci, [Star](https://thenounproject.com/icon/1368720/) by Zaff Studio, [Tag](https://thenounproject.com/icon/938953/) by Ananth, Redo, Book Open and Check circle by [Unicons](https://github.com/Iconscout/unicons), Clipboard, External link, Arrow right, Combo (derived), Tabs (derived), Styled table (derived), Carousel (derived), and Dropdown (derived) by [Feather icons](https://feathericons.com/).

## Related projects

- [Components for Learning](https://componentsforlearning.org) — the parent project with documentation, usage recommendations and examples for all components.
- [tiny_c4l](https://moodle.org/plugins/tiny_c4l) — the original TinyMCE plugin for Moodle.
- [atto_c4l](https://moodle.org/plugins/atto_c4l) — the original Atto editor plugin.

## License

Licensed under the [GNU GPL v3 or later](http://www.gnu.org/copyleft/gpl.html).
