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
 * The component icons in the editor menus.
 *
 * @module      tiny_c4lauthor/icons
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getButtonImage} from 'editor_tiny/utils';
import {component} from './common';

/**
 * Load component icon SVGs and register them as TinyMCE icons.
 *
 * @param {object} ed - TinyMCE editor instance.
 * @param {object} catalogue - The components the editor offers.
 * @returns {Promise}
 */
export const registerComponentIcons = async(ed, catalogue) => {
    const promises = [];
    catalogue.components.filter((comp) => comp.menuicon).forEach(({name, menuicon}) => {
        const iconName = 'c4l-' + name;
        // Skip if already registered.
        if (ed.ui.registry.getAll().icons[iconName]) {
            return;
        }
        const promise = getButtonImage(menuicon, component).then((result) => {
            if (result && result.html) {
                ed.ui.registry.addIcon(iconName, result.html);
            }
            return undefined;
        }).catch(() => {
            // Silently skip icons that fail to load.
        });
        promises.push(promise);
    });
    await Promise.all(promises);
};
