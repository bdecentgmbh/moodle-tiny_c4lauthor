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
 * Precision Mode field handlers, for fields a selector alone cannot read or write.
 *
 * A precision field in db/components.php names its handler; the handler's extract
 * function reads the field's value from the component element, its apply function
 * writes a value back.
 *
 * @module      tiny_c4lauthor/precise_handlers
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const setTextContent = (el, val) => {
    el.textContent = val;
};

/**
 * Extract only direct text nodes from an element (skip child elements).
 *
 * @param {HTMLElement} el
 * @returns {string}
 */
const extractDirectText = (el) => {
    if (!el) {
        return '';
    }
    let text = '';
    for (const child of el.childNodes) {
        if (child.nodeType === 3) {
            text += child.textContent;
        }
    }
    return text.trim();
};

/**
 * Replace direct text nodes in an element.
 *
 * @param {HTMLElement} el
 * @param {string} val
 */
const applyDirectText = (el, val) => {
    if (!el) {
        return;
    }
    const toRemove = [];
    for (const child of el.childNodes) {
        if (child.nodeType === 3) {
            toRemove.push(child);
        }
    }
    toRemove.forEach((n) => n.remove());
    el.appendChild(el.ownerDocument.createTextNode(val));
};

/**
 * Handlers by name, each with an extract and/or an apply function.
 */
const handlers = {
    // The component's whole text.
    textcontent: {
        extract: (comp) => comp.textContent,
        apply: setTextContent,
    },
    // The component's whole text, trimmed.
    trimmedtext: {
        extract: (comp) => comp.textContent.trim(),
        apply: setTextContent,
    },
    // The source in an embedded caption: its text outside the author's span.
    captiontext: {
        extract: (comp) => extractDirectText(comp.querySelector('.c4l-embedded-caption')),
        apply: (comp, val) => applyDirectText(comp.querySelector('.c4l-embedded-caption'), val),
    },
    // The events of a timeline, as rows of year and text. Extracting uses the subfields.
    timelineevents: {
        apply: (compEl, values) => {
            const doc = compEl.ownerDocument;
            const eventsContainer = compEl.querySelector('.c4l-timeline-events');
            if (!eventsContainer) {
                return;
            }
            const existing = [...compEl.querySelectorAll('.c4l-timeline-event')];
            values.forEach((row, i) => {
                let ev = existing[i];
                if (!ev) {
                    ev = doc.createElement('div');
                    ev.className = 'c4l-timeline-event';
                    const pill = doc.createElement('div');
                    pill.className = 'c4l-timeline-pill';
                    const marker = doc.createElement('div');
                    marker.className = 'c4l-timeline-marker';
                    marker.setAttribute('contenteditable', 'false');
                    const yearSpan = doc.createElement('span');
                    yearSpan.className = 'c4l-timeline-year';
                    pill.appendChild(marker);
                    pill.appendChild(yearSpan);
                    ev.appendChild(pill);
                    const textP = doc.createElement('p');
                    textP.className = 'c4l-timeline-text';
                    ev.appendChild(textP);
                    eventsContainer.appendChild(ev);
                }
                const yearEl = ev.querySelector('.c4l-timeline-year');
                if (yearEl) {
                    yearEl.textContent = row.year || '';
                }
                const textEl = ev.querySelector('.c4l-timeline-text');
                if (textEl) {
                    textEl.textContent = row.text || '';
                }
            });
            for (let i = values.length; i < existing.length; i++) {
                existing[i].remove();
            }
        },
    },
};

/**
 * Build the field registry from the component declarations.
 *
 * type: 'textarea' | 'input' | 'list' | 'image-src' | 'image-alt'
 * extract: custom function(compEl) => string (overrides default extraction)
 * apply: custom function(compEl, value) (overrides default apply)
 *
 * @param {Array} components declarations from the registry
 * @returns {Object} field descriptors by component name, for components with precision fields
 */
export const buildFieldRegistry = (components) => {
    const registry = {};
    components.forEach((comp) => {
        if (!comp.precision || !comp.precision.length) {
            return;
        }
        registry[comp.name] = comp.precision.map((field) => {
            const handler = handlers[field.handler] || {};
            return {
                selector: field.selector || null,
                label: field.label,
                type: field.type,
                innerHTML: field.innerhtml,
                fallback: field.fallback,
                optional: field.optional,
                subfields: field.subfields && field.subfields.length ? field.subfields : undefined,
                extract: handler.extract,
                apply: handler.apply,
            };
        });
    });
    return registry;
};
