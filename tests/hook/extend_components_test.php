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

namespace tiny_c4lauthor\hook;

use tiny_c4lauthor\local\admin_setting_student_components;
use tiny_c4lauthor\local\components;

/**
 * Tests for components other plugins add through the extend_components hook.
 *
 * The tests add components as if from C4L Author itself, which has templates and strings
 * to point at; other plugins do the same with their own.
 *
 * @package    tiny_c4lauthor
 * @category   test
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \tiny_c4lauthor\hook\extend_components
 * @covers     \tiny_c4lauthor\local\components
 * @covers     \tiny_c4lauthor\local\admin_setting_student_components
 * @covers     \tiny_c4lauthor\hook_callbacks
 */
final class extend_components_test extends \advanced_testcase {
    /**
     * Start every test with nothing added.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        components::reset_caches();
    }

    /**
     * A valid component declaration, as another plugin would add it.
     *
     * @param array $changes keys to change
     * @return array
     */
    private static function declaration(array $changes = []): array {
        return $changes + [
            'label' => 'tip',
            'category' => 'templates',
            'template' => 'tiny_c4lauthor/components/tip',
            'menuicon' => 'c4l_panellist_icon',
            'text' => 'Box text',
            'docs' => ['description' => 'docs_tip_desc', 'usecases' => ['docs_tip_use1']],
            'variants' => ['full-width', 'nosuchvariant'],
            'precision' => [
                ['selector' => 'span[data-id]', 'label' => 'precision_field_text', 'type' => 'textarea'],
            ],
            'inserter' => 'tiny_c4lauthor/testinserter',
            'students' => true,
        ];
    }

    /**
     * Make the hook add these components and stylesheets.
     *
     * @param array $components [component, name, declaration] each
     * @param array $stylesheets URLs
     */
    private function add(array $components, array $stylesheets = []): void {
        $this->redirectHook(extend_components::class, function (extend_components $hook) use ($components, $stylesheets) {
            foreach ($components as [$component, $name, $declaration]) {
                $hook->add_component($component, $name, $declaration);
            }
            foreach ($stylesheets as $url) {
                $hook->add_editor_stylesheet(new \moodle_url($url));
            }
        });
    }

    /**
     * An added component joins the declared ones, with its strings and icon from its plugin.
     */
    public function test_added_component_is_offered(): void {
        $this->add([['tiny_c4lauthor', 'testbox', self::declaration()]]);
        $context = \core\context\system::instance();

        $components = components::get_components($context);
        $this->assertArrayHasKey('keyconcept', $components);
        $this->assertArrayHasKey('testbox', $components);
        $this->assertSame(['full-width'], $components['testbox']['variants']);
        $this->assertDebuggingNotCalled();

        $export = components::export_for_editor($context);
        $box = array_values(array_filter($export['components'], fn($c) => $c['name'] === 'testbox'))[0];
        $this->assertArrayNotHasKey('id', $box);
        $this->assertSame('tiny_c4lauthor', $box['component']);
        $this->assertSame('templates', $box['category']);
        $this->assertSame(0, $box['convertible']);
        $this->assertSame('tiny_c4lauthor/testinserter', $box['inserter']);
        $this->assertStringContainsString('c4l_panellist_icon', $box['icon']);
        $this->assertSame('tiny_c4lauthor/docs_tip_desc', $box['docs']['description']);
        $this->assertSame('tiny_c4lauthor/precision_field_text', $box['precision'][0]['label']);

        $strings = array_column($export['strings'], 'value', 'key');
        $this->assertSame(get_string('tip', 'tiny_c4lauthor'), $strings['testbox']);
        $this->assertSame(get_string('docs_tip_desc', 'tiny_c4lauthor'), $strings['tiny_c4lauthor/docs_tip_desc']);
        $this->assertSame(get_string('docs_tip_use1', 'tiny_c4lauthor'), $strings['tiny_c4lauthor/docs_tip_use1']);

        // The web service returns it as declared.
        $this->setAdminUser();
        $result = \core_external\external_api::clean_returnvalue(
            \tiny_c4lauthor\external\get_components::execute_returns(),
            \tiny_c4lauthor\external\get_components::execute($context->id)
        );
        $this->assertContains('testbox', array_column($result['components'], 'name'));
    }

    /**
     * Provide declarations that cannot be used.
     *
     * @return array
     */
    public static function invalid_provider(): array {
        return [
            'unknown plugin' => ['local_nosuchplugin', 'testbox', ['template' => 'local_nosuchplugin/box']],
            'name of a component' => ['tiny_c4lauthor', 'tip', []],
            'name of a C4L Author string' => ['tiny_c4lauthor', 'caption', []],
            'name of a custom component' => ['tiny_c4lauthor', 'customcomp1', []],
            'invalid name' => ['tiny_c4lauthor', 'Test-Box', []],
            'unknown category' => ['tiny_c4lauthor', 'testbox', ['category' => 'custom']],
            'template of another plugin' => ['tiny_c4lauthor', 'testbox', ['template' => 'core/notification']],
            'inserter of another plugin' => ['tiny_c4lauthor', 'testbox', ['inserter' => 'core/modal']],
        ];
    }

