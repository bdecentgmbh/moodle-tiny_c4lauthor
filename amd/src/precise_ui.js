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
 * Precision Mode — form-based editing of individual C4L component fields.
 *
 * @module      tiny_c4lauthor/precise_ui
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {get_string as getString} from 'core/str';
import {component} from './common';
import {brandColourRule} from './brand';
import {buildFieldRegistry} from './precise_handlers';
import Pending from 'core/pending';
import Templates from 'core/templates';

/** @type {Object} Field descriptors by component name, built from the declarations on mount. */
let fieldRegistry = {};

// ── Component identification ──

/**
 * Identify a C4L component name from an element's classes.
 *
 * @param {HTMLElement} el
 * @returns {string|null}
 */
const identifyComponent = (el) => {
    if (!el || !el.classList) {
        return null;
    }
    for (const cls of el.classList) {
        if (cls.startsWith('c4lv-')) {
            return cls.substring(5);
        }
    }
    // Fallback for components that use the legacy `c4l-` wrapper prefix
    // (e.g. statement, assessment). Only match when the name corresponds to
    // an entry in fieldRegistry so we don't pick up utility classes.
    for (const cls of el.classList) {
        if (cls.startsWith('c4l-')) {
            const name = cls.substring(4);
            if (fieldRegistry[name]) {
                return name;
            }
        }
    }
    return null;
};

/**
 * Walk up from a click target to find the nearest C4L component wrapper.
 *
 * @param {HTMLElement} target
 * @param {Document} doc
 * @returns {HTMLElement|null}
 */
const findComponentEl = (target, doc) => {
    let el = target;
    while (el && el !== doc.body) {
        if (el.nodeType === 1 && el.className && identifyComponent(el)) {
            return el;
        }
        el = el.parentNode;
    }
    return null;
};

// ── Field extraction ──

/**
 * Get value for a standard (selector-based) field.
 *
 * @param {HTMLElement} el — the matched element
 * @param {Object} desc — field descriptor
 * @returns {string}
 */
const getStandardValue = (el, desc) => {
    if (desc.type === 'image-src') {
        return el.getAttribute('src') || '';
    }
    if (desc.type === 'image-alt') {
        return el.getAttribute('alt') || '';
    }
    return desc.innerHTML ? el.innerHTML.trim() : el.textContent.trim();
};

/**
 * Extract current field values from a component element.
 *
 * @param {HTMLElement} compEl
 * @param {string} compName
 * @returns {Array<{descriptor: Object, value: string, values?: Array, elements: NodeList|Array}>}
 */
const extractFields = (compEl, compName) => {
    const registry = fieldRegistry[compName];
    if (!registry) {
        return [];
    }
    const fields = [];
    for (const desc of registry) {
        const extracted = extractSingleField(compEl, desc);
        if (extracted) {
            fields.push(extracted);
        }
    }
    return fields;
};

/**
 * Extract a single field from a component.
 *
 * @param {HTMLElement} compEl
 * @param {Object} desc
 * @returns {Object|null}
 */
const extractSingleField = (compEl, desc) => {
    // List fields.
    if (desc.type === 'list') {
        return extractListField(compEl, desc);
    }
    // Custom extraction.
    if (desc.extract) {
        // Honour `optional` when a selector is provided: if the underlying
        // element isn't present, skip the field instead of rendering an
        // empty input.
        if (desc.optional && desc.selector && !compEl.querySelector(desc.selector)) {
            return null;
        }
        return {descriptor: desc, value: desc.extract(compEl), elements: [compEl]};
    }
    // Fallback: try selector, fall back to component root.
    if (desc.fallback) {
        const el = (desc.selector && compEl.querySelector(desc.selector)) || compEl;
        // Always use textContent for display — innerHTML would show raw tags.
        const value = el.textContent.trim();
        return {descriptor: desc, value, elements: [el]};
    }
    // Standard selector-based.
    if (!desc.selector) {
        return null;
    }
    const el = compEl.querySelector(desc.selector);
    if (!el) {
        return desc.optional ? null : null;
    }
    return {descriptor: desc, value: getStandardValue(el, desc), elements: [el]};
};

