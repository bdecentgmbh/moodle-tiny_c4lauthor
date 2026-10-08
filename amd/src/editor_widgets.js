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
 * Tabs and carousel controls inside the editor.
 *
 * In the editor, tabs show one tab at a time with a tab bar to switch, add and delete
 * tabs; a carousel shows one slide at a time with controls to browse, add and delete
 * slides and to add an image. The controls are editor-only (data-mce-bogus) and the
 * attributes that track the shown tab or slide are removed before the content is saved.
 *
 * @module      tiny_c4lauthor/editor_widgets
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>, bdecent gmbh <https://bdecent.de>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {get_strings as getStrings} from 'core/str';
import {component} from './common';

/** Attribute on the tab or slide shown in the editor. */
const ACTIVE = 'data-c4l-active';

/** Attribute on a component whose controls are shown. */
const EDITING = 'data-c4l-editing';

const STRING_KEYS = [
    'tab', 'tab_content', 'tabs_add_tab', 'tabs_delete_tab', 'carousel_previous', 'carousel_next',
    'carousel_add_slide', 'carousel_delete_slide', 'carousel_add_image', 'carousel_change_image',
];

/**
 * Create an editor-only control element.
 *
 * @param {Document} doc
 * @param {string} tag
 * @param {string} className
 * @param {string} [action] what a click on it does
 * @param {string} [text]
 * @returns {HTMLElement}
 */
const control = (doc, tag, className, action, text) => {
    const el = doc.createElement(tag);
    el.className = className;
    el.setAttribute('contenteditable', 'false');
    el.setAttribute('data-mce-bogus', 'all');
    if (action) {
        el.setAttribute('data-c4l-action', action);
    }
    if (text) {
        el.textContent = text;
    }
    return el;
};

/**
 * Get the tabs or slides of a component, and the index of the one shown.
 *
 * @param {HTMLElement} root
 * @param {string} selector of the items
 * @returns {{items: HTMLElement[], index: number}}
 */
const itemsOf = (root, selector) => {
    const items = Array.from(root.querySelectorAll(`:scope > ${selector}`));
    return {items, index: Math.max(0, items.findIndex((item) => item.hasAttribute(ACTIVE)))};
};

/**
 * Show one tab or slide.
 *
 * @param {HTMLElement[]} items
 * @param {number} index
 */
const show = (items, index) => {
    items.forEach((item, i) => {
        if (i === index) {
            item.setAttribute(ACTIVE, '');
        } else {
            item.removeAttribute(ACTIVE);
        }
    });
};

// ── Tabs ──

/**
 * Draw the tab bar and the tab toolbar of a tabs component.
 *
 * @param {HTMLElement} root .c4lv-tabs
 * @param {Object} strings
 */
const drawTabs = (root, strings) => {
    const doc = root.ownerDocument;
    const {items, index} = itemsOf(root, '.c4l-tab');
    show(items, index);

    root.querySelectorAll(':scope > .c4l-editor-tabbar, :scope > .c4l-editor-toolbar').forEach((el) => el.remove());
    const bar = control(doc, 'div', 'c4l-editor-tabbar');
    items.forEach((tab, i) => {
        const title = tab.querySelector(':scope > .c4l-tab-title');
        const text = (title && title.textContent.trim()) || `${strings.tab} ${i + 1}`;
        const button = control(doc, 'span', 'c4l-editor-tab' + (i === index ? ' active' : ''), 'tabs-select', text);
        button.setAttribute('data-c4l-index', i);
        bar.appendChild(button);
    });
    const toolbar = control(doc, 'div', 'c4l-editor-toolbar');
    toolbar.append(
        control(doc, 'span', 'c4l-editor-button', 'tabs-add', '+ ' + strings.tabs_add_tab),
        control(doc, 'span', 'c4l-editor-button', 'tabs-delete', '× ' + strings.tabs_delete_tab),
    );
    root.prepend(bar);
    root.append(toolbar);
};

/**
 * Handle a click on a tabs control.
 *
 * @param {HTMLElement} root
 * @param {string} action
 * @param {HTMLElement} target
 * @param {Object} strings
 * @returns {boolean} whether the content changed
 */
