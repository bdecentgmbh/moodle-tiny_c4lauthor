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
 * Standalone fallback: the styles and script that keep C4L content working without the plugin.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require(__DIR__ . '/../../../../../../config.php');
require_once($CFG->libdir . '/adminlib.php');

admin_externalpage_setup('tiny_c4lauthor_standalone');

$dist = __DIR__ . '/../dist';
$css = file_get_contents($dist . '/standalone.css');

// The script's strings, in the site's language, before the script itself.
$strings = [];
foreach (['carousel_next', 'carousel_previous', 'carousel_slide', 'tab'] as $key) {
    $strings[$key] = get_string_manager()->get_string($key, 'tiny_c4lauthor', null, $CFG->lang);
}
$js = 'var C4L_AUTHOR_STRINGS = ' . json_encode($strings, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) . ";\n"
    . file_get_contents($dist . '/standalone.js');

$download = optional_param('download', '', PARAM_ALPHA);
if ($download === 'css') {
    send_file($css, 'c4lauthor-standalone.css', 0, 0, true, true, 'text/css');
} else if ($download === 'js') {
    send_file($js, 'c4lauthor-standalone.js', 0, 0, true, true, 'application/javascript');
}

$snippet = function (string $name, string $content, string $wrapped): string {
    $url = new moodle_url('/lib/editor/tiny/plugins/c4lauthor/admin/standalone.php', ['download' => $name]);
    $link = html_writer::link($url, get_string('standalone_download', 'tiny_c4lauthor'), ['class' => 'btn btn-secondary']);
    return html_writer::tag('p', $link)
        . html_writer::tag('textarea', s($wrapped), [
            'readonly' => 'readonly',
            'rows' => 10,
            'class' => 'form-control mb-4 font-monospace small',
            'aria-label' => $name,
            'data-c4l-standalone' => $name,
        ]);
};

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('standalone_heading', 'tiny_c4lauthor'));
echo html_writer::tag('p', get_string('standalone_intro', 'tiny_c4lauthor'));

echo $OUTPUT->heading(get_string('standalone_css', 'tiny_c4lauthor', display_size(strlen($css))), 3);
echo html_writer::tag('p', get_string('standalone_css_desc', 'tiny_c4lauthor'));
echo $snippet('css', $css, $css);

echo $OUTPUT->heading(get_string('standalone_js', 'tiny_c4lauthor', display_size(strlen($js))), 3);
echo html_writer::tag('p', get_string('standalone_js_desc', 'tiny_c4lauthor'));
echo $snippet('js', $js, "<script>\n" . $js . "</script>\n");

echo $OUTPUT->footer();
