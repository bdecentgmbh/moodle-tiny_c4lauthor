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
 * The site's brand colour inside the editor iframes.
 *
 * On the page, --c4l-brand follows the theme's primary colour (see _tokens.scss).
 * The editor iframes load the theme's editor stylesheet, which is compiled without
 * the site's brand settings, so the colour the page resolved is handed in.
 *
 * @module      tiny_c4lauthor/brand
 * @copyright   2026 bdecent gmbh <https://bdecent.de>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Build the CSS rule that sets --c4l-brand to the colour the page resolved.
 *
 * @returns {string} the rule, or an empty string when the page has no usable value
 */
export const brandColourRule = () => {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--c4l-brand').trim();
    // Only colour values: the rule ends up inside a style element.
    if (!value || !/^[#a-z0-9(),.%\s-]+$/i.test(value)) {
        return '';
    }
    return ':root{--c4l-brand:' + value + ';}';
};
