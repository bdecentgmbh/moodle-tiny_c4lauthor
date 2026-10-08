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

/**
 * Post-install hook — set default config values.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 Roger Segú <rogersegu@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Post-install hook: set default AI Suggest configuration.
 */
function xmldb_tiny_c4lauthor_install() {
    // AI Suggest defaults.
    // AI suggest stays off until an administrator switches it on.
    set_config('ai_enabled', 0, 'tiny_c4lauthor');
    set_config('ai_comp_enabled_attention', 1, 'tiny_c4lauthor');
    set_config('ai_comp_enabled_tip', 1, 'tiny_c4lauthor');
    set_config('ai_comp_enabled_keyconcept', 1, 'tiny_c4lauthor');
    set_config('ai_comp_enabled_reminder', 1, 'tiny_c4lauthor');
    set_config('ai_maxrate_attention', 3, 'tiny_c4lauthor');
    set_config('ai_maxrate_tip', 3, 'tiny_c4lauthor');
    set_config('ai_maxrate_keyconcept', 3, 'tiny_c4lauthor');
    set_config('ai_maxrate_reminder', 2, 'tiny_c4lauthor');
    set_config('ai_min_suggestions', 12, 'tiny_c4lauthor');
}
