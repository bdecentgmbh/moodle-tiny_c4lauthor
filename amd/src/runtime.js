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
 * Page behaviour of the interactive components: tabs, carousel, collapsible and link block.
 *
 * The components are plain markup recognised by their classes, so they survive Moodle's
 * HTML cleaning and stay readable without JavaScript: every tab, slide and collapsible
 * content is then simply shown. This script adds the buttons, the ARIA attributes and the
 * behaviour. It also reads the Bootstrap-based markup of the C4L Author bdecent build, so
 * content made with it keeps working.
 *
 * @module      tiny_c4lauthor/runtime
 * @copyright   2026 bdecent gmbh <https://bdecent.de>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {get_strings as getStrings} from 'core/str';
import {isWebAddress} from './sanitise';

const READY = 'c4l-ready';

/** Selector of everything this script acts on. */
const SELECTOR = '.c4lv-tabs, .c4lv-carousel, .c4lv-collapsible, a.c4l-linkblock, '
    + '.c4l-tabs-container, .c4l-carousel, .c4l-collapsible';

let idCounter = 0;
let stringsPromise = null;

/**
 * Get a unique id for an element of the page.
 *
 * @param {string} prefix
 * @returns {string}
 */
const uniqueId = (prefix) => `c4l-${prefix}-${Date.now().toString(36)}-${++idCounter}`;

/**
 * Get the strings the controls need, once.
 *
 * @returns {Promise<Object>}
 */
const loadStrings = () => {
    if (!stringsPromise) {
        stringsPromise = getStrings([
            {key: 'carousel_previous', component: 'tiny_c4lauthor'},
            {key: 'carousel_next', component: 'tiny_c4lauthor'},
            {key: 'tab', component: 'tiny_c4lauthor'},
        ]).then(([previous, next, tab]) => ({previous, next, tab}));
    }
    return stringsPromise;
};

/**
 * Get the label of one slide.
 *
 * @param {number} number from 1
 * @returns {Promise<string>}
 */
const slideLabel = (number) => getStrings([{key: 'carousel_slide', component: 'tiny_c4lauthor', param: number}])
    .then(([label]) => label);

/**
 * Copy the variant classes of a legacy component to its replacement.
 *
 * @param {HTMLElement} from
 * @param {HTMLElement} to
 */
const copyVariants = (from, to) => {
    from.classList.forEach((cls) => {
        if (/^c4l-.+-variant$/.test(cls)) {
            to.classList.add(cls);
        }
    });
};

/**
 * Create an element with a class.
 *
 * @param {Document} doc
 * @param {string} tag
 * @param {string} className
 * @returns {HTMLElement}
 */
const create = (doc, tag, className) => {
    const el = doc.createElement(tag);
    el.className = className;
    return el;
};

// ── Legacy markup of the bdecent build ──

/**
 * Turn the bdecent build's Bootstrap tabs into the class-based markup.
 *
 * @param {HTMLElement} legacy .c4l-tabs-container
 * @returns {HTMLElement|null} the new component
 */
const upgradeLegacyTabs = (legacy) => {
    const doc = legacy.ownerDocument;
    const panes = legacy.querySelectorAll('.tab-pane');
    if (!panes.length) {
        return null;
    }
    const navTitles = Array.from(legacy.querySelectorAll('.nav-tabs > li, .nav-tabs .nav-link'))
        .map((el) => el.textContent.trim());
    const tabs = create(doc, 'div', 'c4lv-tabs');
    copyVariants(legacy, tabs);
    panes.forEach((pane, index) => {
        const tab = create(doc, 'div', 'c4l-tab');
        const title = create(doc, 'p', 'c4l-tab-title');
        const oldTitle = pane.querySelector('.c4l-tab-title');
        title.textContent = (oldTitle ? oldTitle.textContent.trim() : '') || navTitles[index] || String(index + 1);
        if (oldTitle) {
            oldTitle.remove();
        }
        const content = create(doc, 'div', 'c4l-tab-content');
        while (pane.firstChild) {
            content.appendChild(pane.firstChild);
        }
        tab.append(title, content);
        tabs.appendChild(tab);
    });
    legacy.replaceWith(tabs);
    return tabs;
};

/**
 * Turn the bdecent build's Bootstrap carousel into the class-based markup.
 *
 * @param {HTMLElement} legacy .c4l-carousel
 * @returns {HTMLElement|null} the new component
 */
