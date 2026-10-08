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
 * Wrap/unwrap C4L components for AI suggest apply phase.
 *
 * @module      tiny_c4lauthor/ai_apply
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getC4LSelector} from './ai_content';
import Mustache from 'core/mustache';

const PARAGRAPH_TEMPLATE = '<p>{{content}}</p>';

const wrapWithComponent = (component, innerHtml, learningOutcomesTitle) => {
    switch (component) {
        case 'tip':
            return `<p class="c4l-spacer">&nbsp;</p><div class="c4lv-tip">${innerHtml}</div><p class="c4l-spacer">&nbsp;</p>`;
        case 'attention':
            return `<p class="c4l-spacer">&nbsp;</p><div class="c4lv-attention">${innerHtml}</div><p class="c4l-spacer">&nbsp;</p>`;
        case 'learning_outcomes':
            return `<p class="c4l-spacer">&nbsp;</p><div class="c4lv-learningoutcomes">` +
                `<h6 class="c4l-learningoutcomes-title">${learningOutcomesTitle}</h6>` +
                `<ul class="c4l-learningoutcomes-list"><li>${innerHtml}</li></ul></div><p class="c4l-spacer">&nbsp;</p>`;
        case 'keyconcept':
            return `<p class="c4l-spacer">&nbsp;</p><div class="c4lv-keyconcept">${innerHtml}</div>` +
                `<p class="c4l-spacer">&nbsp;</p>`;
        case 'reminder':
            return `<p class="c4l-spacer">&nbsp;</p><div class="c4lv-reminder">${innerHtml}</div><p class="c4l-spacer">&nbsp;</p>`;
        default:
            return innerHtml;
    }
};

const renderParagraph = (content) => {
    const html = Mustache.render(PARAGRAPH_TEMPLATE, {content});
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    return parsed.body.firstChild;
};

const unwrapC4LDiv = (doc, c4lDiv, component) => {
    const prev = c4lDiv.previousElementSibling;
    if (prev && prev.tagName === 'P' && prev.classList.contains('c4l-spacer')) {
        prev.remove();
    }
    const next = c4lDiv.nextElementSibling;
    if (next && next.tagName === 'P' && !(next.textContent || '').trim()) {
        next.remove();
    }

    if (component === 'learning_outcomes') {
        const fragments = [];
        const items = c4lDiv.querySelectorAll('.c4l-learningoutcomes-list li');
        items.forEach((li) => {
            fragments.push(doc.adoptNode(renderParagraph(li.textContent)));
        });
        if (fragments.length) {
            c4lDiv.replaceWith(...fragments);
        } else {
            c4lDiv.remove();
        }
    } else {
        const INLINE_RE = /^(A|ABBR|B|BDO|BR|CITE|CODE|DFN|EM|I|IMG|KBD|MARK|Q|S|SAMP|SMALL|SPAN|STRONG|SUB|SUP|TIME|U|VAR)$/;
        const embeddedBlock = Array.from(c4lDiv.children).find((el) => !INLINE_RE.test(el.tagName));
        if (embeddedBlock) {
            const p = doc.createElement('p');
            while (c4lDiv.firstChild && c4lDiv.firstChild !== embeddedBlock) {
                p.appendChild(c4lDiv.firstChild);
            }
            const remaining = Array.from(c4lDiv.childNodes);
            c4lDiv.replaceWith(p, ...remaining);
        } else {
            c4lDiv.replaceWith(doc.adoptNode(renderParagraph(c4lDiv.innerHTML)));
        }
    }
};

export const stripAllC4L = (html) => {
    const doc = new DOMParser().parseFromString(`<div id="root">${html || ''}</div>`, 'text/html');
    const root = doc.querySelector('#root');
    if (!root) {
        return html;
    }
    const selector = 'div.c4lv-tip, div.c4lv-attention, div.c4lv-learningoutcomes, div.c4lv-keyconcept, div.c4lv-reminder';
    const c4lDivs = Array.from(root.querySelectorAll(selector));
    for (let i = c4lDivs.length - 1; i >= 0; i--) {
        const comp = c4lDivs[i].classList.contains('c4lv-learningoutcomes') ? 'learning_outcomes' : '';
        unwrapC4LDiv(doc, c4lDivs[i], comp);
    }
    return root.innerHTML;
};

const isInsideC4L = (el) => {
    const parent = el.closest('[class]');
    return parent ? /\bc4lv?\b|\bc4lv?[-\w]*/.test(parent.className) : false;
};

const collectInnerContent = (p) => {
    let content = p.innerHTML;
    const followingEl = p.nextElementSibling;
    if (followingEl && (followingEl.tagName === 'UL' || followingEl.tagName === 'OL')) {
        content += followingEl.outerHTML;
        followingEl.remove();
    } else if ((p.textContent || '').trim().endsWith(':') && followingEl) {
        content += followingEl.outerHTML;
        const isCustomEl = followingEl.tagName.includes('-');
        followingEl.remove();
        if (isCustomEl) {
            const textFallback = p.nextElementSibling;
            if (textFallback && textFallback.tagName === 'P') {
                content += textFallback.outerHTML;
                textFallback.remove();
            }
        }
    }
    return content;
};

export const applyChanges = (html, toWrap, toUnwrap, learningOutcomesTitle) => {
    if (!html) {
        return html;
    }
    if (!toWrap?.length && !toUnwrap?.length) {
        return html;
    }

    const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
    const root = doc.querySelector('#root');
    if (!root) {
        return html;
    }

    const allParagraphs = Array.from(root.querySelectorAll('p'));
    const c4lDivs = Array.from(root.querySelectorAll(getC4LSelector()));

    if (toWrap?.length) {
        const sorted = [...toWrap]
            .filter((s) => s.targettype === 'p')
            .sort((a, b) => b.targetindex - a.targetindex);

        for (const s of sorted) {
            const p = allParagraphs[s.targetindex];
            if (!p || isInsideC4L(p)) {
                continue;
            }

            const innerContent = collectInnerContent(p);
            const wrapper = doc.createElement('div');
            wrapper.innerHTML = wrapWithComponent(s.component, innerContent, learningOutcomesTitle);
            const nodes = Array.from(wrapper.childNodes);
            if (nodes.length) {
                p.replaceWith(...nodes);
            }
        }
    }

    if (toUnwrap?.length) {
        const sorted = [...toUnwrap].sort((a, b) => b.c4lIndex - a.c4lIndex);
        for (const s of sorted) {
            const c4lDiv = c4lDivs[s.c4lIndex];
            if (!c4lDiv || !c4lDiv.parentNode) {
                continue;
            }
            unwrapC4LDiv(doc, c4lDiv, s.c4lComponent || s.component || '');
        }
    }

    return root.innerHTML;
};
