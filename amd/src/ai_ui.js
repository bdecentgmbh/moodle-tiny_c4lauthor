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
 * Suggestion list UI rendered inside the existing C4L Author modal.
 *
 * @module      tiny_c4lauthor/ai_ui
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {render as renderTemplate} from 'core/templates';
import {get_string as getString, get_strings as getStrings} from 'core/str';
import {component as stringComponent} from './common';
import {extractBlocks} from './ai_content';
import {sanitiseHtml} from './sanitise';

const SELECTABLE_COMPONENTS = new Set([
    'keyconcept', 'tip', 'reminder', 'attention', 'learning_outcomes',
]);

// Filled from the language strings by loadComponentLabels() before the view renders.
let COMPONENT_LABELS = {};

const loadComponentLabels = async() => {
    const keys = ['tip', 'attention', 'learning_outcomes', 'keyconcept', 'reminder'];
    const strs = await getStrings(keys.map((k) => ({key: 'ai_label_' + k, component: stringComponent})));
    COMPONENT_LABELS = keys.reduce((acc, k, i) => ({...acc, [k]: strs[i]}), {});
};

/**
 * Mount the AI suggest view inside a given container element.
 *
 * @param {HTMLElement} container - Target DOM element.
 * @param {Object} handlers - Callbacks {getHtmlForMode, onAnalyse, onReanalyse, onApply, onBack}.
 * @returns {Promise<Object>} Controller with runInitialAnalyse/setSuggestions/destroy methods.
 */
