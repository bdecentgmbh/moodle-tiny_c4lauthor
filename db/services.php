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
 * Web services for the tiny_c4lauthor plugin.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 Roger Segú <rogersegu@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'tiny_c4lauthor_get_components' => [
        'classname'    => 'tiny_c4lauthor\external\get_components',
        'methodname'   => 'execute',
        'description'  => 'Return the components and variants C4L Author offers.',
        'type'         => 'read',
        'ajax'         => true,
        'capabilities' => 'tiny/c4lauthor:use, tiny/c4lauthor:viewplugin',
    ],
    'tiny_c4lauthor_suggest' => [
        'classname'    => 'tiny_c4lauthor\external\suggest',
        'methodname'   => 'execute',
        'description'  => 'Return C4L component suggestions for a fragment of editor content.',
        'type'         => 'write',
        'ajax'         => true,
        'capabilities' => 'tiny/c4lauthor:aisuggest',
    ],
];
