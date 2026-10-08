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

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/adminlib.php');

/**
 * Setting with the components offered to students, from one of the two groups.
 *
 * Components are aimed at students (offered by default) or not intended for them (not
 * offered by default), as their declarations say. A component the admin has not seen in
 * these settings yet, such as one a plugin just added, shows and counts with its default.
 * Saving the settings records which components the admin has seen.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class admin_setting_student_components extends \admin_setting_configmulticheckbox {
    /** @var bool Whether this setting lists the components aimed at students. */
    private bool $aimed;

    /**
     * Create the setting.
     *
     * @param string $name
     * @param string $visiblename
     * @param string $description
     * @param bool $aimed true for the components aimed at students, false for the others
     */
    public function __construct(string $name, string $visiblename, string $description, bool $aimed) {
        $this->aimed = $aimed;
        parent::__construct($name, $visiblename, $description, null, null);
    }

    /**
     * Load the components of this group as choices, all ticked by default for the aimed group.
     *
     * @return bool
     */
    public function load_choices() {
        if (is_array($this->choices)) {
            return true;
        }
        $this->choices = [];
        foreach (components::get_components() as $name => $component) {
            if (!empty($component['students']) === $this->aimed) {
                $this->choices[$name] = components::get_label($name, $component);
            }
        }
        $this->defaultsetting = $this->aimed ? array_fill_keys(array_keys($this->choices), 1) : [];
        return true;
    }

    /**
     * Get the default, loading the choices first.
     *
     * @return array
     */
    public function get_defaultsetting() {
        $this->load_choices();
        return parent::get_defaultsetting();
    }

    /**
     * Get the components chosen, with those aimed at students that the admin has not seen yet.
     *
     * @return array|null
     */
    public function get_setting() {
        $setting = parent::get_setting();
        if ($setting === null || !$this->aimed || !$this->load_choices()) {
            return $setting;
        }
        $known = explode(',', get_config('tiny_c4lauthor', 'studentcomponentsknown') ?: '');
        foreach (array_keys($this->choices) as $name) {
            if (!in_array($name, $known)) {
                $setting[$name] = 1;
            }
        }
        return $setting;
    }

    /**
     * Save the components chosen and remember all components as seen.
     *
     * @param array $data
     * @return string empty or error message
     */
    public function write_setting($data) {
        $result = parent::write_setting($data);
        if ($result === '') {
            set_config('studentcomponentsknown', implode(',', array_keys(components::get_components())), 'tiny_c4lauthor');
        }
        return $result;
    }
}
