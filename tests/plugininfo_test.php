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

namespace tiny_c4lauthor;

use core_ai\manager;

/**
 * Tests for the editor plugin information.
 *
 * @package    tiny_c4lauthor
 * @category   test
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \tiny_c4lauthor\plugininfo
 */
final class plugininfo_test extends \advanced_testcase {
    /** @var \stdClass The course used by the tests. */
    private \stdClass $course;

    /** @var \context_course Its context. */
    private \context_course $context;

    /** @var \stdClass An editing teacher in the course. */
    private \stdClass $teacher;

    /**
     * Create a course with an editing teacher.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        $this->course = $this->getDataGenerator()->create_course();
        $this->context = \context_course::instance($this->course->id);
        $this->teacher = $this->getDataGenerator()->create_and_enrol($this->course, 'editingteacher');
        $this->setUser($this->teacher);
    }

    /**
     * Get the configuration the editor receives in the course.
     *
     * @return array
     */
    private function configuration(): array {
        return plugininfo::get_plugin_configuration_for_context($this->context, [], []);
    }

    public function test_enabled_for_teacher(): void {
        $this->assertTrue(plugininfo::is_enabled($this->context, [], []));
    }

    public function test_disabled_without_view_capability(): void {
        $role = $this->getDataGenerator()->create_role();
        assign_capability('tiny/c4lauthor:viewplugin', CAP_PROHIBIT, $role, $this->context->id);
        role_assign($role, $this->teacher->id, $this->context->id);

        $this->assertFalse(plugininfo::is_enabled($this->context, [], []));
    }

    public function test_disabled_without_use_capability(): void {
        $role = $this->getDataGenerator()->create_role();
        assign_capability('tiny/c4lauthor:use', CAP_PROHIBIT, $role, $this->context->id);
        role_assign($role, $this->teacher->id, $this->context->id);

        $this->assertFalse(plugininfo::is_enabled($this->context, [], []));
    }

    public function test_teacher_sees_all_components(): void {
        $config = $this->configuration();

        $this->assertFalse($config['isstudent']);
        $this->assertSame([], $config['allowedcomps']);
    }

    public function test_student_sees_components_listed_for_students(): void {
        $student = $this->getDataGenerator()->create_and_enrol($this->course, 'student');
        $this->setUser($student);

        $config = $this->configuration();

        $this->assertTrue($config['isstudent']);
        $this->assertContains('keyconcept', $config['allowedcomps']);
    }

    public function test_useallcomponents_decides_not_the_grader_report(): void {
        $student = $this->getDataGenerator()->create_and_enrol($this->course, 'student');
        $role = $this->getDataGenerator()->create_role();
        assign_capability('tiny/c4lauthor:useallcomponents', CAP_ALLOW, $role, $this->context->id);
        role_assign($role, $student->id, $this->context->id);
        $this->setUser($student);

        $this->assertFalse(has_capability('gradereport/grader:view', $this->context));
        $this->assertFalse($this->configuration()['isstudent']);
    }

    public function test_ai_off_by_default(): void {
        $this->assertSame('0', get_config('tiny_c4lauthor', 'ai_enabled'));
        $this->assertFalse($this->configuration()['aienabled']);
    }

    public function test_ai_enabled_for_teacher(): void {
        set_config('ai_enabled', 1, 'tiny_c4lauthor');

        $config = $this->configuration();

        $this->assertTrue($config['aienabled']);
        $this->assertFalse($config['aipolicyagreed']);
    }

    public function test_ai_reports_accepted_policy(): void {
        set_config('ai_enabled', 1, 'tiny_c4lauthor');
        manager::user_policy_accepted($this->teacher->id, $this->context->id);

        $this->assertTrue($this->configuration()['aipolicyagreed']);
    }

    public function test_ai_hidden_without_capability(): void {
        set_config('ai_enabled', 1, 'tiny_c4lauthor');
        $student = $this->getDataGenerator()->create_and_enrol($this->course, 'student');
        $this->setUser($student);

        $this->assertFalse($this->configuration()['aienabled']);
    }

    public function test_custom_component_code_is_cleaned(): void {
        set_config('customcompcount', 1, 'tiny_c4lauthor');
        set_config('customcompenable1', '1', 'tiny_c4lauthor');
        set_config('customcompname1', 'Box', 'tiny_c4lauthor');
        set_config(
            'customcompcode1',
            '<div class="{{CUSTOMCLASS}}" onclick="alert(1)">{{PLACEHOLDER}}<script>alert(2)</script></div>',
            'tiny_c4lauthor'
        );

        $components = $this->configuration()['customcomps'];

        $this->assertCount(1, $components);
        $code = $components[0]['code'];
        $this->assertStringContainsString('{{CUSTOMCLASS}}', $code);
        $this->assertStringContainsString('{{PLACEHOLDER}}', $code);
        $this->assertStringNotContainsString('<script', $code);
        $this->assertStringNotContainsString('onclick', $code);
    }
}
