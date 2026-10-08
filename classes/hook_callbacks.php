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

use core\hook\output\before_footer_html_generation;
use tiny_c4lauthor\local\components;

/**
 * Callbacks for the hooks of Moodle core.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class hook_callbacks {
    /**
     * Load the behaviour of interactive components on every page.
     *
     * Content with tabs, carousels or collapsibles can appear on any page, so the script
     * loads everywhere; it does nothing where there are none.
     *
     * @param before_footer_html_generation $hook
     */
    public static function before_footer_html_generation(before_footer_html_generation $hook): void {
        global $PAGE;

        if (during_initial_install() || !get_config('tiny_c4lauthor', 'version')) {
            return;
        }
        $PAGE->requires->js_call_amd('tiny_c4lauthor/runtime', 'init');
        foreach (components::get_page_modules($PAGE->context) as $module) {
            $PAGE->requires->js_call_amd($module, 'init');
        }
    }
}
