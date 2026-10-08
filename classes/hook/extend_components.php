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

namespace tiny_c4lauthor\hook;

use core\context;
use moodle_url;

/**
 * Lets other plugins add components and editor stylesheets to C4L Author.
 *
 * A component is declared like the ones in db/components.php, with these differences:
 *
 * - its template and its lang strings belong to the plugin that adds it;
 * - it has no id and cannot be converted to or from;
 * - its category may also be 'templates';
 * - menuicon is a pix path in the plugin that adds it, and is also shown in the sidebar;
 * - inserter names an AMD module of that plugin whose insert() returns the markup to
 *   insert, instead of the template (see README.md);
 * - students says whether students are offered it by default (an admin can change that).
 *
 * The stylesheets are added to the editor's content, where the theme's stylesheets for
 * the page do not apply. A plugin's styles.css already applies on the page.
 *
 * Page modules are AMD modules whose init() runs on every page, to add behaviour to
 * interactive components, the way tiny_c4lauthor/runtime does for tabs and carousels.
 * They should do nothing on pages without their components.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\core\attribute\label('Add components to C4L Author, stylesheets to the editor that shows them and scripts for their behaviour.')]
#[\core\attribute\tags('editor', 'tiny_c4lauthor')]
final class extend_components {
    /** @var array Components added, as [component, name, declaration]. */
    private array $components = [];

    /** @var moodle_url[] Stylesheets added. */
    private array $stylesheets = [];

    /** @var string[] AMD modules added for pages. */
    private array $pagemodules = [];

    /**
     * Create the hook.
     *
     * @param context $context Where the editor is used.
     */
    public function __construct(
        /** @var context Where the editor is used */
        public readonly context $context,
    ) {
    }

    /**
     * Add a component.
     *
     * @param string $component Frankenstyle name of the plugin adding it, which owns its template and strings.
     * @param string $name Unique name, used in its c4lv- class: lower case letters, digits and underscores.
     * @param array $declaration Declaration, see \tiny_c4lauthor\local\components and the class description.
     */
    public function add_component(string $component, string $name, array $declaration): void {
        $this->components[] = [$component, $name, $declaration];
    }

    /**
     * Add a stylesheet to the content of the editor.
     *
     * @param moodle_url $url
     */
    public function add_editor_stylesheet(moodle_url $url): void {
        $this->stylesheets[] = $url;
    }

    /**
     * Add an AMD module whose init() runs on every page, for the behaviour of components.
     *
     * @param string $module AMD module name, such as local_example/runtime
     */
    public function add_page_module(string $module): void {
        $this->pagemodules[] = $module;
    }

    /**
     * Get the components added, unchecked.
     *
     * @return array of [component, name, declaration]
     */
    public function get_components(): array {
        return $this->components;
    }

    /**
     * Get the stylesheets added.
     *
     * @return moodle_url[]
     */
    public function get_editor_stylesheets(): array {
        return $this->stylesheets;
    }

    /**
     * Get the page modules added.
     *
     * @return string[]
     */
    public function get_page_modules(): array {
        return $this->pagemodules;
    }
}