/**
 * Extract a list-type field.
 *
 * @param {HTMLElement} compEl
 * @param {Object} desc
 * @returns {Object|null}
 */
const extractListField = (compEl, desc) => {
    const items = compEl.querySelectorAll(desc.selector);
    if (items.length === 0) {
        return null;
    }
    const values = [];
    if (desc.subfields) {
        items.forEach((item) => {
            const row = {};
            desc.subfields.forEach((sf) => {
                const el = item.querySelector(sf.selector);
                row[sf.key] = el ? el.textContent.trim() : '';
            });
            values.push(row);
        });
    } else {
        items.forEach((li) => values.push(li.textContent.trim()));
    }
    return {descriptor: desc, values, elements: items, listParent: items[0].parentNode};
};

// ── Form building ──

/**
 * Populate form field values via DOM after the form HTML has been inserted.
 * This avoids HTML escaping issues with textarea/input values.
 *
 * @param {HTMLElement} panel — the form panel container
 * @param {Array} fields — extracted fields from extractFields()
 */
const populateFormValues = (panel, fields) => {
    fields.forEach((field, fIdx) => {
        const desc = field.descriptor;
        if (desc.type === 'list') {
            if (desc.subfields) {
                field.values.forEach((row, i) => {
                    desc.subfields.forEach((sf, sIdx) => {
                        const input = panel.querySelector(
                            '[data-field="' + fIdx + '"][data-item="' + i +
                            '"][data-sub="' + sIdx + '"]'
                        );
                        if (input) {
                            input.value = row[sf.key] || '';
                        }
                    });
                });
            } else {
                const textareas = panel.querySelectorAll(
                    'textarea[data-field="' + fIdx + '"]'
                );
                field.values.forEach((val, i) => {
                    if (textareas[i]) {
                        textareas[i].value = val;
                    }
                });
            }
        } else {
            const input = panel.querySelector('[data-field="' + fIdx + '"]');
            if (input) {
                input.value = field.value;
            }
        }
    });
};

/**
 * Auto-resize a textarea to fit its content.
 *
 * @param {HTMLTextAreaElement} ta
 */
const autoResize = (ta) => {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
};

/**
 * Auto-resize all textareas in a container and wire input listeners.
 *
 * @param {HTMLElement} panel
 */
const autoResizeAll = (panel) => {
    panel.querySelectorAll('.tiny_c4lauthor__precision-textarea').forEach((ta) => {
        autoResize(ta);
        ta.addEventListener('input', () => autoResize(ta));
    });
};

/**
 * Escape for HTML attributes.
 *
 * @param {string} str
 * @returns {string}
 */