    /**
     * A declaration that cannot be used is left out, with a debugging message.
     *
     * @dataProvider invalid_provider
     * @param string $component
     * @param string $name
     * @param array $changes
     */
    public function test_invalid_component_is_ignored(string $component, string $name, array $changes): void {
        $this->add([[$component, $name, self::declaration($changes)]]);

        $components = components::get_components();
        $this->assertDebuggingCalled();
        $this->assertSame(['tiny_c4lauthor'], array_unique(array_column($components, 'component')));
        $this->assertArrayHasKey('tip', $components);
    }

    /**
     * Two plugins cannot add a component with the same name: the first one wins.
     */
    public function test_name_added_twice(): void {
        $this->add([
            ['tiny_c4lauthor', 'testbox', self::declaration()],
            ['tiny_c4lauthor', 'testbox', self::declaration(['category' => 'helper'])],
        ]);

        $components = components::get_components();
        $this->assertDebuggingCalled();
        $this->assertSame('templates', $components['testbox']['category']);
    }

    /**
     * A failing callback leaves the editor with its own components.
     */
    public function test_failing_callback(): void {
        $this->redirectHook(extend_components::class, function () {
            throw new \coding_exception('broken');
        });

        $components = components::get_components();
        $this->assertDebuggingCalled();
        $this->assertArrayNotHasKey('testbox', $components);
        $this->assertArrayHasKey('keyconcept', $components);
    }

    /**
     * The editor gets the stylesheets added, in its configuration.
     */
    public function test_editor_stylesheets(): void {
        $this->add([], ['/lib/editor/tiny/plugins/c4lauthor/editor_styles.css']);
        $course = $this->getDataGenerator()->create_course();
        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'editingteacher'));

        $configuration = \tiny_c4lauthor\plugininfo::get_plugin_configuration_for_context(
            \context_course::instance($course->id),
            [],
            []
        );
        $this->assertCount(1, $configuration['editorcss']);
        $this->assertStringEndsWith('/lib/editor/tiny/plugins/c4lauthor/editor_styles.css', $configuration['editorcss'][0]);
    }

    /**
     * Every page loads the behaviour of interactive components, and the modules other plugins add.
     */
    public function test_page_modules(): void {
        global $PAGE;
        $this->redirectHook(extend_components::class, function (extend_components $hook) {
            $hook->add_page_module('tiny_c4lauthor/testruntime');
            $hook->add_page_module('not a module');
        });
        $PAGE->set_url('/');
        $PAGE->set_context(\core\context\system::instance());

        \tiny_c4lauthor\hook_callbacks::before_footer_html_generation(
            new \core\hook\output\before_footer_html_generation($PAGE->get_renderer('core'))
        );

        $code = $PAGE->requires->get_end_code();
        $this->assertStringContainsString('tiny_c4lauthor/runtime', $code);
        $this->assertStringContainsString('tiny_c4lauthor/testruntime', $code);
        $this->assertStringNotContainsString('not a module', $code);
    }

    /**
     * Students get the components chosen in the settings, and new ones with their default.
     */
    public function test_student_components(): void {
        $this->add([
            ['tiny_c4lauthor', 'forstudents', self::declaration()],
            ['tiny_c4lauthor', 'forteachers', self::declaration(['students' => false])],
        ]);
        $context = \core\context\system::instance();
        set_config('aimedatstudents', 'keyconcept,tip', 'tiny_c4lauthor');
        set_config('notintendedforstudents', 'duedate', 'tiny_c4lauthor');
        set_config('studentcomponentsknown', 'keyconcept,tip,reminder,duedate', 'tiny_c4lauthor');

        $names = components::get_student_components($context);
        sort($names);
        // Quote is aimed at students and new to the settings; reminder was unticked.
        $this->assertContains('quote', $names);
        $this->assertNotContains('reminder', $names);
        $this->assertContains('forstudents', $names);
        $this->assertNotContains('forteachers', $names);
        $this->assertContains('duedate', $names);
        $this->assertNotContains('timeline', $names);

        // Once the admin has seen and saved the settings, only their choice counts.
        $setting = new admin_setting_student_components('tiny_c4lauthor/aimedatstudents', '', '', true);
        $shown = $setting->get_setting();
        $this->assertArrayHasKey('forstudents', $shown);
        $this->assertArrayNotHasKey('reminder', $shown);
        $this->assertArrayNotHasKey('forteachers', $shown);
        unset($shown['forstudents']);
        $this->assertSame('', $setting->write_setting($shown));
        $this->assertNotContains('forstudents', components::get_student_components($context));
        $this->assertContains('quote', components::get_student_components($context));

        $other = new admin_setting_student_components('tiny_c4lauthor/notintendedforstudents', '', '', false);
        $other->load_choices();
        $this->assertArrayHasKey('forteachers', $other->choices);
        $this->assertArrayHasKey('timeline', $other->choices);
        $this->assertSame([], $other->get_defaultsetting());
    }
}
