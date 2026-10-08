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
 * Tiny c4lauthor library functions.
 *
 * @package   tiny_c4lauthor
 * @copyright 2023 Marc Català <reskit@gmail.com>
 * @copyright 2026 Roger Segú
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Return a list of all the user preferences used by tiny_c4lauthor.
 *
 * @return array
 */
function tiny_c4lauthor_user_preferences() {
    $preferences = [];

    $preferences['c4lauthor_components_variants'] = [
        'type' => PARAM_RAW,
        'null' => NULL_NOT_ALLOWED,
        'default' => '',
    ];

    return $preferences;
}

/**
 * Serves the tiny_c4lauthor files.
 *
 * @param stdClass $course course object
 * @param stdClass $cm course module object
 * @param stdClass $context context object
 * @param string $filearea file area
 * @param array $args extra arguments
 * @param bool $forcedownload whether or not force download
 * @param array $options additional options affecting the file serving
 * @return bool false if file not found, does not return if found - just send the file
 */
function tiny_c4lauthor_pluginfile(
    $course,
    $cm,
    $context,
    $filearea,
    $args,
    $forcedownload,
    array $options = []
) {
    // These are the administrator's custom component icons and images. They are shown
    // inside content to everyone who can see that content, like theme images, so they are
    // served without a login check. Only the plugin's own file areas are served.
    $allowedarea = $filearea === 'customimagesbank' || preg_match('/^customcompicon\d+$/', $filearea);

    if ($context->contextlevel == CONTEXT_SYSTEM && $allowedarea) {
        $fs = get_file_storage();
        $relativepath = implode('/', $args);
        $fullpath = "/$context->id/tiny_c4lauthor/$filearea/$relativepath";
        $file = $fs->get_file_by_hash(sha1($fullpath));

        if (!$file || $file->is_directory()) {
            return false;
        }

        if (PHPUNIT_TEST) {
            return $file;
        }
        send_stored_file($file, null, 0, $forcedownload, $options);
    }

    // Anything else is not ours to serve; core answers with "not found".
    return false;
}