const escapeAttr = (str) => {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

/**
 * Build form HTML for a set of extracted fields.
 *
 * @param {Array} fields
 * @param {Map} strings — resolved lang strings
 * @returns {string}
 */
const buildFormHtml = (fields, strings) => {
    let html = '<div class="tiny_c4lauthor__precision-fields">';
    fields.forEach((field, fIdx) => {
        html += buildFieldHtml(field, fIdx, strings);
    });
    html += '</div>';
    return html;
};

/**
 * Build HTML for a single field.
 *
 * @param {Object} field
 * @param {number} fIdx
 * @param {Map} strings
 * @returns {string}
 */
const buildFieldHtml = (field, fIdx, strings) => {
    const label = strings.get(field.descriptor.label) || field.descriptor.label;
    let html = '<div class="tiny_c4lauthor__precision-field-group" data-field-idx="' + fIdx + '">';
    html += '<label class="tiny_c4lauthor__precision-label">' + label + '</label>';

    if (field.descriptor.type === 'list') {
        html += buildListFieldHtml(field, fIdx, strings);
    } else if (field.descriptor.type === 'textarea') {
        // Value is set via DOM after insertion to avoid HTML escaping issues.
        html += '<textarea class="tiny_c4lauthor__precision-input' +
            ' tiny_c4lauthor__precision-textarea"' +
            ' data-field="' + fIdx + '"></textarea>';
    } else {
        html += '<input type="text" class="tiny_c4lauthor__precision-input"' +
            ' data-field="' + fIdx + '" value="">';
    }
    html += '</div>';
    return html;
};

/**
 * Build list field items HTML.
 *
 * @param {Object} field
 * @param {number} fIdx
 * @param {Map} strings
 * @returns {string}
 */
const buildListFieldHtml = (field, fIdx, strings) => {
    let html = '';
    field.values.forEach((_val, i) => {
        html += buildListItemHtml(fIdx, i, strings, field.descriptor);
    });
    html += '<button type="button" class="tiny_c4lauthor__precision-add-btn"' +
        ' data-field="' + fIdx + '">' +
        strings.get('precision_add_item') + '</button>';
    return html;
};

/**
 * Build a single list item.
 *
 * @param {number} fIdx
 * @param {number} itemIdx
 * @param {Map} strings
 * @param {Object} [desc] field descriptor, used when subfields are configured
 * @returns {string}
 */
const buildListItemHtml = (fIdx, itemIdx, strings, desc) => {
    let html = '<div class="tiny_c4lauthor__precision-list-item" data-item-idx="' + itemIdx + '">';
    if (desc && desc.subfields) {
        html += '<div class="tiny_c4lauthor__precision-subfields">';
        desc.subfields.forEach((sf, sIdx) => {
            const labelText = sf.label ? strings.get(sf.label) : '';
            html += '<div class="tiny_c4lauthor__precision-subfield">';
            if (labelText) {
                html += '<label class="tiny_c4lauthor__precision-sublabel">' + labelText + '</label>';
            }
            if (sf.type === 'textarea') {
                html += '<textarea class="tiny_c4lauthor__precision-input' +
                    ' tiny_c4lauthor__precision-textarea"' +
                    ' data-field="' + fIdx + '" data-item="' + itemIdx +
                    '" data-sub="' + sIdx + '"></textarea>';
            } else {
                html += '<input type="text" class="tiny_c4lauthor__precision-input"' +
                    ' data-field="' + fIdx + '" data-item="' + itemIdx +
                    '" data-sub="' + sIdx + '" value="">';
            }
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<textarea class="tiny_c4lauthor__precision-input' +
            ' tiny_c4lauthor__precision-textarea"' +
            ' data-field="' + fIdx + '" data-item="' + itemIdx + '"></textarea>';
    }
    html += '<button type="button" class="tiny_c4lauthor__precision-remove-btn"' +
        ' data-field="' + fIdx + '" data-item="' + itemIdx + '" title="' +
        escapeAttr(strings.get('precision_remove_item')) + '">&times;</button></div>';
    return html;
};

// ── Applying form values ──

/**
 * Apply a standard field value to the component DOM.
 *
 * @param {HTMLElement} compEl
 * @param {Object} desc
 * @param {string} val
 */
const applyStandardField = (compEl, desc, val) => {
    const el = desc.selector ? compEl.querySelector(desc.selector) : null;
    if (!el) {
        return;
    }
    if (desc.type === 'image-src') {
        el.setAttribute('src', val);
    } else if (desc.type === 'image-alt') {
        el.setAttribute('alt', val);
    } else if (desc.innerHTML) {
        el.innerHTML = val;
    } else {
        el.textContent = val;
    }
};

/**
 * Apply list field values to the component DOM.
 *
 * @param {HTMLElement} compEl
 * @param {Object} desc
 * @param {Object} field — extracted field object (with listParent and elements)
 * @param {HTMLElement} formPanel
 * @param {number} fIdx
 */
const applyListField = (compEl, desc, field, formPanel, fIdx) => {
    if (desc.apply) {
        const values = [];
        if (desc.subfields) {
            const items = formPanel.querySelectorAll(
                '.tiny_c4lauthor__precision-field-group[data-field-idx="' + fIdx + '"]' +
                ' .tiny_c4lauthor__precision-list-item'
            );
            items.forEach((item) => {
                const row = {};
                desc.subfields.forEach((sf, sIdx) => {
                    const input = item.querySelector('[data-sub="' + sIdx + '"]');
                    row[sf.key] = input ? input.value : '';
                });
                values.push(row);
            });
        } else {
            formPanel.querySelectorAll('textarea[data-field="' + fIdx + '"]').forEach((ta) => {
                values.push(ta.value);
            });
        }
        desc.apply(compEl, values, field);
        return;
    }
    const textareas = formPanel.querySelectorAll('textarea[data-field="' + fIdx + '"]');
    const listParent = field.listParent || (field.elements[0] ? field.elements[0].parentNode : null);
    if (!listParent) {
        return;
    }
    const existingLis = compEl.querySelectorAll(desc.selector);
    existingLis.forEach((li) => li.remove());
    textareas.forEach((ta) => {
        const li = compEl.ownerDocument.createElement('li');
        li.textContent = ta.value;
        listParent.appendChild(li);
    });
};

/**
 * Apply form values back to the component DOM element.
 *
 * @param {HTMLElement} compEl — the component in the iframe
 * @param {Array} fields — extracted fields
 * @param {HTMLElement} formPanel — form container to read values from
 */
const applyFormToComponent = (compEl, fields, formPanel) => {
    fields.forEach((field, fIdx) => {
        const desc = field.descriptor;
        if (desc.type === 'list') {
            applyListField(compEl, desc, field, formPanel, fIdx);
            return;
        }
        const input = formPanel.querySelector('[data-field="' + fIdx + '"]');
        if (!input) {
            return;
        }
        const val = input.value;
        // Custom apply function.
        if (desc.apply) {
            desc.apply(compEl, val);
            return;
        }
        // Fallback fields — always set textContent to match extraction.
        if (desc.fallback) {
            const target = (desc.selector && compEl.querySelector(desc.selector)) || compEl;
            target.textContent = val;
            return;
        }
        // Standard selector-based.
        applyStandardField(compEl, desc, val);
    });
};

// ── List item wiring ──

/**
 * Wire add/remove buttons for list-type fields.
 *
 * @param {HTMLElement} formPanel
 * @param {Map} strings
 * @param {Function} onFieldInput — callback to trigger reactive apply
 * @param {Array} [fields] — extracted fields, used to look up descriptors for new items
 */
const wireListButtons = (formPanel, strings, onFieldInput, fields) => {
    formPanel.querySelectorAll('.tiny_c4lauthor__precision-remove-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const listItem = btn.closest('.tiny_c4lauthor__precision-list-item');
            if (listItem) {
                listItem.remove();
                if (onFieldInput) {
                    onFieldInput();
                }
            }
        });
    });

    formPanel.querySelectorAll('.tiny_c4lauthor__precision-add-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const fIdx = btn.getAttribute('data-field');
            const group = btn.closest('.tiny_c4lauthor__precision-field-group');
            if (!group) {
                return;
            }
            const items = group.querySelectorAll('.tiny_c4lauthor__precision-list-item');
            const newIdx = items.length;
            const desc = fields && fields[fIdx] ? fields[fIdx].descriptor : null;
            const itemHtml = buildListItemHtml(fIdx, newIdx, strings, desc);
            btn.insertAdjacentHTML('beforebegin', itemHtml);
            // Wire the new item.
            const newItem = group.querySelectorAll('.tiny_c4lauthor__precision-list-item');
            const last = newItem[newItem.length - 1];
            const removeBtn = last.querySelector('.tiny_c4lauthor__precision-remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    last.remove();
                    if (onFieldInput) {
                        onFieldInput();
                    }
                });
            }
            last.querySelectorAll('.tiny_c4lauthor__precision-input').forEach((inp) => {
                if (onFieldInput) {
                    inp.addEventListener('input', onFieldInput);
                }
            });
            if (onFieldInput) {
                onFieldInput();
            }
        });
    });
};

