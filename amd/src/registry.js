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
 * The components and variants the editor offers.
 *
 * They are declared in db/components.php and fetched once per page and context.
 *
 * @module      tiny_c4lauthor/registry
 * @copyright   2026 bdecent gmbh <https://bdecent.de>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Ajax from 'core/ajax';
import Templates from 'core/templates';

const compPrefix = 'c4lv-';

/** @type {Map<number, Promise<Object>>} Registries already requested, by context id. */
const registries = new Map();

/**
 * Fetch the declarations and render the HTML the variants add.
 *
 * @param {number} contextid
 * @returns {Promise<{components: Array, variants: Array, strings: Map}>}
 */
const fetchRegistry = async(contextid) => {
    const response = await Ajax.call([{
        methodname: 'tiny_c4lauthor_get_components',
        args: {contextid},
    }])[0];
    const strings = new Map(response.strings.map(({key, value}) => [key, value]));
    const variants = await Promise.all(response.variants.map(async(variant) => {
        let html = '';
        if (variant.template) {
            html = (await Templates.renderForPromise(variant.template, {})).html.trim();
        }
        return {...variant, html};
    }));
    const components = response.components.map((comp) => ({
        ...comp,
        label: strings.get(comp.name) || comp.name,
    }));
    return {components, variants, strings};
};

/**
 * Get the components, variants and their strings for an editor's context.
 *
 * @param {number} contextid
 * @returns {Promise<{components: Array, variants: Array, strings: Map}>}
 */
export const loadRegistry = (contextid) => {
    if (!registries.has(contextid)) {
        registries.set(contextid, fetchRegistry(contextid).catch((error) => {
            registries.delete(contextid);
            throw error;
        }));
    }
    return registries.get(contextid);
};

/**
 * Combine the registry with the admin's custom components into what one editor offers.
 *
 * @param {Object} registry from loadRegistry()
 * @param {Array} customComponents from buildCustomComponents()
 * @returns {Object}
 */
export const createCatalogue = (registry, customComponents) => {
    const components = [...registry.components, ...customComponents];
    const wrapperClasses = new Map(
        components.filter((comp) => comp.wrapperclass).map((comp) => [comp.wrapperclass, comp.name])
    );

    return {
        components,
        variants: registry.variants,
        strings: registry.strings,

        /**
         * Find a component by name.
         *
         * @param {string} name
         * @returns {Object|undefined}
         */
        find: (name) => components.find((comp) => comp.name === name),

        /**
         * Find a variant by name.
         *
         * @param {string} name
         * @returns {Object|undefined}
         */
        findVariant: (name) => registry.variants.find((variant) => variant.name === name),

        /**
         * Get the name of the component an element is the wrapper of, from its c4lv- class
         * or the wrapper class of a component that declares one.
         *
         * @param {HTMLElement} el
         * @returns {string|null}
         */
        nameOf: (el) => {
            if (!el || !el.classList) {
                return null;
            }
            for (const cls of el.classList) {
                if (cls.startsWith(compPrefix)) {
                    return cls.substring(compPrefix.length);
                }
            }
            for (const cls of el.classList) {
                if (wrapperClasses.has(cls)) {
                    return wrapperClasses.get(cls);
                }
            }
            return null;
        },

        /** @type {Array<string>} Names of the components in the "Convert to" menu, in menu order. */
        convertible: components
            .filter((comp) => comp.convertible)
            .sort((a, b) => a.convertible - b.convertible)
            .map((comp) => comp.name),

        /** @type {string} Selector matching the wrapper of any component. */
        wrapperSelector: [`[class*="${compPrefix}"]`, ...Array.from(wrapperClasses.keys()).map((cls) => '.' + cls)]
            .join(', '),
    };
};
