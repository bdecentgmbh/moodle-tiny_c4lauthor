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
 * The "Convert to" menu, which turns a component into another one.
 *
 * @module      tiny_c4lauthor/convert
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {convertMenuName} from './common';
import {showCustomDropdown} from './dropdown';

const compPrefix = 'c4lv-';

/**
 * Find the nearest c4lv-* ancestor element from the current selection
 * and return both the element and its component name, but only if
 * the component is in the convertible list.
 *
 * @param {object} ed - TinyMCE editor instance.
 * @param {object} catalogue - The components the editor offers.
 * @returns {{el: HTMLElement, name: string}|null}
 */
const getComponentFromSelection = (ed, catalogue) => {
    let node = ed.selection.getNode();
    while (node && node !== ed.getBody()) {
        if (node.nodeType === 1 && node.className) {
            const name = catalogue.nameOf(node);
            if (name) {
                const convertible = catalogue.convertible.indexOf(name) !== -1;
                return {el: node, name, convertible};
            }
        }
        node = node.parentNode;
    }
    return null;
};

/**
 * Convert a c4lv-* element from one component type to another.
 * Swaps the class and aria-label, removes incompatible variant classes.
 *
 * @param {HTMLElement} el - The component wrapper element.
 * @param {string} oldName - Current component name.
 * @param {string} newName - Target component name.
 * @param {object} catalogue - The components the editor offers.
 */
const convertComponent = (el, oldName, newName, catalogue) => {
    // Swap the main c4lv- class.
    el.classList.remove(compPrefix + oldName);
    el.classList.add(compPrefix + newName);

    // Update aria-label.
    const newComp = catalogue.find(newName);
    el.setAttribute('aria-label', newComp ? newComp.label : newName);

    // Find which variants the new component supports.
    const supportedVariants = newComp ? newComp.variants : [];

    // Remove variant classes that the new component doesn't support.
    const toRemove = [];
    el.classList.forEach((cls) => {
        if (cls.startsWith('c4l-') && cls.endsWith('-variant')) {
            // Strip 'c4l-' and '-variant'.
            const varName = cls.slice(4, -8);
            if (supportedVariants.indexOf(varName) === -1) {
                toRemove.push(cls);
            }
        }
    });
    toRemove.forEach((cls) => el.classList.remove(cls));
};

const convertIconSvg = '<svg width="24" height="24" viewBox="-4 -3.5 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M15.5 9.23V10.47C15.5 12.54 13.82 14.22 11.75 14.22H0.75C0.34 14.22 0 13.88 0 '
    + '13.47C0 13.05 0.34 12.72 0.75 12.72H11.75C12.99 12.72 14 11.71 14 10.47V9.23C14 8.82 14.34 '
    + '8.48 14.75 8.48C15.16 8.48 15.5 8.82 15.5 9.23Z" fill="currentColor"/>'
    + '<path d="M3.76 11.51L1.81 13.47L3.76 15.42C4.06 15.72 4.06 16.19 3.76 16.48C3.47 16.78 3 '
    + '16.78 2.7 16.48L0.22 14C-0.07 13.71-0.07 13.23 0.22 12.94L2.7 10.45C3 10.16 3.47 10.16 3.76 '
    + '10.45C4.06 10.75 4.06 11.22 3.76 11.51Z" fill="currentColor"/>'
    + '<path d="M0 7.23V6.23C0 4.16 1.68 2.48 3.75 2.48H14.75C15.16 2.48 15.5 2.82 15.5 '
    + '3.23C15.5 3.65 15.16 3.98 14.75 3.98H3.75C2.51 3.98 1.5 4.99 1.5 6.23V7.23C1.5 7.65 1.16 '
    + '7.98 0.75 7.98C0.34 7.98 0 7.65 0 7.23Z" fill="currentColor"/>'
    + '<path d="M11.74 5.19L13.69 3.23L11.74 1.28C11.44 0.99 11.44 0.51 11.74 0.22C12.03-0.07 '
    + '12.5-0.07 12.8 0.22L15.28 2.7C15.57 3 15.57 3.47 15.28 3.76L12.8 6.25C12.5 6.54 12.03 6.54 '
    + '11.74 6.25C11.44 5.96 11.44 5.48 11.74 5.19Z" fill="currentColor"/>'
    + '</svg>';

/**
 * Register the "Convert to" menu button on a TinyMCE editor instance.
 *
 * @param {object} ed - TinyMCE editor instance.
 * @param {object} catalogue - The components the editor offers.
 * @param {string} convertTooltip - Tooltip text for the button.
 * @param {string} noComponentStr - Shown when the selection is not in a component.
 * @param {string} notConvertibleStr - Shown when the component cannot be converted.
 */
export const registerConvertMenu = (ed, catalogue, convertTooltip, noComponentStr, notConvertibleStr) => {
    ed.ui.registry.addIcon('c4l-convert', convertIconSvg);
    ed.ui.registry.addButton(convertMenuName, {
        icon: 'c4l-convert',
        tooltip: convertTooltip,
        onAction: () => {
            // Save selection before showing the dropdown.
            const bookmark = ed.selection.getBookmark(2, true);
            const found = getComponentFromSelection(ed, catalogue);
            if (!found) {
                showCustomDropdown(ed, convertTooltip, [
                    {label: noComponentStr, enabled: false, onAction: () => {
                        return;
                    }},
                ]);
                return;
            }
            if (!found.convertible) {
                showCustomDropdown(ed, convertTooltip, [
                    {label: notConvertibleStr, enabled: false, onAction: () => {
                        return;
                    }},
                ]);
                return;
            }
            const items = [];
            const allIcons = ed.ui.registry.getAll().icons;
            catalogue.convertible.forEach((targetName) => {
                if (targetName === found.name) {
                    return;
                }
                const label = catalogue.strings.get(targetName) || targetName;
                const iconKey = 'c4l-' + targetName;
                items.push({
                    label,
                    iconHtml: allIcons[iconKey] || '',
                    onAction: () => {
                        ed.selection.moveToBookmark(bookmark);
                        ed.undoManager.transact(() => {
                            convertComponent(found.el, found.name, targetName, catalogue);
                        });
                        ed.nodeChanged();
                    },
                });
            });
            showCustomDropdown(ed, convertTooltip, items);
        },
    });
};