const tabsAction = (root, action, target, strings) => {
    const doc = root.ownerDocument;
    const {items, index} = itemsOf(root, '.c4l-tab');
    if (action === 'tabs-select') {
        show(items, parseInt(target.getAttribute('data-c4l-index'), 10));
        return false;
    }
    if (action === 'tabs-add') {
        const number = items.length + 1;
        const tab = doc.createElement('div');
        tab.className = 'c4l-tab';
        const title = doc.createElement('p');
        title.className = 'c4l-tab-title';
        title.textContent = `${strings.tab} ${number}`;
        const content = doc.createElement('div');
        content.className = 'c4l-tab-content';
        const paragraph = doc.createElement('p');
        paragraph.textContent = `${strings.tab_content} ${number}.`;
        content.appendChild(paragraph);
        tab.append(title, content);
        (items[items.length - 1] || root.firstChild).after(tab);
        show([...items, tab], items.length);
        return true;
    }
    if (action === 'tabs-delete' && items.length > 1) {
        items[index].remove();
        items.splice(index, 1);
        show(items, Math.min(index, items.length - 1));
        return true;
    }
    return false;
};

/**
 * Keep a tabs component's controls in step with its tabs.
 *
 * @param {HTMLElement} root .c4lv-tabs
 * @param {Object} strings
 */
const attachTabs = (root, strings) => {
    root.setAttribute(EDITING, '');
    drawTabs(root, strings);
    // Redraw when a title changes or tabs come and go, but not for the redraw itself.
    const signature = () => Array.from(root.querySelectorAll(':scope > .c4l-tab'))
        .map((tab) => (tab.querySelector(':scope > .c4l-tab-title') || {}).textContent).join('\u0001');
    let last = signature();
    new MutationObserver(() => {
        const current = signature();
        if (current !== last) {
            last = current;
            drawTabs(root, strings);
        }
    }).observe(root, {childList: true, subtree: true, characterData: true});
};

// ── Carousel ──

/**
 * Draw the controls of a carousel.
 *
 * @param {HTMLElement} root .c4lv-carousel
 * @param {Object} strings
 */
const drawCarousel = (root, strings) => {
    const doc = root.ownerDocument;
    const {items, index} = itemsOf(root, '.c4l-slide');
    show(items, index);

    root.querySelectorAll(':scope > .c4l-editor-carousel').forEach((el) => el.remove());
    const controls = control(doc, 'div', 'c4l-editor-carousel');
    const hasImage = !!(items[index] && items[index].querySelector('img[src]:not([src=""])'));
    controls.append(
        control(doc, 'span', 'c4l-editor-carousel-prev', 'carousel-prev', '‹'),
        control(doc, 'span', 'c4l-editor-button c4l-editor-carousel-image', 'carousel-image',
            '+ ' + (hasImage ? strings.carousel_change_image : strings.carousel_add_image)),
        control(doc, 'span', 'c4l-editor-carousel-next', 'carousel-next', '›'),
    );
    const toolbar = control(doc, 'div', 'c4l-editor-toolbar');
    toolbar.append(
        control(doc, 'span', 'c4l-editor-carousel-count', null, `${index + 1} / ${items.length}`),
        control(doc, 'span', 'c4l-editor-button', 'carousel-add', '+ ' + strings.carousel_add_slide),
        control(doc, 'span', 'c4l-editor-button', 'carousel-delete', '× ' + strings.carousel_delete_slide),
    );
    controls.appendChild(toolbar);
    controls.querySelector('.c4l-editor-carousel-prev').title = strings.carousel_previous;
    controls.querySelector('.c4l-editor-carousel-next').title = strings.carousel_next;
    root.appendChild(controls);
};

/**
 * Let the user pick an image with the editor's image dialog and put it into a slide.
 *
 * The carousel cannot be edited directly, so the cursor goes right after it for the
 * dialog to insert the image there, and the image then moves into the slide.
 *
 * @param {object} editor
 * @param {HTMLElement} root
 * @param {HTMLElement} slide
 * @param {Function} redraw
 */