// ── Main mount function ──

/**
 * Mount the Precision Mode view.
 *
 * @param {HTMLElement} container — the .tiny_c4lauthor__precision-container
 * @param {Object} handlers
 * @param {Function} handlers.getEditorContent — returns innerHTML from inner editor
 * @param {Function} handlers.setEditorContent — writes HTML back to inner editor
 * @param {Function} handlers.getContentCss — returns array of CSS URLs
 * @param {Object} catalogue — the components the editor offers, from registry.createCatalogue()
 * @returns {Promise<{destroy: Function}>}
 */
export const mountPreciseView = async(container, handlers, catalogue) => {
    fieldRegistry = buildFieldRegistry(catalogue.components);

    const templateHtml = await Templates.render('tiny_c4lauthor/precision_mode', {});
    container.innerHTML = templateHtml;

    const previewContainer = container.querySelector('.tiny_c4lauthor__precision-preview');
    const formPanel = container.querySelector('.tiny_c4lauthor__precision-form');
    const placeholder = container.querySelector('.tiny_c4lauthor__precision-placeholder');

    // The field labels come with the declarations; the form adds the add/remove item strings.
    const [addItemStr, removeItemStr] = await Promise.all([
        getString('precision_add_item', component),
        getString('precision_remove_item', component),
    ]);
    const strings = new Map(catalogue.strings);
    strings.set('precision_add_item', addItemStr);
    strings.set('precision_remove_item', removeItemStr);

    const editorHtml = handlers.getEditorContent();
    const cssUrls = handlers.getContentCss();
    const iframe = document.createElement('iframe');
    iframe.className = 'tiny_c4lauthor__precision-iframe';
    // The preview shows stored content, which can contain scripts. Keep them inert:
    // same origin so this module can read the document, but no scripts in the frame.
    iframe.setAttribute('sandbox', 'allow-same-origin');

    let linkTags = '';
    cssUrls.forEach((url) => {
        linkTags += '<link rel="stylesheet" href="' + escapeAttr(url) + '">';
    });

    // Colour mode. This preview is a document of its own, so the attribute has to be
    // written onto its root for the stylesheets above to resolve their dark values.
    const colourMode = document.documentElement.getAttribute('data-bs-theme') ?? 'light';

    const srcdoc = '<!DOCTYPE html><html data-bs-theme="' + escapeAttr(colourMode) + '">' +
        '<head><meta charset="utf-8">' + linkTags +
        '<style>body{margin:1rem;font-family:-apple-system,BlinkMacSystemFont,' +
        '"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}' +
        '.c4l-spacer{margin:.25rem 0}' +
        brandColourRule() +
        '[data-c4l-selected]{outline:2px solid #b8d7ff;outline-offset:2px;border-radius:0}' +
        'html[data-bs-theme=dark] [data-c4l-selected]{outline-color:var(--c4l-ui-accent)}</style>' +
        '</head><body class="tiny_c4lauthor__precision-body">' + editorHtml + '</body></html>';
    // Track the preview until it has loaded and is clickable, so Behat waits for it.
    const pending = new Pending('tiny_c4lauthor/precisionPreview');
    iframe.setAttribute('srcdoc', srcdoc);
    previewContainer.appendChild(iframe);

    let currentCompEl = null;
    let currentFields = null;

    /**
     * Get the preview's HTML without the attributes this view adds for its own use.
     *
     * @returns {string}
     */
    const getCleanHtml = () => {
        const body = iframe.contentDocument.body.cloneNode(true);
        body.querySelectorAll('[data-c4l-idx], [data-c4l-selected]').forEach((el) => {
            el.removeAttribute('data-c4l-idx');
            el.removeAttribute('data-c4l-selected');
        });
        return body.innerHTML;
    };

    iframe.addEventListener('load', () => {
        const iDoc = iframe.contentDocument;
        if (!iDoc) {
            pending.resolve();
            return;
        }

        // Index all C4L components.
        iDoc.querySelectorAll('[class*="c4lv-"]').forEach((el, idx) => {
            el.setAttribute('data-c4l-idx', idx);
        });

        iDoc.addEventListener('click', (e) => {
            e.preventDefault();
            handlePreviewClick(e.target, iDoc);
        });
        pending.resolve();
    });

    /**
     * Handle a click inside the preview iframe.
     *
     * @param {HTMLElement} target
     * @param {Document} iDoc
     */
    const handlePreviewClick = (target, iDoc) => {
        if (currentCompEl) {
            currentCompEl.removeAttribute('data-c4l-selected');
        }

        const compEl = findComponentEl(target, iDoc);
        if (!compEl) {
            clearForm();
            return;
        }

        const compName = identifyComponent(compEl);
        if (!compName || !fieldRegistry[compName]) {
            clearForm();
            return;
        }

        compEl.setAttribute('data-c4l-selected', '');
        currentCompEl = compEl;
        currentFields = extractFields(compEl, compName);

        if (currentFields.length === 0) {
            return;
        }

        showForm();
    };

    let syncTimer = null;

    /**
     * Flush any pending debounced sync immediately.
     */
    const flushSync = () => {
        if (syncTimer) {
            clearTimeout(syncTimer);
            syncTimer = null;
            handlers.setEditorContent(getCleanHtml());
        }
    };

    /**
     * Clear the form panel and show the placeholder.
     */
    const clearForm = () => {
        flushSync();
        currentCompEl = null;
        currentFields = null;
        if (placeholder) {
            placeholder.style.display = '';
        }
        const existing = formPanel.querySelector('.tiny_c4lauthor__precision-fields');
        if (existing) {
            existing.remove();
        }
    };

    /**
     * Show the form for the currently selected component.
     */
    const showForm = () => {
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        const oldFields = formPanel.querySelector('.tiny_c4lauthor__precision-fields');
        if (oldFields) {
            oldFields.remove();
        }

        formPanel.insertAdjacentHTML('beforeend', buildFormHtml(currentFields, strings));
        populateFormValues(formPanel, currentFields);
        autoResizeAll(formPanel);

        // Reactive input wiring — apply on every keystroke, debounce sync to inner editor.
        const applyReactive = () => {
            if (!currentCompEl || !currentFields) {
                return;
            }
            applyFormToComponent(currentCompEl, currentFields, formPanel);
        };

        const debouncedSync = () => {
            clearTimeout(syncTimer);
            syncTimer = setTimeout(() => {
                syncTimer = null;
                handlers.setEditorContent(getCleanHtml());
            }, 300);
        };

        const onFieldInput = () => {
            applyReactive();
            debouncedSync();
        };

        formPanel.querySelectorAll('.tiny_c4lauthor__precision-input').forEach((input) => {
            input.addEventListener('input', onFieldInput);
        });

        wireListButtons(formPanel, strings, onFieldInput, currentFields);
    };

    const destroy = () => {
        if (currentCompEl) {
            currentCompEl.removeAttribute('data-c4l-selected');
        }
        // Cancel any pending debounced sync and force-write the clean HTML.
        if (syncTimer) {
            clearTimeout(syncTimer);
            syncTimer = null;
        }
        if (iframe && iframe.contentDocument) {
            handlers.setEditorContent(getCleanHtml());
        }
        container.innerHTML = '';
        currentCompEl = null;
        currentFields = null;
    };

    return {destroy};
};
