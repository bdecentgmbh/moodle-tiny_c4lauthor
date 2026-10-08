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
 * The HTML the components insert.
 *
 * @module      tiny_c4lauthor/component_html
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {get_strings as getStrings} from 'core/str';
import Templates from 'core/templates';
import {component} from './common';
import {getVariantsClass, getVariantsHtml} from './variantslib';

const compPrefix = 'c4lv-';

/**
 * Generate a random ID for inserted components.
 * @returns {string}
 */
const generateRandomID = () => {
    return 'R' + Math.floor(Math.random() * 100000) + '-' + Date.now();
};

/**
 * Replace the {{#key}} tags in a text with the strings, fetching those the registry does not have.
 *
 * @param {string} text
 * @param {Map} strings - Resolved strings, extended with the fetched ones.
 * @returns {Promise<string>}
 */
const resolveLangStrings = async(text, strings) => {
    const compRegex = /{{#([^}]*)}}/g;
    const missing = [...new Set([...text.matchAll(compRegex)].map((match) => match[1]))]
        .filter((key) => !strings.has(key));
    if (missing.length) {
        const values = await getStrings(missing.map((key) => ({key, component})));
        missing.forEach((key, index) => strings.set(key, values[index]));
    }
    return text.replace(compRegex, (match, key) => strings.get(key) ?? match);
};

/**
 * Turn the admin's custom components from the editor options into components the editor offers.
 *
 * @param {Array} customComponents
 * @returns {Array}
 */
export const buildCustomComponents = (customComponents) => customComponents.map((customcomp) => {
    const variants = customcomp.variants ? " {{VARIANTS}}" : "";
    const html = customcomp.code.replace(
        '{{CUSTOMCLASS}}',
        () => compPrefix + customcomp.name + ' ' + compPrefix + "custom-component" + variants
    );
    return {
        id: customcomp.id + 1000,
        name: customcomp.name,
        label: customcomp.buttonname,
        category: 'custom',
        iconclass: 'c4l-custom-icon',
        code: html,
        text: customcomp.text.length > 0 ? customcomp.text : '{{#textplaceholder}}',
        variants: customcomp.variants ? ["full-width"] : [],
        icon: customcomp.icon,
    };
});

/**
 * Render the HTML a component inserts.
 *
 * Declared components render their template; the admin's custom components replace the
 * placeholders in the HTML the admin wrote.
 *
 * @param {object} comp - The component.
 * @param {string} selectedText - Text currently selected in the editor (may be empty).
 * @param {object} catalogue - The components the editor offers.
 * @returns {Promise<string>} Ready-to-insert HTML.
 */
export const renderComponent = async(comp, selectedText, catalogue) => {
    const context = {id: generateRandomID()};
    if (selectedText) {
        // Text the author selected is always inserted as text.
        context.placeholdertext = selectedText;
    } else {
        // The component's default text comes from its definition and may contain markup.
        context.placeholderhtml = await resolveLangStrings(comp.text || '', catalogue.strings);
    }
    const {html: spanHtml} = await Templates.renderForPromise('tiny_c4lauthor/placeholder_span', context);
    const placeholder = spanHtml.trim();

    // Apply saved variant preferences.
    const variantClasses = getVariantsClass(comp.name).join(' ');
    const variantsHtml = variantClasses ? getVariantsHtml(comp.name, catalogue) : '';

    if (!comp.code) {
        const {html} = await Templates.renderForPromise(comp.template, {
            placeholder,
            variantclasses: variantClasses,
            variantshtml: variantsHtml,
            uniqid: generateRandomID(),
        });
        return html.trim();
    }

    let html = comp.code;
    html = html.replace('{{PLACEHOLDER}}', () => placeholder);
    html = html.replace('{{VARIANTS}}', () => variantClasses);
    html = html.replace('{{VARIANTSHTML}}', () => variantsHtml);
    html = html.replace(/\{\{@ID\}\}/g, generateRandomID());
    return resolveLangStrings(html, catalogue.strings);
};

/**
 * Get the HTML to insert for a component: from its inserter if it declares one, else its template.
 *
 * An inserter is an AMD module of the plugin that added the component. Its insert() gets the
 * editor, the component, the selected text and render(), which resolves with the component's
 * own markup. It resolves with the HTML to insert, or null to insert nothing.
 *
 * @param {object} comp - The component.
 * @param {string} selectedText - Text currently selected in the editor (may be empty).
 * @param {object} catalogue - The components the editor offers.
 * @param {object} editor - The editor to insert into.
 * @returns {Promise<string|null>} HTML to insert, or null for nothing.
 */
export const buildComponentHtml = async(comp, selectedText, catalogue, editor) => {
    const render = () => renderComponent(comp, selectedText, catalogue);
    if (!comp.inserter) {
        return render();
    }
    const inserter = await import(comp.inserter);
    return inserter.insert({editor, component: comp, selectedText, render});
};
