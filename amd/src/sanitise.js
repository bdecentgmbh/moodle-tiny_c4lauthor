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
 * Allow-list sanitiser for editor content shown outside the editor iframe.
 *
 * Editor content can hold scripts and event handlers (Moodle's TinyMCE keeps
 * script[*]). Whenever a fragment of it is shown in the page itself, for example as
 * a preview, it goes through this sanitiser first. Parsing uses DOMParser, which
 * never runs scripts or loads resources.
 *
 * @module      tiny_c4lauthor/sanitise
 * @copyright   2026 bdecent gmbh <https://bdecent.de>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/** Elements dropped together with everything inside them. */
const DROPPED = new Set([
    'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'link', 'meta', 'base',
    'template', 'noscript', 'svg', 'form', 'input', 'button', 'select', 'textarea', 'option', 'audio', 'video',
    'source', 'track', 'canvas', 'portal',
]);

/** Elements kept as they are; anything else not dropped is replaced by its children. */
const ALLOWED = new Set([
    'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'dd', 'del', 'details', 'div', 'dl', 'dt',
    'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark',
    'ol', 'p', 'pre', 'q', 's', 'samp', 'section', 'small', 'span', 'strong', 'sub', 'summary', 'sup', 'table',
    'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul',
    // MathML, as produced by the editor's equation tools.
    'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mspace', 'msup', 'msub',
    'msubsup', 'mfrac', 'msqrt', 'mroot', 'mover', 'munder', 'munderover', 'mtable', 'mtr', 'mtd', 'mstyle',
    'mpadded', 'mphantom', 'menclose', 'merror',
]);

/** Attributes kept on any allowed element. */
const ALLOWED_ATTRIBUTES = new Set([
    'class', 'title', 'lang', 'dir', 'role', 'colspan', 'rowspan', 'scope', 'headers', 'datetime', 'cite',
    'width', 'height', 'alt', 'href', 'src', 'target', 'rel', 'encoding', 'display', 'mathvariant',
]);

/** Attributes holding a URL, and the elements allowed to carry them. */
const URL_ATTRIBUTES = {href: new Set(['a']), src: new Set(['img']), cite: new Set(['blockquote', 'q', 'del', 'ins'])};

/**
 * Whether a URL is safe to keep: http(s), mailto, or relative.
 *
 * @param {string} value
 * @returns {boolean}
 */
const isSafeUrl = (value) => {
    // Browsers ignore control characters and spaces inside the scheme, so remove them before checking.
    // eslint-disable-next-line no-control-regex
    const compact = value.replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase();
    const scheme = compact.match(/^([a-z][a-z0-9+.-]*):/);
    return !scheme || ['http', 'https', 'mailto'].includes(scheme[1]);
};

/**
 * Clean the attributes of one element in place.
 *
 * @param {Element} el
 * @param {string} tag lower-case tag name
 */
const cleanAttributes = (el, tag) => {
    Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const keep = (ALLOWED_ATTRIBUTES.has(name) || name.startsWith('aria-'))
            && (!URL_ATTRIBUTES[name] || (URL_ATTRIBUTES[name].has(tag) && isSafeUrl(attr.value)));
        if (!keep) {
            el.removeAttribute(attr.name);
        }
    });
    if (tag === 'a' && el.getAttribute('target')) {
        el.setAttribute('rel', 'noopener noreferrer');
    }
};

/**
 * Clean a node's children in place.
 *
 * @param {Node} parent
 */
const cleanChildren = (parent) => {
    Array.from(parent.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
            node.remove();
            return;
        }
        const tag = node.localName.toLowerCase();
        if (DROPPED.has(tag)) {
            node.remove();
            return;
        }
        cleanChildren(node);
        if (ALLOWED.has(tag)) {
            cleanAttributes(node, tag);
        } else {
            node.replaceWith(...Array.from(node.childNodes));
        }
    });
};

/**
 * Return a sanitised copy of an HTML fragment, safe to insert into the page.
 *
 * @param {string} html
 * @returns {string}
 */
export const sanitiseHtml = (html) => {
    const doc = new DOMParser().parseFromString('<body>' + (html || '') + '</body>', 'text/html');
    cleanChildren(doc.body);
    return doc.body.innerHTML;
};
