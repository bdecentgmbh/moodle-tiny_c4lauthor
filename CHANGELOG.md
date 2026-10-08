# Changelog

## 1.5.0-beta

### Added

- Other plugins can add components and editor stylesheets through a new hook,
  `\tiny_c4lauthor\hook\extend_components`, without changing C4L Author. Their
  components can use their own templates, strings and icons, appear under a new
  *Templates* category in the sidebar, work with variants and precision mode, and can
  insert what an AMD module of theirs returns instead of a template. See the README.

### Changed

- The two student settings list every component, including the ones other plugins
  add. Each component declares whether it is aimed at students. Saved choices stay
  as they are; a component an admin has not seen in the settings yet counts with its
  default. The components that were in neither list (concept review, further reading,
  statement, assessment, panel list, timeline, combo) are listed as not intended for
  students, so students still do not get them until an admin ticks them.

## 1.4.1-beta

### Fixed

- Precision mode on *Estimated time* and *Grading value* replaced the whole
  component with the new value, losing "min" and "Grading value:". It looked for
  the span around that fixed text, which the editor removes. The field now edits
  the span around the value, which the editor keeps, so it also works on content
  inserted earlier.

## 1.4.0-beta

### Changed

- Components are declared in `db/components.php` and their markup lives in Mustache
  templates (`templates/components/`), instead of in JavaScript. The editor fetches
  the declarations through a new web service, `tiny_c4lauthor_get_components`. The
  inserted markup is unchanged; a test compares every component with the markup
  1.3.0-beta inserted.
- Precision mode reads its fields from the declarations. Fields that need custom
  code name a handler in `precise_handlers.js`.
- `commands.js` is split into modules: the convert menu, the sidebar, the variant
  toolbar, the dropdown, the icons and the component markup each have their own.

### Fixed

- `variantslib.js` imported the variant list under a name `variants.js` did not
  export, so restoring a variant preference that named a variant failed with an
  error. It now gets the variants from the declarations.

## 1.3.0-beta

### Added

- Three helpers, contributed by bdecent from the eduHub project:
  - *Panel list*: a list of panels, numbered or with checkmarks, optionally compact
    or full width.
  - *Timeline*: events with a year and a text, optionally full width or split, with
    continuity marks before or after. Precision mode edits each event's year and
    text.
  - *Combo*: text and image side by side, in either order.
- Variants can form groups (exactly one active, such as numbered or checkmarks) and
  exclude others (full width and split).
- A component can declare its own wrapper class instead of a `c4lv-` one.
- Brand colour tokens (`--c4l-brand` and its tints) that follow the site's primary
  colour, also inside the editor, with dark-mode values. The new helpers use them.
- The mobile app styles cover the three helpers.
## 1.2.2-beta

### Changed

- A new capability, `tiny/c4lauthor:useallcomponents`, decides who sees all
  components in the sidebar. It replaces the check on `gradereport/grader:view`
  and has the same default roles (teacher, editing teacher, manager), so standard
  roles see no change. Users without it see only the components listed for
  students. This guides authoring and is not access control.
- The README no longer mentions the Figtree font, which the plugin does not ship.

## 1.2.1-beta

### Security

- Editor content is only ever handled as data outside the editor: the modal passes it
  to its editor as a value, the precision preview runs in a sandboxed frame that cannot
  execute scripts, and the AI view sanitises the component previews it shows.
- AI suggest checks the site's AI policy (asking the user to accept it first), the
  per-course and per-activity AI setting where Moodle has one, the `aisuggest`
  capability and the plugin setting, both in the editor and in the web service. The
  web service takes the paragraphs as a structured, size-limited list.
- AI provider error messages are no longer shown in the browser; they are logged as
  debugging output instead.
- Text selected in the editor is inserted into a component as text, never as markup.
- `pluginfile` serves only the plugin's own file areas.

### Changed

- AI suggest is switched off by default on new installations. Existing sites keep
  their current setting.
- The plugin loads only for users with both `tiny/c4lauthor:use` and
  `tiny/c4lauthor:viewplugin`, on every supported Moodle version.
- Admin-defined custom component HTML is cleaned with `clean_text()` instead of
  `format_text()`, so text filters no longer run over it.
- The precision view no longer leaves its internal `data-c4l-idx` attributes in the
  content.
- Uninstalling removes the plugin's user preference.
- Tests: a Behat smoke test for the modal; CI covers Moodle 4.5 to 5.3 and runs on pull
  requests.

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
