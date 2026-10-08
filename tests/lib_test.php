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

/**
 * Tests for the library callbacks and the uninstall clean-up.
 *
 * @package    tiny_c4lauthor
 * @category   test
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class lib_test extends \advanced_testcase {
    /**
     * Load the plugin's library and uninstall files.
     */
    public static function setUpBeforeClass(): void {
        global $CFG;
        parent::setUpBeforeClass();
        require_once($CFG->dirroot . '/lib/editor/tiny/plugins/c4lauthor/lib.php');
        require_once($CFG->dirroot . '/lib/editor/tiny/plugins/c4lauthor/db/uninstall.php');
    }

    /**
     * Store a file in a system context file area of the plugin.
     *
     * @param string $filearea
     * @return \stored_file
     */
    private function store_file(string $filearea): \stored_file {
        return get_file_storage()->create_file_from_string([
            'contextid' => \context_system::instance()->id,
            'component' => 'tiny_c4lauthor',
            'filearea' => $filearea,
            'itemid' => 0,
            'filepath' => '/',
            'filename' => 'icon.svg',
        ], '<svg xmlns="http://www.w3.org/2000/svg"/>');
    }

    /**
     * Data provider for the file areas the plugin serves.
     *
     * @return array
     */
    public static function served_areas_provider(): array {
        return [
            'image bank' => ['customimagesbank'],
            'first icon' => ['customcompicon1'],
            'twelfth icon' => ['customcompicon12'],
        ];
    }

    /**
     * The plugin's own file areas are served.
     *
     * @covers ::tiny_c4lauthor_pluginfile
     * @dataProvider served_areas_provider
     * @param string $filearea
     */
    public function test_pluginfile_serves_own_areas(string $filearea): void {
        $this->resetAfterTest();
        $this->store_file($filearea);

        $file = tiny_c4lauthor_pluginfile(null, null, \context_system::instance(), $filearea, ['0', 'icon.svg'], false);

        $this->assertInstanceOf(\stored_file::class, $file);
    }

    /**
     * Data provider for file areas that only look like the plugin's own.
     *
     * @return array
     */
    public static function other_areas_provider(): array {
        return [
            'prefix' => ['xcustomcompicon1'],
            'suffix' => ['customcompicon1x'],
            'no number' => ['customcompicon'],
            'bank prefix' => ['mycustomimagesbank'],
        ];
    }

    /**
     * Other file areas are refused, even when their names contain the plugin's areas.
     *
     * @covers ::tiny_c4lauthor_pluginfile
     * @dataProvider other_areas_provider
     * @param string $filearea
     */
    public function test_pluginfile_refuses_other_areas(string $filearea): void {
        $this->resetAfterTest();
        $this->store_file($filearea);

        $this->assertFalse(
            tiny_c4lauthor_pluginfile(null, null, \context_system::instance(), $filearea, ['0', 'icon.svg'], false)
        );
    }

    /**
     * Uninstalling removes the plugin's user preference and nothing else.
     *
     * @covers ::xmldb_tiny_c4lauthor_uninstall
     */
    public function test_uninstall_removes_preferences(): void {
        global $DB;
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        set_user_preference('c4lauthor_components_variants', '{"tip":["full-width"]}', $user);
        set_user_preference('some_other_preference', '1', $user);

        xmldb_tiny_c4lauthor_uninstall();

        $this->assertFalse($DB->record_exists(
            'user_preferences',
            ['userid' => $user->id, 'name' => 'c4lauthor_components_variants']
        ));
        $this->assertTrue($DB->record_exists(
            'user_preferences',
            ['userid' => $user->id, 'name' => 'some_other_preference']
        ));
    }
}
