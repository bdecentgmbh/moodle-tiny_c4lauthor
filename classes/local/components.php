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

/**
 * The components and variants the editor offers.
 *
 * The declarations live in db/components.php, the markup each component inserts in
 * templates/components/<name>.mustache. A component declaration has these keys:
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
    /** @var array|null The declarations from db/components.php, loaded once. */
    private static ?array $declarations = null;

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
            self::$declarations = ['components' => $components, 'variants' => $variants];
        }
        return self::$declarations;
    }

    /**
     * Get the component declarations, keyed by component name.
     *
     * @return array
     */
    public static function get_components(): array {
        return self::declarations()['components'];
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
     * Get everything the editor needs: components, variants and the strings they use.
     *
     * @return array with keys components, variants and strings, shaped like the
     *               return value of the tiny_c4lauthor_get_components web service
     */
    public static function export_for_editor(): array {
        $keys = ['textplaceholder'];
        $components = [];
        foreach (self::get_components() as $name => $component) {
            $keys[] = $name;
            $docs = $component['docs'] ?? null;
            if ($docs) {
                $keys = array_merge($keys, array_filter([$docs['description'] ?? null]), $docs['usecases'] ?? []);
            }
            foreach ($component['precision'] ?? [] as $field) {
                $keys[] = $field['label'];
                $keys = array_merge($keys, array_column($field['subfields'] ?? [], 'label'));
            }
            $components[] = [
                'name' => $name,
                'id' => $component['id'],
                'category' => $component['category'],
                'template' => $component['template'],
                'iconclass' => $component['iconclass'],
                'menuicon' => $component['menuicon'] ?? '',
                'wrapperclass' => $component['wrapperclass'] ?? '',
                'text' => $component['text'] ?? '',
                'docs' => [
                    'description' => $docs['description'] ?? '',
                    'usecases' => $docs['usecases'] ?? [],
                ],
                'variants' => $component['variants'] ?? [],
                'convertible' => $component['convertible'] ?? 0,
                'precision' => array_map([self::class, 'export_field'], $component['precision'] ?? []),
            ];
        }

        $variants = [];
        foreach (self::get_variants() as $name => $variant) {
            $keys[] = $name;
            $variants[] = [
                'name' => $name,
                'id' => $variant['id'],
                'template' => $variant['template'] ?? '',
                'group' => $variant['group'] ?? '',
                'excludes' => $variant['excludes'] ?? [],
            ];
        }

        $manager = get_string_manager();
        $strings = [];
        foreach (array_unique($keys) as $key) {
            if ($manager->string_exists($key, 'tiny_c4lauthor')) {
                $strings[] = ['key' => $key, 'value' => get_string($key, 'tiny_c4lauthor')];
            }
        }

        return ['components' => $components, 'variants' => $variants, 'strings' => $strings];
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
