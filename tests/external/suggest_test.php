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

use core_ai\aiactions\responses\response_generate_text;
use core_ai\manager;
use core_external\external_api;

/**
 * Tests for the AI suggest web service.
 *
 * @package    tiny_c4lauthor
 * @category   test
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \tiny_c4lauthor\external\suggest
 * @covers     \tiny_c4lauthor\local\ai_access
 */
final class suggest_test extends \advanced_testcase {
    /** @var \stdClass The course used by the tests. */
    private \stdClass $course;

    /** @var \context_course Its context. */
    private \context_course $context;

    /**
     * Create a course with AI suggest switched on and log in as an editing teacher.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        set_config('ai_enabled', 1, 'tiny_c4lauthor');
        $this->course = $this->getDataGenerator()->create_course();
        $this->context = \context_course::instance($this->course->id);
        $teacher = $this->getDataGenerator()->create_and_enrol($this->course, 'editingteacher');
        $this->setUser($teacher);
    }

    /**
     * Call the service the way the web service layer does.
     *
     * @param array $paragraphs
     * @return array
     */
    private function call(array $paragraphs): array {
        $result = suggest::execute($this->context->id, $paragraphs, 'en');
        return external_api::clean_returnvalue(suggest::execute_returns(), $result);
    }

    /**
     * Build a list of paragraphs.
     *
     * @param int $count
     * @param int $length characters per paragraph
     * @return array
     */
    private function paragraphs(int $count, int $length = 60): array {
        $items = [];
        for ($i = 0; $i < $count; $i++) {
            $items[] = ['index' => $i, 'text' => str_repeat('a', $length)];
        }
        return $items;
    }

    /**
     * Accept the AI policy for the current user.
     */
    private function accept_policy(): void {
        global $USER;
        manager::user_policy_accepted($USER->id, $this->context->id);
    }

    /**
     * Skip the test where the AI manager cannot be mocked.
     *
     * Moodle 4.5 declares the availability check as a static method, which cannot be
     * mocked, so tests with a fake AI provider only run on 5.0 and later.
     */
    private function require_mockable_ai(): void {
        if ((new \ReflectionMethod(manager::class, 'is_action_available'))->isStatic()) {
            $this->markTestSkipped('The AI manager cannot be mocked on this Moodle version.');
        }
    }

    /**
     * Replace the AI manager with a mock that answers with the given response.
     *
     * @param response_generate_text $response
     */
    private function mock_ai(response_generate_text $response): void {
        $manager = $this->createMock(manager::class);
        $manager->method('is_action_available')->willReturn(true);
        $manager->method('is_action_enabled_in_context')->willReturn(true);
        $manager->method('process_action')->willReturn($response);
        \core\di::set(manager::class, $manager);
    }

    public function test_requires_capability(): void {
        $student = $this->getDataGenerator()->create_and_enrol($this->course, 'student');
        $this->setUser($student);

        $this->expectException(\required_capability_exception::class);
        $this->call($this->paragraphs(3));
    }

    public function test_refused_when_switched_off(): void {
        set_config('ai_enabled', 0, 'tiny_c4lauthor');

        $this->expectException(\moodle_exception::class);
        $this->expectExceptionMessage(get_string('ai_disabled', 'tiny_c4lauthor'));
        $this->call($this->paragraphs(3));
    }

    public function test_requires_accepted_policy(): void {
        $result = $this->call($this->paragraphs(3));

        $this->assertSame([], $result['suggestions']);
        $this->assertSame([get_string('ai_policy_required', 'tiny_c4lauthor')], $result['warnings']);
    }

    public function test_respects_course_ai_setting(): void {
        global $DB;
        if (!$DB->get_manager()->field_exists('course', 'enableaitools')) {
            $this->markTestSkipped('This Moodle version has no per-course AI setting.');
        }
        $this->accept_policy();
        $DB->set_field('course', 'enableaitools', 0, ['id' => $this->course->id]);

        $result = $this->call($this->paragraphs(3));

        $this->assertSame([get_string('ai_disabled_here', 'tiny_c4lauthor')], $result['warnings']);
    }

    public function test_rejects_too_many_paragraphs(): void {
        $this->accept_policy();

        $result = $this->call($this->paragraphs(suggest::MAX_PARAGRAPHS + 1));

        $this->assertSame([get_string('ai_guard_too_long', 'tiny_c4lauthor')], $result['warnings']);
    }

    public function test_rejects_too_much_text(): void {
        $this->accept_policy();
        $count = (int) ceil(suggest::MAX_TOTAL_LENGTH / suggest::MAX_PARAGRAPH_LENGTH) + 1;

        $result = $this->call($this->paragraphs($count, suggest::MAX_PARAGRAPH_LENGTH * 2));

        $this->assertSame([get_string('ai_guard_too_long', 'tiny_c4lauthor')], $result['warnings']);
    }

    public function test_reports_missing_provider(): void {
        $this->accept_policy();

        $result = $this->call($this->paragraphs(3));

        $this->assertSame([get_string('ai_no_provider', 'tiny_c4lauthor')], $result['warnings']);
    }

    public function test_returns_suggestions(): void {
        $this->require_mockable_ai();
        $this->accept_policy();
        $response = new response_generate_text(success: true);
        $response->set_response_data([
            'generatedcontent' => '[{"component": "tip", "index": 1, "confidence": 0.9, "rationale": "A hint."}]',
        ]);
        $this->mock_ai($response);

        $result = $this->call($this->paragraphs(3));

        $this->assertSame([], $result['warnings']);
        $this->assertCount(1, $result['suggestions']);
        $this->assertSame('tip', $result['suggestions'][0]['component']);
        $this->assertSame(1, $result['suggestions'][0]['targetindex']);
    }

    public function test_hides_provider_errors(): void {
        $this->require_mockable_ai();
        $this->accept_policy();
        $this->mock_ai(new response_generate_text(
            success: false,
            errorcode: 500,
            error: 'Internal server error',
            errormessage: 'Secret provider detail',
        ));

        $result = $this->call($this->paragraphs(3));

        $this->assertSame([get_string('ai_error', 'tiny_c4lauthor')], $result['warnings']);
        $this->assertDebuggingCalled('AI suggest failed: Secret provider detail');
    }
}
