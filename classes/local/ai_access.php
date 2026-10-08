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
use core_ai\aiactions\generate_text;
use core_ai\manager;

/**
 * Who may use AI suggest where.
 *
 * Used both to decide whether the editor shows the AI suggest button and to guard the
 * web service, so that the two never disagree.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class ai_access {
    /**
     * Whether AI suggest is switched on in the plugin settings.
     *
     * @return bool
     */
    public static function is_enabled_on_site(): bool {
        return !empty(get_config('tiny_c4lauthor', 'ai_enabled'));
    }

    /**
     * Whether the current user may use AI suggest in the given context.
     *
     * Checks the plugin setting, the capability, and on Moodle versions that support it,
     * whether AI tools are enabled for the course or activity.
     *
     * @param context $context
     * @return bool
     */
    public static function can_use(context $context): bool {
        if (!self::is_enabled_on_site() || !has_capability('tiny/c4lauthor:aisuggest', $context)) {
            return false;
        }
        return self::is_enabled_in_context($context);
    }

    /**
     * Whether AI is enabled for the course or activity this context belongs to.
     *
     * Moodle 4.5 has no per-course AI setting, so there it is always true.
     *
     * @param context $context
     * @return bool
     */
    public static function is_enabled_in_context(context $context): bool {
        $manager = \core\di::get(manager::class);
        if (!method_exists($manager, 'is_action_enabled_in_context')) {
            return true;
        }
        return $manager->is_action_enabled_in_context($context, generate_text::class);
    }

    /**
     * Whether the user has accepted the site's AI policy.
     *
     * @param int $userid
     * @return bool
     */
    public static function policy_accepted(int $userid): bool {
        return manager::get_user_policy_status($userid);
    }
}