export const mountAiView = async(container, handlers) => {
    await loadComponentLabels();

    let suggestions = [];
    let existingComponents = [];
    let baseBlocks = [];
    let blocks = [];
    let nextIdx = 0;
    let showReanalyse = false;

    const [reanalyseLabel, selectedCountLabel] = await Promise.all([
        getString('ai_reanalyse', stringComponent),
        getString('ai_selected_count', stringComponent),
    ]);

    const buildBlocks = () => {
        const html = (typeof handlers.getHtmlForMode === 'function') ? handlers.getHtmlForMode() : '';
        baseBlocks = extractBlocks(html);

        existingComponents = baseBlocks
            .filter((b) => b.type === 'c4l' && SELECTABLE_COMPONENTS.has(b.c4lComponent))
            .map((b) => ({
                component: b.c4lComponent,
                c4lComponent: b.c4lComponent,
                c4lIndex: b.c4lIndex,
                _idx: nextIdx++,
                selected: true,
                isExisting: true,
            }));

        decorateBlocks();
    };

    const decorateBlocks = () => {
        const byP = new Map();
        suggestions.forEach((s) => byP.set(s.targetindex, s));

        const byC4L = new Map();
        existingComponents.forEach((s) => byC4L.set(s.c4lIndex, s));

        let animIdx = 0;
        blocks = baseBlocks.map((b) => {
            const isP = b.type === 'p';
            const isC4L = b.type === 'c4l';
            let sug = null;

            if (isP) {
                sug = byP.get(b.pIndex) || null;
            } else if (isC4L) {
                sug = byC4L.get(b.c4lIndex) || null;
            }

            const isHeading = /^h[1-6]$/.test(b.type);

            const isDisplayOnly = isC4L && !SELECTABLE_COMPONENTS.has(b.c4lComponent);

            return {
                ...b,
                isHeading,
                headingTag: isHeading ? b.type : null,
                isLI: b.type === 'li',
                isMath: b.type === 'math',
                isP,
                isC4L,
                isDisplayOnly,
                componentClass: isC4L ? 'c4lv-' + (b.c4lComponent || '').replace(/_/g, '') : null,
                // Rendered unescaped in the template, so it must be sanitised here.
                c4lHtml: isDisplayOnly ? sanitiseHtml(b.html) : '',
                animDelay: (animIdx++) * 40,
                suggestion: sug ? {
                    ...sug,
                    componentClass: 'c4lv-' + (sug.component || '').replace(/_/g, ''),
                    componentLabel: COMPONENT_LABELS[sug.component] || sug.component,
                    isLearningOutcomes: sug.component === 'learning_outcomes',
                } : null,
            };
        });

        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].isP && blocks[i].suggestion) {
                const listItems = [];
                let j = i + 1;
                while (j < blocks.length && blocks[j].isLI) {
                    blocks[j].isGrouped = true;
                    listItems.push({text: blocks[j].text});
                    j++;
                }
                if (listItems.length) {
                    blocks[i].listItems = listItems;
                    blocks[i].hasListItems = true;
                } else if (blocks[i].text.trim().endsWith(':') && j < blocks.length && !blocks[j].isHeading) {
                    const next = blocks[j];
                    if (next.isMath) {
                        next.isGrouped = true;
                        // Rendered unescaped in the template, so it must be sanitised here.
                        blocks[i].followingHtml = sanitiseHtml(next.html);
                        blocks[i].followingText = next.text;
                        blocks[i].hasFollowingHtml = !!next.html;
                        blocks[i].hasFollowingText = true;
                        // eslint-disable-next-line max-depth
                        if (j + 1 < blocks.length && blocks[j + 1].isP && !blocks[j + 1].suggestion) {
                            blocks[j + 1].isGrouped = true;
                        }
                    } else if (next.isP && !next.suggestion) {
                        next.isGrouped = true;
                        blocks[i].followingText = next.text;
                        blocks[i].hasFollowingText = true;
                    }
                }
            }
        }
    };

    const getSelectedCount = () =>
        suggestions.filter((s) => s.selected).length + existingComponents.filter((s) => s.selected).length;

    const renderBody = async({loading, warnings = []}) => {
        const lastDelay = blocks.length ? blocks[blocks.length - 1].animDelay : 0;
        return renderTemplate('tiny_c4lauthor/ai_suggest', {
            loading,
            warnings,
            blocks,
            showReanalyse,
            reanalyseLabel,
            selectedCount: getSelectedCount(),
            buttonDelay: lastDelay + 80,
        });
    };

    buildBlocks();

    // Initial render with loading state.
    const html = await renderBody({loading: true});
    container.innerHTML = html;

    // Event delegation on the container.
    const onChange = (e) => {
        const target = e.target;
        if (!target.matches || !target.matches('[data-action="toggle"]')) {
            return;
        }
        const idx = parseInt(target.getAttribute('data-idx'), 10);
        const isExisting = target.getAttribute('data-existing') === '1';

        if (isExisting) {
            const found = existingComponents.find((s) => s._idx === idx);
            if (found) {
                found.selected = target.checked;
            }
        } else {
            const found = suggestions.find((s) => s._idx === idx);
            if (found) {
                found.selected = target.checked;
            }
        }
        const card = target.closest('.c4lauthor-ai-card');
        if (card) {
            card.classList.toggle('c4lauthor-ai-card--selected', target.checked);
            const preview = card.querySelector('.c4lauthor-ai-card__preview');
            const plain = card.querySelector('.c4lauthor-ai-card__plain');
            if (preview && plain) {
                preview.style.display = target.checked ? '' : 'none';
                plain.style.display = target.checked ? 'none' : '';
            }
        }
        const countEl = container.querySelector('[data-region="selected-count"]');
        if (countEl) {
            countEl.textContent = getSelectedCount() + ' ' + selectedCountLabel;
        }
    };

    const onClick = async(e) => {
        const target = e.target.closest('[data-action]');
        if (!target) {
            return;
        }
        const action = target.getAttribute('data-action');

        if (action === 'ai-back') {
            e.preventDefault();
            if (typeof handlers.onBack === 'function') {
                handlers.onBack();
            }
            return;
        }

        if (action === 'ai-reanalyse') {
            e.preventDefault();
            if (typeof handlers.onReanalyse === 'function') {
                handlers.onReanalyse();
            }
            buildBlocks();
            container.innerHTML = await renderBody({loading: true});
            if (typeof handlers.onAnalyse === 'function') {
                await handlers.onAnalyse();
            }
            return;
        }

        if (action === 'ai-apply') {
            e.preventDefault();
            if (typeof handlers.onApply === 'function') {
                handlers.onApply(
                    suggestions.filter((s) => s.selected),
                    existingComponents.filter((s) => !s.selected),
                );
            }
        }
    };

    container.addEventListener('change', onChange);
    container.addEventListener('click', onClick);

    return {
        runInitialAnalyse: async() => {
            if (typeof handlers.onAnalyse === 'function') {
                await handlers.onAnalyse();
            }
        },

        setSuggestions: async(newSuggestions, warnings = [], options = {}) => {
            suggestions = (newSuggestions || []).map((s) => ({
                ...s,
                _idx: nextIdx++,
                selected: true,
            }));
            showReanalyse = !!options.showReanalyse;
            decorateBlocks();
            container.innerHTML = await renderBody({loading: false, warnings});
        },

        destroy: () => {
            container.removeEventListener('change', onChange);
            container.removeEventListener('click', onClick);
            container.innerHTML = '';
        },
    };
};