const upgradeLegacyCarousel = (legacy) => {
    const doc = legacy.ownerDocument;
    const items = legacy.querySelectorAll('.carousel-item');
    if (!items.length) {
        return null;
    }
    const carousel = create(doc, 'div', 'c4lv-carousel');
    copyVariants(legacy, carousel);
    items.forEach((item) => {
        const slide = create(doc, 'div', 'c4l-slide');
        while (item.firstChild) {
            slide.appendChild(item.firstChild);
        }
        carousel.appendChild(slide);
    });
    legacy.replaceWith(carousel);
    return carousel;
};

/**
 * Turn the bdecent build's Bootstrap collapsible into the class-based markup.
 *
 * Where Moodle cleaned the content, the button is gone and only its text is left.
 *
 * @param {HTMLElement} legacy .c4l-collapsible
 * @returns {HTMLElement|null} the new component
 */
const upgradeLegacyCollapsible = (legacy) => {
    const doc = legacy.ownerDocument;
    const body = legacy.querySelector('.collapse');
    if (!body) {
        return null;
    }
    const button = legacy.querySelector('button');
    let titleText = button ? button.textContent : '';
    if (!button) {
        legacy.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                titleText += node.textContent;
            }
        });
    }
    const collapsible = create(doc, 'div', 'c4lv-collapsible');
    copyVariants(legacy, collapsible);
    const title = create(doc, 'p', 'c4l-collapsible-title');
    title.textContent = titleText.trim();
    const content = create(doc, 'div', 'c4l-collapsible-content');
    const source = body.querySelector('.card-body') || body;
    while (source.firstChild) {
        content.appendChild(source.firstChild);
    }
    collapsible.append(title, content);
    legacy.replaceWith(collapsible);
    return collapsible;
};

// ── Behaviour ──

/**
 * Make a tabs component switch between its tabs.
 *
 * @param {HTMLElement} root .c4lv-tabs
 * @param {Object} strings
 */
const initTabs = (root, strings) => {
    const doc = root.ownerDocument;
    const tabs = Array.from(root.querySelectorAll(':scope > .c4l-tab'));
    if (!tabs.length) {
        return;
    }
    const list = create(doc, 'div', 'c4l-tablist');
    list.setAttribute('role', 'tablist');
    const buttons = tabs.map((tab, index) => {
        const title = tab.querySelector(':scope > .c4l-tab-title');
        const button = create(doc, 'button', 'c4l-tablist-button');
        button.type = 'button';
        button.id = uniqueId('tab');
        button.setAttribute('role', 'tab');
        button.textContent = (title && title.textContent.trim()) || `${strings.tab} ${index + 1}`;
        tab.id = tab.id || uniqueId('tabpanel');
        tab.setAttribute('role', 'tabpanel');
        tab.setAttribute('aria-labelledby', button.id);
        button.setAttribute('aria-controls', tab.id);
        list.appendChild(button);
        return button;
    });

    const select = (index, focus) => {
        buttons.forEach((button, i) => {
            const on = i === index;
            button.setAttribute('aria-selected', on ? 'true' : 'false');
            button.tabIndex = on ? 0 : -1;
            button.classList.toggle('active', on);
            tabs[i].hidden = !on;
        });
        if (focus) {
            buttons[index].focus();
        }
    };

    list.addEventListener('click', (e) => {
        const index = buttons.indexOf(e.target.closest('.c4l-tablist-button'));
        if (index >= 0) {
            select(index, false);
        }
    });
    list.addEventListener('keydown', (e) => {
        const current = buttons.indexOf(doc.activeElement);
        const last = buttons.length - 1;
        const target = {ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: last}[e.key];
        if (current < 0 || target === undefined) {
            return;
        }
        e.preventDefault();
        select((target + buttons.length) % buttons.length, true);
    });

    root.prepend(list);
    select(0, false);
};

/**
 * Make a carousel show one slide at a time.
 *
 * @param {HTMLElement} root .c4lv-carousel
 * @param {Object} strings
 */
