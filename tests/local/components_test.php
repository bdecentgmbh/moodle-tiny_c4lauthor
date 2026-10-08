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
 * Tests for the component declarations and their templates.
 *
 * @package    tiny_c4lauthor
 * @category   test
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \tiny_c4lauthor\local\components
 */
final class components_test extends \advanced_testcase {
    /**
     * Forget components other tests added through the hook.
     */
    protected function setUp(): void {
        parent::setUp();
        components::reset_caches();
    }

    /**
     * Render a template the way the editor does, with the ids fixed.
     *
     * @param string $template
     * @param array $context
     * @return string
     */
    private function render(string $template, array $context = []): string {
        global $PAGE;
        return trim($PAGE->get_renderer('core')->render_from_template($template, $context));
    }

    /**
     * Render a component with the given variants switched on.
     *
     * @param array $component
     * @param array $active names of the active variants
     * @return string
     */
    private function render_component(array $component, array $active): string {
        $variants = components::get_variants();
        $html = '';
        foreach ($active as $name) {
            if (!empty($variants[$name]['template'])) {
                $html .= $this->render($variants[$name]['template']);
            }
        }
        return $this->render($component['template'], [
            'placeholder' => '<span data-id="R1-1">' . $component['text'] . '</span>',
            'variantclasses' => implode(' ', array_map(fn($name) => 'c4l-' . $name . '-variant', $active)),
            'variantshtml' => $html,
            'uniqid' => 'R2-2',
        ]);
    }

    /**
     * Provide the names of the components.
     *
     * @return array
     */
    public static function component_provider(): array {
        $components = [];
        $variants = [];
        require(__DIR__ . '/../../db/components.php');
        $cases = [];
        foreach (array_keys($components) as $name) {
            $cases[$name] = [$name];
        }
        return $cases;
    }

    /**
     * Each component inserts exactly the markup it inserted before its markup moved into a template.
     *
     * The fixtures were produced by the insertion code of release 1.3.0-beta, once without variants
     * and once with all the component's variants switched on.
     *
     * @dataProvider component_provider
     * @param string $name
     */
    public function test_markup_is_unchanged(string $name): void {
        $component = components::get_components()[$name];
        $fixtures = __DIR__ . '/../fixtures/components/' . $name;

        $this->assertSame(file_get_contents($fixtures . '.html'), $this->render_component($component, []));
        if ($component['variants']) {
            $this->assertSame(
                file_get_contents($fixtures . '_variants.html'),
                $this->render_component($component, $component['variants'])
            );
        }
    }

    /**
     * The declarations are consistent: unique ids, known variants and strings, existing icons.
     */
    public function test_declarations_are_consistent(): void {
        $components = components::get_components();
        $variants = components::get_variants();
        $strings = get_string_manager();

        $ids = array_column($components, 'id');
        $this->assertSame(count($ids), count(array_unique($ids)), 'Component ids are unique');
        $this->assertSame(count($variants), count(array_unique(array_column($variants, 'id'))), 'Variant ids are unique');
        $positions = array_filter(array_column($components, 'convertible'));
        $this->assertSame(count($positions), count(array_unique($positions)), 'Convert menu positions are unique');

        foreach ($components as $name => $component) {
            $this->assertMatchesRegularExpression('/^[a-z0-9]+$/', $name);
            $this->assertContains($component['category'], ['contextual', 'procedural', 'evaluative', 'helper']);
            $this->assertIsBool($component['students'] ?? false);
            $this->assertTrue($strings->string_exists($name, 'tiny_c4lauthor'), "String $name exists");
            foreach ($component['variants'] as $variant) {
                $this->assertArrayHasKey($variant, $variants, "Variant $variant of $name is declared");
            }
            $docs = $component['docs'] ?? [];
            foreach (array_merge(array_filter([$docs['description'] ?? null]), $docs['usecases'] ?? []) as $key) {
                $this->assertTrue($strings->string_exists($key, 'tiny_c4lauthor'), "String $key exists");
            }
            foreach ($component['precision'] ?? [] as $field) {
                $this->assertTrue($strings->string_exists($field['label'], 'tiny_c4lauthor'), "String {$field['label']} exists");
            }
            if (!empty($component['menuicon'])) {
                $this->assertFileExists(__DIR__ . '/../../pix/' . $component['menuicon'] . '.svg');
            }
        }

        foreach ($variants as $name => $variant) {
            $this->assertTrue($strings->string_exists($name, 'tiny_c4lauthor'), "String $name exists");
            foreach ($variant['excludes'] ?? [] as $excluded) {
                $this->assertArrayHasKey($excluded, $variants);
            }
        }
    }

    /**
     * The editor gets the declarations with the strings they use.
     */
    public function test_export_for_editor(): void {
        $export = components::export_for_editor(\core\context\system::instance());

        $this->assertCount(count(components::get_components()), $export['components']);
        $this->assertCount(count(components::get_variants()), $export['variants']);

        $keyconcept = $export['components'][0];
        $this->assertSame('keyconcept', $keyconcept['name']);
        $this->assertSame('tiny_c4lauthor/components/keyconcept', $keyconcept['template']);
        $this->assertSame(['full-width'], $keyconcept['variants']);
        $this->assertTrue($keyconcept['precision'][0]['innerhtml']);
        $this->assertSame('tiny_c4lauthor', $keyconcept['component']);
        $this->assertSame(0, $keyconcept['id']);
        $this->assertSame('', $keyconcept['inserter']);

        $strings = array_column($export['strings'], 'value', 'key');
        $this->assertSame(get_string('keyconcept', 'tiny_c4lauthor'), $strings['keyconcept']);
        $this->assertSame(get_string('docs_keyconcept_use1', 'tiny_c4lauthor'), $strings['docs_keyconcept_use1']);
        $this->assertSame(get_string('full-width', 'tiny_c4lauthor'), $strings['full-width']);
        $this->assertSame(get_string('precision_field_year', 'tiny_c4lauthor'), $strings['precision_field_year']);
    }
}
