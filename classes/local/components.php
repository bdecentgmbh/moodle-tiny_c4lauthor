<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace tiny_c4lauthor\local;

use core\context;
use tiny_c4lauthor\hook\extend_components;

/**
 * The components and variants the editor offers.
 *
 * The declarations live in db/components.php, the markup each component inserts in
 * templates/components/<name>.mustache. Other plugins add components through the
 * \tiny_c4lauthor\hook\extend_components hook. A component declaration has these keys:
 *
 * - id: number of the component (admin custom components use 1000 + their slot)
 * - category: contextual, procedural, evaluative or helper
 * - template: the Mustache template with the markup to insert
 * - iconclass: class of the component's button in the sidebar
 * - menuicon: pix path of the icon in the quick-insert menu (optional)
 * - wrapperclass: class that identifies the component when it has no c4lv- class (optional)
 * - text: default text of the placeholder, may contain markup
 * - docs: lang string keys of the description and the use cases (optional)
 * - variants: names of the variants the component supports
 * - convertible: position in the "Convert to" menu, for components that can be converted (optional)
 * - precision: the fields precision mode offers (optional)
 * - students: whether students are offered the component by default (optional)
 *
 * A variant declaration has an id, an optional template with HTML it adds to the
 * component, an optional group (exactly one variant of a group is active) and an
 * optional list of variants it excludes.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class components {
    /** @var string[] Categories of the sidebar. */
    private const CATEGORIES = ['contextual', 'procedural', 'evaluative', 'helper'];

    /** @var string[] Field types precision mode knows. */
    private const FIELD_TYPES = ['textarea', 'input', 'list', 'image-src', 'image-alt'];

    /** @var array|null The declarations from db/components.php, loaded once. */
    private static ?array $declarations = null;

    /** @var array What other plugins added, by context id. */
    private static array $extensions = [];

    /**
     * Load the declarations.
     *
     * @return array with keys components and variants
     */
    private static function declarations(): array {
        if (self::$declarations === null) {
            $components = [];
            $variants = [];
            require(\core_component::get_component_directory('tiny_c4lauthor') . '/db/components.php');
            foreach ($components as $name => $component) {
                $components[$name]['component'] = 'tiny_c4lauthor';
            }
            self::$declarations = ['components' => $components, 'variants' => $variants];
        }
        return self::$declarations;
    }

    /**
     * Get what other plugins add through the hook in a context, checked.
     *
     * @param context $context
     * @return array with keys components and stylesheets
     */
    private static function extensions(context $context): array {
        if (!isset(self::$extensions[$context->id])) {
            $hook = new extend_components($context);
            try {
                \core\di::get(\core\hook\manager::class)->dispatch($hook);
            } catch (\Throwable $e) {
                // A plugin's mistake should not take the editor down.
                debugging('A callback of the tiny_c4lauthor extend_components hook failed: ' . $e->getMessage(), DEBUG_DEVELOPER);
            }

            $components = [];
            $taken = array_keys(self::declarations()['components']);
            foreach ($hook->get_components() as [$component, $name, $declaration]) {
                $added = self::check_added($component, $name, $declaration, $taken);
                if ($added) {
                    $components[$name] = $added;
                    $taken[] = $name;
                }
            }
            self::$extensions[$context->id] = [
                'components' => $components,
                'stylesheets' => $hook->get_editor_stylesheets(),
                'pagemodules' => array_values(array_filter(
                    $hook->get_page_modules(),
                    fn($module) => preg_match('~^[a-z][a-z0-9_]*/[a-z0-9_/-]+$~', $module)
                )),
            ];
        }
        return self::$extensions[$context->id];
    }

    /**
     * Check and complete a declaration another plugin added.
     *
     * @param string $component Plugin that added it.
     * @param string $name
     * @param array $declaration
     * @param string[] $taken Names already used.
     * @return array|null the declaration, or null if it cannot be used
     */
    private static function check_added(string $component, string $name, array $declaration, array $taken): ?array {
        $problem = null;
        $variants = self::get_variants();
        if (clean_param($component, PARAM_COMPONENT) !== $component || !\core_component::get_component_directory($component)) {
            $problem = 'unknown plugin';
        } else if (!preg_match('/^[a-z][a-z0-9_]*$/', $name) || str_starts_with($name, 'customcomp')) {
            $problem = 'invalid name';
        } else if (in_array($name, $taken) || get_string_manager()->string_exists($name, 'tiny_c4lauthor')) {
            $problem = 'name already used';
        } else if (!in_array($declaration['category'] ?? '', [...self::CATEGORIES, 'templates'])) {
            $problem = 'unknown category';
        } else if (!str_starts_with($declaration['template'] ?? '', $component . '/')) {
            $problem = 'template not in ' . $component;
        } else if (!empty($declaration['inserter']) && !str_starts_with($declaration['inserter'], $component . '/')) {
            $problem = 'inserter not in ' . $component;
        }
        if ($problem) {
            debugging("C4L Author component $name from $component ignored: $problem", DEBUG_DEVELOPER);
            return null;
        }

        // Strings are the adding plugin's, unless the key names another component (component/key).
        $namespaced = fn($key) => str_contains($key, '/') ? $key : $component . '/' . $key;
        $docs = $declaration['docs'] ?? [];
        $precision = [];
        foreach ($declaration['precision'] ?? [] as $field) {
            if (!in_array($field['type'] ?? '', self::FIELD_TYPES) || empty($field['label'])) {
                debugging("C4L Author component $name from $component: precision field ignored", DEBUG_DEVELOPER);
                continue;
            }
            $field['label'] = $namespaced($field['label']);
            foreach ($field['subfields'] ?? [] as $index => $subfield) {
                $field['subfields'][$index]['label'] = $namespaced($subfield['label']);
            }
            $precision[] = $field;
        }

        return [
            'component' => $component,
            'label' => $declaration['label'] ?? $name,
            'category' => $declaration['category'],
            'template' => $declaration['template'],
            'iconclass' => $declaration['iconclass'] ?? 'c4l-custom-icon',
            'menuicon' => $declaration['menuicon'] ?? '',
            'wrapperclass' => $declaration['wrapperclass'] ?? '',
            'text' => $declaration['text'] ?? '',
            'docs' => [
                'description' => empty($docs['description']) ? '' : $namespaced($docs['description']),
                'usecases' => array_map($namespaced, $docs['usecases'] ?? []),
            ],
            'variants' => array_values(array_filter(
                $declaration['variants'] ?? [],
                fn($variant) => isset($variants[$variant])
            )),
            'precision' => $precision,
            'inserter' => $declaration['inserter'] ?? '',
            'students' => !empty($declaration['students']),
        ];
    }

    /**
     * Forget what other plugins added, so that the hook is dispatched again.
     */
    public static function reset_caches(): void {
        self::$extensions = [];
    }

    /**
     * Get the component declarations, keyed by component name.
     *
     * @param context|null $context Where the editor is used, for components other plugins add; system if null.
     * @return array
     */
    public static function get_components(?context $context = null): array {
        $context = $context ?? \core\context\system::instance();
        return self::declarations()['components'] + self::extensions($context)['components'];
    }

    /**
     * Get the variant declarations, keyed by variant name.
     *
     * @return array
     */
    public static function get_variants(): array {
        return self::declarations()['variants'];
    }

    /**
     * Get the stylesheets other plugins add to the content of the editor.
     *
     * @param context $context
     * @return \moodle_url[]
     */
    public static function get_editor_stylesheets(context $context): array {
        return self::extensions($context)['stylesheets'];
    }

    /**
     * Get the AMD modules other plugins add for the behaviour of their components on pages.
     *
     * @param context $context
     * @return string[]
     */
    public static function get_page_modules(context $context): array {
        return self::extensions($context)['pagemodules'];
    }

    /**
     * Get the label of a component.
     *
     * @param string $name
     * @param array $component its declaration
     * @return string
     */
    public static function get_label(string $name, array $component): string {
        return get_string($component['label'] ?? $name, $component['component']);
    }

    /**
     * Get the names of the components offered to students.
     *
     * Those an admin chose in either setting, and those the admin has not seen in the settings
     * yet that are offered to students by default.
     *
     * @param context $context
     * @return string[]
     */
    public static function get_student_components(context $context): array {
        $config = get_config('tiny_c4lauthor');
        $chosen = array_merge(
            explode(',', $config->aimedatstudents ?? ''),
            explode(',', $config->notintendedforstudents ?? '')
        );
        $known = explode(',', $config->studentcomponentsknown ?? '');
        $names = [];
        foreach (self::get_components($context) as $name => $component) {
            if (in_array($name, $chosen) || (!in_array($name, $known) && !empty($component['students']))) {
                $names[] = $name;
            }
        }
        return $names;
    }

    /**
     * Get everything the editor needs: components, variants and the strings they use.
     *
     * @param context $context Where the editor is used.
     * @return array with keys components, variants and strings, shaped like the
     *               return value of the tiny_c4lauthor_get_components web service
     */
    public static function export_for_editor(context $context): array {
        global $OUTPUT;

        // Lang strings by key; the keys of strings from other plugins are prefixed with the plugin.
        $strings = [];
        $string = function (string $key, string $component) use (&$strings) {
            [$stringcomponent, $stringkey] = str_contains($key, '/') ? explode('/', $key, 2) : [$component, $key];
            if (!isset($strings[$key]) && get_string_manager()->string_exists($stringkey, $stringcomponent)) {
                $strings[$key] = get_string($stringkey, $stringcomponent);
            }
        };
        $string('textplaceholder', 'tiny_c4lauthor');

        $components = [];
        foreach (self::get_components($context) as $name => $component) {
            // The editor finds a component's label under its name.
            $strings[$name] = self::get_label($name, $component);
            $docs = $component['docs'] ?? null;
            foreach (array_merge(array_filter([$docs['description'] ?? null]), $docs['usecases'] ?? []) as $key) {
                $string($key, $component['component']);
            }
            foreach ($component['precision'] ?? [] as $field) {
                $string($field['label'], $component['component']);
                foreach ($field['subfields'] ?? [] as $subfield) {
                    $string($subfield['label'], $component['component']);
                }
            }
            $added = !isset(self::declarations()['components'][$name]);
            $exported = [
                'name' => $name,
                'component' => $component['component'],
                'category' => $component['category'],
                'template' => $component['template'],
                'iconclass' => $component['iconclass'],
                'menuicon' => $component['menuicon'] ?? '',
                'icon' => $added && !empty($component['menuicon'])
                    ? $OUTPUT->image_url($component['menuicon'], $component['component'])->out(false)
                    : '',
                'wrapperclass' => $component['wrapperclass'] ?? '',
                'text' => $component['text'] ?? '',
                'docs' => [
                    'description' => $docs['description'] ?? '',
                    'usecases' => $docs['usecases'] ?? [],
                ],
                'variants' => $component['variants'] ?? [],
                'convertible' => $component['convertible'] ?? 0,
                'precision' => array_map([self::class, 'export_field'], $component['precision'] ?? []),
                'inserter' => $component['inserter'] ?? '',
            ];
            if (isset($component['id'])) {
                $exported['id'] = $component['id'];
            }
            $components[] = $exported;
        }

        $variants = [];
        foreach (self::get_variants() as $name => $variant) {
            $string($name, 'tiny_c4lauthor');
            $variants[] = [
                'name' => $name,
                'id' => $variant['id'],
                'template' => $variant['template'] ?? '',
                'group' => $variant['group'] ?? '',
                'excludes' => $variant['excludes'] ?? [],
            ];
        }

        $exportedstrings = [];
        foreach ($strings as $key => $value) {
            $exportedstrings[] = ['key' => $key, 'value' => $value];
        }
        return ['components' => $components, 'variants' => $variants, 'strings' => $exportedstrings];
    }

    /**
     * Shape a precision field for the web service.
     *
     * @param array $field
     * @return array
     */
    private static function export_field(array $field): array {
        return [
            'selector' => $field['selector'] ?? '',
            'label' => $field['label'],
            'type' => $field['type'],
            'innerhtml' => !empty($field['innerhtml']),
            'fallback' => !empty($field['fallback']),
            'optional' => !empty($field['optional']),
            'handler' => $field['handler'] ?? '',
            'subfields' => $field['subfields'] ?? [],
        ];
    }
}