const initCarousel = async(root, strings) => {
    const doc = root.ownerDocument;
    const slides = Array.from(root.querySelectorAll(':scope > .c4l-slide'));
    if (!slides.length) {
        return;
    }
    root.removeAttribute('contenteditable');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');

    const previous = create(doc, 'button', 'c4l-carousel-prev');
    previous.type = 'button';
    previous.setAttribute('aria-label', strings.previous);
    const next = create(doc, 'button', 'c4l-carousel-next');
    next.type = 'button';
    next.setAttribute('aria-label', strings.next);
    const indicators = create(doc, 'div', 'c4l-carousel-indicators');
    const labels = await Promise.all(slides.map((slide, index) => slideLabel(index + 1)));
    const dots = slides.map((slide, index) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', labels[index]);
        const dot = create(doc, 'button', 'c4l-carousel-indicator');
        dot.type = 'button';
        dot.setAttribute('aria-label', labels[index]);
        indicators.appendChild(dot);
        return dot;
    });

    let current = 0;
    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => {
            slide.hidden = i !== current;
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === current);
            if (i === current) {
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.removeAttribute('aria-current');
            }
        });
    };
    previous.addEventListener('click', () => show(current - 1));
    next.addEventListener('click', () => show(current + 1));
    indicators.addEventListener('click', (e) => {
        const index = dots.indexOf(e.target.closest('.c4l-carousel-indicator'));
        if (index >= 0) {
            show(index);
        }
    });

    if (slides.length > 1) {
        root.append(previous, next, indicators);
    }
    show(0);
};

/**
 * Make a collapsible open and close its content.
 *
 * @param {HTMLElement} root .c4lv-collapsible
 */
const initCollapsible = (root) => {
    const doc = root.ownerDocument;
    const title = root.querySelector(':scope > .c4l-collapsible-title');
    const content = root.querySelector(':scope > .c4l-collapsible-content');
    if (!title || !content) {
        return;
    }
    const button = create(doc, 'button', 'c4l-collapsible-toggle');
    button.type = 'button';
    while (title.firstChild) {
        button.appendChild(title.firstChild);
    }
    title.appendChild(button);
    content.id = content.id || uniqueId('collapsible');
    button.setAttribute('aria-controls', content.id);

    const set = (open) => {
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        content.hidden = !open;
    };
    button.addEventListener('click', () => set(content.hidden));
    set(false);
};

/**
 * Point a link block to the address it shows, if that is a web or mail address.
 *
 * Link blocks of the bdecent build keep their address only in the text. Anything else,
 * such as a javascript: address, is never copied into the link.
 *
 * @param {HTMLAnchorElement} link
 */
const syncLinkBlock = (link) => {
    const url = link.querySelector('.link-url');
    const address = url ? url.textContent.trim() : '';
    if (address && isWebAddress(address) && link.getAttribute('href') !== address) {
        link.setAttribute('href', address);
    }
};

/**
 * Enhance the components inside an element.
 *
 * @param {Document|HTMLElement} container
 */
export const enhance = async(container) => {
    if (!container.querySelector(SELECTOR)) {
        return;
    }
    container.querySelectorAll('a.c4l-linkblock').forEach(syncLinkBlock);

    // Content of the bdecent build becomes the class-based markup first.
    container.querySelectorAll('.c4l-tabs-container').forEach(upgradeLegacyTabs);
    container.querySelectorAll('.c4l-carousel:not(.c4lv-carousel)').forEach(upgradeLegacyCarousel);
    container.querySelectorAll('.c4l-collapsible:not(.c4lv-collapsible)').forEach(upgradeLegacyCollapsible);

    const roots = container.querySelectorAll(`.c4lv-tabs:not(.${READY}), .c4lv-carousel:not(.${READY}), `
        + `.c4lv-collapsible:not(.${READY})`);
    if (!roots.length) {
        return;
    }
    // Mark them first, so that a second run does not take them again.
    roots.forEach((root) => root.classList.add(READY));
    const strings = await loadStrings();
    roots.forEach((root) => {
        if (root.classList.contains('c4lv-tabs')) {
            initTabs(root, strings);
        } else if (root.classList.contains('c4lv-carousel')) {
            initCarousel(root, strings);
        } else {
            initCollapsible(root);
        }
    });
};

/**
 * Enhance the components on the page, and those that appear later, such as in content
 * loaded by AJAX.
 */
export const init = () => {
    enhance(document);
    let scheduled = false;
    new MutationObserver((mutations) => {
        if (scheduled || !mutations.some((m) => Array.from(m.addedNodes).some((n) => n.nodeType === Node.ELEMENT_NODE))) {
            return;
        }
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            enhance(document);
        });
    }).observe(document.body, {childList: true, subtree: true});
};