const pickImage = (editor, root, slide, redraw) => {
    const body = editor.getBody();
    const before = new Set(body.querySelectorAll('img'));
    let landing = root.nextElementSibling;
    if (!landing) {
        landing = editor.getDoc().createElement('p');
        landing.innerHTML = '<br>';
        root.after(landing);
    }
    editor.selection.setCursorLocation(landing, 0);

    const stop = () => {
        editor.off('SetContent NodeChange', onChange);
    };
    const onChange = () => {
        const image = Array.from(body.querySelectorAll('img')).find((img) => !before.has(img));
        if (!image) {
            return;
        }
        stop();
        slide.querySelectorAll('img').forEach((old) => old.remove());
        slide.appendChild(image);
        editor.undoManager.add();
        redraw();
    };
    editor.on('SetContent NodeChange', onChange);
    // Give up after a minute if no image comes.
    setTimeout(stop, 60000);

    const button = editor.ui.registry.getAll().buttons.tiny_media_image;
    if (button && typeof button.onAction === 'function') {
        button.onAction();
    } else {
        editor.execCommand('mceImage');
    }
};

/**
 * Handle a click on a carousel control.
 *
 * @param {object} editor
 * @param {HTMLElement} root
 * @param {string} action
 * @param {Object} strings
 * @returns {boolean} whether the content changed
 */
const carouselAction = (editor, root, action, strings) => {
    const doc = root.ownerDocument;
    const {items, index} = itemsOf(root, '.c4l-slide');
    if (action === 'carousel-prev' || action === 'carousel-next') {
        const step = action === 'carousel-next' ? 1 : -1;
        show(items, (index + step + items.length) % items.length);
        drawCarousel(root, strings);
        return false;
    }
    if (action === 'carousel-add') {
        const slide = doc.createElement('div');
        slide.className = 'c4l-slide';
        items[index].after(slide);
        show([...items.slice(0, index + 1), slide, ...items.slice(index + 1)], index + 1);
        drawCarousel(root, strings);
        return true;
    }
    if (action === 'carousel-delete' && items.length > 1) {
        items[index].remove();
        items.splice(index, 1);
        show(items, Math.min(index, items.length - 1));
        drawCarousel(root, strings);
        return true;
    }
    if (action === 'carousel-image') {
        pickImage(editor, root, items[index], () => drawCarousel(root, strings));
    }
    return false;
};

/**
 * Attach the controls to the tabs and carousels in an editor.
 *
 * @param {object} editor TinyMCE editor
 */
export const attach = async(editor) => {
    const values = await getStrings(STRING_KEYS.map((key) => ({key, component})));
    const strings = Object.fromEntries(STRING_KEYS.map((key, i) => [key, values[i]]));
    const doc = editor.getDoc();
    if (!doc) {
        return;
    }
    const attached = new WeakSet();

    const setup = () => {
        doc.querySelectorAll('.c4lv-tabs').forEach((root) => {
            if (!attached.has(root)) {
                attached.add(root);
                attachTabs(root, strings);
            }
        });
        doc.querySelectorAll('.c4lv-carousel').forEach((root) => {
            if (!attached.has(root)) {
                attached.add(root);
                root.setAttribute(EDITING, '');
                drawCarousel(root, strings);
            }
        });
    };

    const onClick = (e) => {
        const target = e.target.closest('[data-c4l-action]');
        const root = target && target.closest('.c4lv-tabs, .c4lv-carousel');
        if (!root) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const action = target.getAttribute('data-c4l-action');
        const changed = root.classList.contains('c4lv-tabs')
            ? tabsAction(root, action, target, strings)
            : carouselAction(editor, root, action, strings);
        if (root.classList.contains('c4lv-tabs')) {
            drawTabs(root, strings);
        }
        if (changed) {
            editor.undoManager.add();
            editor.nodeChanged();
        }
    };

    doc.addEventListener('click', onClick, true);
    setup();
    editor.on('SetContent Undo Redo', setup);

    // Keep the editor's own state out of the saved content.
    editor.on('PreProcess', (e) => {
        if (e.node && e.node.querySelectorAll) {
            e.node.querySelectorAll(`[${ACTIVE}], [${EDITING}]`).forEach((el) => {
                el.removeAttribute(ACTIVE);
                el.removeAttribute(EDITING);
            });
        }
    });
    editor.on('remove', () => doc.removeEventListener('click', onClick, true));
};
