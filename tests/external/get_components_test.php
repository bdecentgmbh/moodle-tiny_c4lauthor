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

namespace tiny_c4lauthor\external;

use core_external\external_api;

/**
 * Tests for the get_components web service.
 *
 * @package    tiny_c4lauthor
 * @category   test
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \tiny_c4lauthor\external\get_components
 */
final class get_components_test extends \advanced_testcase {
    /**
     * A teacher gets the components, shaped as the return description says.
     */
    public function test_execute(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $context = \context_course::instance($course->id);
        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'editingteacher'));

        $result = external_api::clean_returnvalue(
            get_components::execute_returns(),
            get_components::execute($context->id)
        );

        $names = array_column($result['components'], 'name');
        $this->assertContains('keyconcept', $names);
        $this->assertContains('timeline', $names);
        $timeline = $result['components'][array_search('timeline', $names)];
        $this->assertSame('timelineevents', $timeline['precision'][0]['handler']);
        $this->assertSame('year', $timeline['precision'][0]['subfields'][0]['key']);
        $this->assertContains('caption', array_column($result['variants'], 'name'));
    }

    /**
     * Users who cannot use the plugin get nothing.
     */
    public function test_execute_requires_capability(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $context = \context_course::instance($course->id);
        $teacher = $this->getDataGenerator()->create_and_enrol($course, 'editingteacher');
        $roleid = $this->getDataGenerator()->create_role();
        assign_capability('tiny/c4lauthor:use', CAP_PROHIBIT, $roleid, $context);
        role_assign($roleid, $teacher->id, $context);
        $this->setUser($teacher);

        $this->expectException(\required_capability_exception::class);
        get_components::execute($context->id);
    }
}
