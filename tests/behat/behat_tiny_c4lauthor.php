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

// NOTE: no MOODLE_INTERNAL test here, this file may be required by behat before including /config.php.

require_once(__DIR__ . '/../../../../../../../lib/behat/behat_base.php');

/**
 * Behat steps for C4L Author.
 *
 * @package    tiny_c4lauthor
 * @category   test
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_tiny_c4lauthor extends behat_base {
    /**
     * Click a tabs or carousel control in the editor of the C4L Author modal, by its label.
     *
     * The controls can sit outside the visible part of the editor, where WebDriver cannot
     * click them, so this clicks them directly.
     *
     * @Given /^I click on the "(?P<label_string>(?:[^"]|\\")*)" control in the C4L Author editor$/
     * @param string $label
     */
    public function i_click_on_control_in_the_c4l_author_editor(string $label): void {
        $iframe = $this->find('css_element', '.tiny_c4lauthor iframe.tox-edit-area__iframe');
        $label = json_encode($label);
        $this->execute_js_on_node($iframe, "const control = Array.from({{ELEMENT}}.contentDocument"
            . ".querySelectorAll('[data-c4l-action]')).find((el) => el.textContent.trim() === {$label});"
            . "if (!control) { throw new Error('No control ' + {$label}); } control.click();");
        $this->getSession()->wait(self::get_timeout(), self::PAGE_READY_JS);
    }
}
