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
 * Tiny C4L Author commands and UI logic.
 *
 * @module      tiny_c4lauthor/commands
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getButtonImage} from 'editor_tiny/utils';
import {get_string as getString} from 'core/str';
import {getTinyMCE} from 'editor_tiny/loader';
import Modal from 'core/modal';
import Pending from 'core/pending';
import {
    register as registerMoodleOptions,
    getContextId,
    getDraftItemId,
    getFilepickers,
    getMoodleLang,
    getCurrentLanguage,
} from 'editor_tiny/options';
import {component, buttonName, buttonIcon, quickInsertMenuName, convertMenuName} from './common';
import {loadRegistry, createCatalogue} from './registry';
import {buildCustomComponents, buildComponentHtml} from './component_html';
import {registerConvertMenu} from './convert';
import {showCustomDropdown} from './dropdown';
import {registerComponentIcons} from './icons';
import {buildSidebar, setupTabOverflow} from './sidebar';
import {setupVariantToolbar} from './variant_toolbar';
import {attach as attachEditorWidgets} from './editor_widgets';
import {
    isShowOverlay,
    isC4LVisible,
    isStudent,
    showDocs,
    getallowedComponents,
    getcustomComponents,
    getEditorCss,
    getpreviewCSS,
    isAiEnabled,
    isAiPolicyAgreed,
    getAiRates,
} from './options';
import {loadVariantPreferences, saveVariantPreferences} from './variantslib';
import Notification from 'core/notification';
import CustomEvents from 'core/custom_interaction_events';
import AiPolicy from 'core_ai/policy';
import AiPolicyModal from 'core_ai/policymodal';
import {getPolicyStatus as fetchAiPolicyStatus} from 'core_ai/repository';
import $ from 'jquery';
import {
    EditorState as CMState,
    EditorView as CMView,
    basicSetup as cmBasicSetup,
    lang as cmLang,
} from 'tiny_html/codemirror-lazy';
import {brandColourRule} from './brand';
import {callSuggest} from './ai_api';
import {mountAiView} from './ai_ui';
import {mountPreciseView} from './precise_ui';
import {applyChanges as aiApplyChanges, stripAllC4L as aiStripAllC4L} from './ai_apply';
import {
    contentFingerprint as aiContentFingerprint,
    STORAGE_PREFIX as AI_STORAGE_PREFIX,
    checkAlreadyAnalysed as aiCheckAlreadyAnalysed,
    extractParagraphs as aiExtractParagraphs,
    validateContent as aiValidateContent,
    getProtectedIndices as aiGetProtectedIndices,
    getAdjacentToC4LIndices as aiGetAdjacentToC4LIndices,
    getSeparatedIndices as aiGetSeparatedIndices,
    filterSuggestions as aiFilterSuggestions,
} from './ai_guards';

/**
 * Escape a string for use inside a double-quoted HTML attribute.
 *
 * @param {string} value
 * @returns {string}
 */
const escapeAttr = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const getSetup = async() => {
    const [buttonText, buttonImage, applyStr, cancelStr,
           allStr, contextualStr, proceduralStr, evaluativeStr, helperStr, templatesStr, customStr,
           convertToStr, noComponentStr, notConvertibleStr, moreStr, discardStr, discardBtnStr, keepEditingStr,
           overlayOpenStr, overlayRestoreStr, aiButtonStr,
           codeButtonStr,
           precisionButtonStr, regularViewStr,
           deleteComponentStr, moveUpStr, moveDownStr,
           sidebarToggleStr, aiErrorStr,
    ] = await Promise.all([
        getString('buttontitle', component),
        getButtonImage('icon-toolbar', component),
        getString('apply', component),
        getString('cancel', component),
        getString('all', component),
        getString('contextual', component),
        getString('procedural', component),
        getString('evaluative', component),
        getString('helper', component),
        getString('templates', component),
        getString('custom', component),
        getString('convertto', component),
        getString('convert_nocomponent', component),
        getString('convert_notconvertible', component),
        getString('more', component),
        getString('discardconfirm', component),
        getString('discardclose', component),
        getString('keepediting', component),
        getString('overlay_openmask', component),
        getString('overlay_openmask_restore', component),
        getString('ai_button', component),
        getString('code_button', component),
        getString('precision_button', component),
        getString('view_regular', component),
        getString('delete_component', component),
        getString('move_up', component),
        getString('move_down', component),
        getString('sidebar_toggle', component),
        getString('ai_error', component),
    ]);

    const filterLabels = {
        all: allStr,
        contextual: contextualStr,
        procedural: proceduralStr,
        evaluative: evaluativeStr,
        helper: helperStr,
        templates: templatesStr,
        custom: customStr,
    };

    // eslint-disable-next-line complexity
    const buildModal = async(editor) => {
        // The components this editor offers: the declared ones and the admin's custom ones.
        const registry = await loadRegistry(getContextId(editor));
        const catalogue = createCatalogue(registry, buildCustomComponents(getcustomComponents(editor)));

        // Load variant preferences.
        await loadVariantPreferences(catalogue).catch(Notification.exception);

        const userIsStudent = isStudent(editor);
        const allowedComps = getallowedComponents(editor);

        const tinyMCE = await getTinyMCE();
        const html = editor.getContent({format: 'html'}) || '';
        const sidebarHtml = buildSidebar(catalogue, filterLabels, userIsStudent, allowedComps, showDocs(editor));
        const textareaId = 'tiny_c4lauthor_inner_' + Date.now();

        // Copy content_css from outer editor so inner TinyMCE has all plugin styles.
        const outerCss = editor.options.get('content_css');
        let contentCss = [];
        if (Array.isArray(outerCss)) {
            contentCss = outerCss;
        } else if (outerCss) {
            contentCss = [outerCss];
        }

        const modal = await Modal.create({
            title: buttonText,
            body: `<div class="tiny_c4lauthor">
                <div class="tiny_c4lauthor__main-view">
                    <div class="tiny_c4lauthor__body">
                        ${sidebarHtml}
                        <button class="tiny_c4lauthor__sidebar-toggle" title="${escapeAttr(sidebarToggleStr)}" ` +
                            `aria-label="${escapeAttr(sidebarToggleStr)}">` +
                            `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">` +
                            `<path d="M10 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" ` +
                            `stroke-linecap="round" stroke-linejoin="round"/></svg>` +
                        `</button>
                        <div class="tiny_c4lauthor__editor-wrap">
                            <textarea id="${textareaId}" style="visibility:hidden"></textarea>
                        </div>
                    </div>
                </div>
                <div class="tiny_c4lauthor__ai-container" style="display:none"></div>
                <div class="tiny_c4lauthor__code-container" style="display:none">
                    <div class="tiny_c4lauthor__code-view">
                        <div class="tiny_c4lauthor__code-editor-wrap"></div>
                    </div>
                </div>
                <div class="tiny_c4lauthor__precision-container" style="display:none"></div>
                <div class="tiny_c4lauthor__footer">
                    <button class="btn btn-secondary" data-action="cancel">${cancelStr}</button>
                    <button class="btn btn-primary" data-action="apply">${applyStr}</button>
                </div>
            </div>`,
            show: true,
            removeOnClose: true,
            large: true,
        });

        const root = modal.getRoot();

        // Hand the content to the textarea as a value, never as markup: as markup it
        // could close the textarea and run in the page.
        root[0].querySelector('#' + textareaId).value = html;

        // Inject the unified view switcher into the modal header.
        const headerEl = root[0].querySelector('.modal-header');
        const precisionIconSvg =
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>' +
            '<circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/>' +
            '<circle cx="12" cy="12" r="2" fill="currentColor"/>' +
            '<line x1="12" y1="0" x2="12" y2="4" stroke="currentColor" stroke-width="2"/>' +
            '<line x1="12" y1="20" x2="12" y2="24" stroke="currentColor" stroke-width="2"/>' +
            '<line x1="0" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="2"/>' +
            '<line x1="20" y1="12" x2="24" y2="12" stroke="currentColor" stroke-width="2"/>' +
            '</svg>';
        const codeIconSvg =
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm' +
            '5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" fill="currentColor"/></svg>';
        const regularIconSvg =
            '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M7 11.6665H12.25" stroke="currentColor" stroke-width="1.2" ' +
            'stroke-linecap="round" stroke-linejoin="round"/>' +
            '<path d="M9.625 2.04164C9.85706 1.80957 10.1718 1.6792 10.5 1.6792C10.6625 1.6792 10.8234 ' +
            '1.71121 10.9735 1.77339C11.1237 1.83558 11.2601 1.92673 11.375 2.04164C11.4899 2.15654 ' +
            '11.5811 2.29296 11.6432 2.44309C11.7054 2.59322 11.7374 2.75413 11.7374 2.91664C11.7374 ' +
            '3.07914 11.7054 3.24005 11.6432 3.39018C11.5811 3.54032 11.4899 3.67673 11.375 3.79164L4.08333 ' +
            '11.0833L1.75 11.6666L2.33333 9.3333L9.625 2.04164Z" stroke="currentColor" ' +
            'stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        if (headerEl) {
            const closeBtn = headerEl.querySelector('.close, .btn-close, [data-action="hide"]');
            const switcher = document.createElement('div');
            switcher.className = 'tiny_c4lauthor__view-switcher';

            const views = [
                {key: 'regular', label: regularViewStr, icon: regularIconSvg},
                {key: 'precision', label: precisionButtonStr, icon: precisionIconSvg},
                {key: 'code', label: codeButtonStr, icon: codeIconSvg},
            ];

            views.forEach((v, i) => {
                const btn = document.createElement('button');
                btn.className = 'tiny_c4lauthor__view-btn' +
                    (i === 0 ? ' tiny_c4lauthor__view-btn--active' : '');
                btn.type = 'button';
                btn.setAttribute('data-action', 'view-switch');
                btn.setAttribute('data-view', v.key);
                btn.innerHTML = (v.icon ? v.icon + ' ' : '') + v.label;
                switcher.appendChild(btn);
            });

            if (closeBtn) {
                headerEl.insertBefore(switcher, closeBtn);
            } else {
                headerEl.appendChild(switcher);
            }

            // Inject the "AI suggest" button to the right of the switcher (only if AI is enabled).
            if (isAiEnabled(editor)) {
                const aiHeaderBtn = document.createElement('button');
                aiHeaderBtn.className = 'tiny_c4lauthor__ai-header-btn';
                aiHeaderBtn.type = 'button';
                const aiHeaderIconSvg = '<svg class="tiny_c4lauthor__ai-header-icon" width="14" height="14" ' +
                    'viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M7.12 7.23C6.49 6.64 6.01 5.85 5.64 5.08C5.27 5.85 4.78 6.64 4.16 ' +
                    '7.23C3.53 7.83 2.69 8.29 1.88 8.64C2.69 8.99 3.53 9.45 4.16 10.05C4.78 10.65 ' +
                    '5.27 11.44 5.64 12.21C6.01 11.44 6.49 10.65 7.12 10.05C7.75 9.45 8.58 8.99 9.39 ' +
                    '8.64C8.58 8.29 7.75 7.83 7.12 7.23ZM8.13 6.53C8.85 7.15 9.9 7.62 10.89 7.96C11.4 ' +
                    '8.14 11.4 9.15 10.89 9.32C9.9 9.66 8.85 10.13 8.13 10.75L7.99 10.88C7.27 11.56 ' +
                    '6.73 12.63 6.35 13.63C6.17 14.12 5.1 14.12 4.92 13.63C4.56 12.7 4.07 11.69 3.42 ' +
                    '11.01L3.28 10.88C2.57 10.2 1.44 9.68 0.39 9.32C-0.13 9.15-0.13 8.14 0.39 ' +
                    '7.96C1.37 7.62 2.43 7.15 3.15 6.53L3.28 6.41C4 5.72 4.54 4.65 4.92 3.65C5.1 ' +
                    '3.16 6.17 3.16 6.35 3.65C6.73 4.65 7.27 5.72 7.99 6.41L8.13 6.53Z" ' +
                    'fill="currentColor"/>' +
                    '<path fill-rule="evenodd" clip-rule="evenodd" d="M13.55 2.31C13.64 2.35 13.73 ' +
                    '2.38 13.82 2.41C14.05 2.48 14.06 2.9 13.86 3.02L13.82 3.04C13.73 3.07 13.64 ' +
                    '3.1 13.55 3.13C13.09 3.3 12.62 3.54 12.31 3.83C11.93 4.19 11.66 4.76 11.47 ' +
                    '5.27L11.45 5.31C11.32 5.5 10.89 5.49 10.81 5.27C10.64 4.82 10.41 4.33 10.1 ' +
                    '3.98L9.97 3.83C9.59 3.48 9 3.22 8.45 3.04C8.21 2.96 8.21 2.49 8.45 2.41C8.93 ' +
                    '2.25 9.45 2.03 9.82 1.74L9.97 1.61C10.34 1.26 10.62 0.69 10.81 0.17C10.89-0.06 ' +
                    '11.38-0.06 11.47 0.17L11.54 0.37C11.73 0.83 11.98 1.3 12.31 1.61C12.62 1.91 ' +
                    '13.09 2.14 13.55 2.31ZM11.14 2.11C11.23 2.22 11.33 2.34 11.43 2.44C11.54 2.54 ' +
                    '11.66 2.63 11.78 2.72C11.66 2.81 11.54 2.9 11.43 3.01C11.33 3.11 11.23 3.22 ' +
                    '11.14 3.34C11.04 3.22 10.95 3.11 10.84 3.01C10.73 2.9 10.61 2.81 10.49 ' +
                    '2.72C10.61 2.63 10.73 2.54 10.84 2.44C10.95 2.34 11.04 2.22 11.14 2.11Z" ' +
                    'fill="currentColor"/></svg>';
                aiHeaderBtn.innerHTML = aiHeaderIconSvg + ' ' + aiButtonStr;
                aiHeaderBtn.setAttribute('data-action', 'ai-open');
                if (closeBtn) {
                    headerEl.insertBefore(aiHeaderBtn, closeBtn);
                } else {
                    headerEl.appendChild(aiHeaderBtn);
                }
            }
        }


        // Collect namespaced plugin options from the outer editor so inner plugins get their config.
        const outerPlugins = editor.options.get('plugins') || [];
        const innerPlugins = outerPlugins.filter(
            (p) => p !== 'tiny_c4lauthor/plugin' && p !== 'tiny_c4l/plugin' && p !== 'tiny_html/plugin'
        );

        // We'll copy plugin option values from the outer editor by intercepting
        // option registration on the inner editor (see setup callback below).

        // Copy Moodle core options from the outer editor for the inner editor.
        const moodleOptions = {
            context: getContextId(editor),
            filepicker: getFilepickers(editor) || {},
            draftitemid: getDraftItemId(editor) || 0,
            currentLanguage: getCurrentLanguage(editor) || document.querySelector('html').lang || 'en',
            language: getMoodleLang(editor) || {},
            placeholderSelectors: [],
        };

        // Colour mode. Repeated here because the inner editor is not initialised by
        // editor_tiny, so core's own handling does not reach it.
        const colourMode = document.documentElement.getAttribute('data-bs-theme') ?? 'light';

        // Initialize inner TinyMCE instance.
        let innerEditor = null;
        /* eslint-disable camelcase */
        const editors = await tinyMCE.init({
            selector: '#' + textareaId,
            license_key: 'gpl',
            plugins: innerPlugins,
            skin: colourMode === 'dark' ? 'oxide-dark' : 'oxide',
            toolbar: editor.options.get('toolbar').map((section) => ({
                name: section.name,
                items: section.items.filter((b) => b !== buttonName),
            })),
            menubar: editor.options.get('menubar'),
            quickbars_insert_toolbar: '',
            quickbars_selection_toolbar:
                (editor.options.get('quickbars_selection_toolbar') || 'bold italic | h3 h4 h5 h6 blockquote')
                + ' | ' + quickInsertMenuName + ' ' + convertMenuName,
            block_formats:
                editor.options.get('block_formats'),
            xss_sanitization: false,
            ui_mode: 'split',
            convert_urls: false,
            entity_encoding: 'raw',
            sandbox_iframes: false,
            extended_valid_elements:
                editor.options.get('extended_valid_elements'),
            table_header_type: 'sectionCells',
            browser_spellcheck: true,
            a11y_advanced_options: true,
            language: document.querySelector('html').lang,
            statusbar: false,
            promotion: false,
            branding: false,
            body_class: 'tiny_c4lauthor-inner-body',
            height: '100%',
            content_css: contentCss,
            content_style: brandColourRule(),
            setup: (ed) => {
                // Register Moodle core options so plugins can access contextid, filepickers, etc.
                registerMoodleOptions(ed, moodleOptions);

                // Intercept option registration: whenever a plugin registers an option
                // on the inner editor, copy the value from the outer editor automatically.
                const origRegister = ed.options.register.bind(ed.options);
                ed.options.register = (name, spec) => {
                    origRegister(name, spec);
                    if (editor.options.isRegistered(name)) {
                        const outerVal = editor.options.get(name);
                        if (outerVal !== undefined && outerVal !== null) {
                            ed.options.set(name, outerVal);
                        }
                    }
                };

                // Register component icons and quick-insert menu on the inner editor.
                registerComponentIcons(ed, catalogue);
                ed.ui.registry.addIcon(buttonIcon, buttonImage.html);
                ed.ui.registry.addButton(quickInsertMenuName, {
                    icon: buttonIcon,
                    tooltip: buttonText,
                    onAction: () => {
                        // Save selection before showing the dropdown — clicking
                        // outside the iframe will lose it.
                        const savedSel = ed.selection.getContent({format: 'text'});
                        const bookmark = ed.selection.getBookmark(2, true);
                        const items = [];
                        const typeOrder = [
                            'contextual', 'procedural', 'evaluative', 'helper', 'templates', 'custom'
                        ];
                        const allIcons = ed.ui.registry.getAll().icons;
                        typeOrder.forEach((type) => {
                            catalogue.components.filter((c) => c.category === type).forEach((comp) => {
                                const label = comp.label;
                                const iconKey = 'c4l-' + comp.name;
                                items.push({
                                    label,
                                    iconHtml: allIcons[iconKey] || '',
                                    onAction: async() => {
                                        ed.selection.moveToBookmark(bookmark);
                                        const html = await buildComponentHtml(comp, savedSel, catalogue, ed);
                                        if (html) {
                                            ed.execCommand('mceInsertContent', false, html);
                                        }
                                        ed.focus();
                                    },
                                });
                            });
                        });
                        showCustomDropdown(ed, buttonText, items);
                    },
                });

                // Register "Convert to" menu on inner editor.
                registerConvertMenu(ed, catalogue, convertToStr, noComponentStr, notConvertibleStr);

                ed.on('init', () => {
                    innerEditor = ed;

                    // Add dropdown chevrons to our quickbar buttons.
                    const chevronHtml = '<div class="tox-tbtn__select-chevron">' +
                        '<svg width="10" height="10" focusable="false">' +
                        '<path d="M8.7 2.2c.3-.3.8-.3 1 0 .4.4.4.9 0 ' +
                        '1.2L5.7 7.8c-.3.3-.9.3-1.2 0L.2 3.4a.8.8 0 ' +
                        '0 1 0-1.2c.3-.3.8-.3 1.1 0L5 6l3.7-3.8Z" ' +
                        'fill-rule="nonzero"></path></svg></div>';
                    const addChevrons = () => {
                        const wrap = (ed.getContainer() || document)
                            .closest('.tiny_c4lauthor') || document;
                        wrap.querySelectorAll(
                            '.tox-tinymce-aux [data-mce-name="' +
                            quickInsertMenuName + '"], ' +
                            '.tox-tinymce-aux [data-mce-name="' +
                            convertMenuName + '"]'
                        ).forEach((btn) => {
                            if (!btn.querySelector(
                                '.tox-tbtn__select-chevron'
                            )) {
                                btn.insertAdjacentHTML(
                                    'beforeend', chevronHtml
                                );
                                btn.style.marginRight = '6px';
                            }
                        });
                    };
                    const edWrap = (ed.getContainer() || document)
                        .closest('.tiny_c4lauthor__editor-wrap');
                    if (edWrap) {
                        const chObs = new MutationObserver(addChevrons);
                        chObs.observe(edWrap, {
                            childList: true, subtree: true,
                        });
                        ed.on('remove', () => chObs.disconnect());
                    }
                });
            },
        });
        /* eslint-enable camelcase */

        if (!innerEditor && editors && editors.length) {
            innerEditor = editors[0];
        }

        // Container, sink and content document: three separate subtrees, none of which
        // inherits the attribute from the page.
        const innerContainer = innerEditor.getContainer();
        if (innerContainer) {
            innerContainer.setAttribute('data-bs-theme', colourMode);
        }
        document.querySelectorAll('.tox-silver-sink').forEach((sink) => {
            sink.setAttribute('data-bs-theme', colourMode);
        });
        const innerDocument = innerEditor.getDoc();
        if (innerDocument) {
            innerDocument.documentElement.setAttribute('data-bs-theme', colourMode);
        }

        // Set up contextual variant toolbar.
        setupVariantToolbar(innerEditor, catalogue, deleteComponentStr, moveUpStr, moveDownStr);

        // Tabs and carousel controls.
        attachEditorWidgets(innerEditor).catch(Notification.exception);

        // When pressing Enter at the end of a C4L component, exit the
        // component and place the cursor in a new paragraph below it.
        // Third param `true` = prepend, so this runs before TinyMCE's own handler.
        // eslint-disable-next-line complexity
        innerEditor.on('keydown', (e) => {
            if (e.keyCode !== 13 || e.shiftKey || e.ctrlKey || e.metaKey) {
                return;
            }
            const rng = innerEditor.selection.getRng();
            if (!rng || !rng.collapsed) {
                return;
            }
            // Walk up to find the c4lv-* wrapper.
            let compEl = rng.endContainer;
            const body = innerEditor.getBody();
            while (compEl && compEl !== body) {
                if (compEl.nodeType === 1 && compEl.className &&
                    catalogue.nameOf(compEl)) {
                    break;
                }
                compEl = compEl.parentNode;
            }
            if (!compEl || compEl === body) {
                return;
            }
            // Check if cursor is at the very end of the component.
            let node = rng.endContainer;
            const offset = rng.endOffset;
            if (node.nodeType === 3 && offset < node.textContent.length) {
                return;
            }
            // Walk forward from cursor — any non-empty content means not at end.
            let current = node.nodeType === 3 ? node : (node.childNodes[offset] || null);
            let atEnd = false;
            while (current) {
                if (current.nextSibling) {
                    const next = current.nextSibling;
                    if (next.textContent && next.textContent.trim().length > 0) {
                        return;
                    }
                    current = next;
                } else {
                    current = current.parentNode;
                    if (current === compEl) {
                        atEnd = true;
                        break;
                    }
                }
            }
            if (!atEnd) {
                return;
            }
            // Prevent TinyMCE from inserting a newline inside the component.
            e.preventDefault();
            e.stopImmediatePropagation();
            // Insert a new paragraph after the component (or its wrapper).
            const iframeDoc = innerEditor.getDoc();
            const newP = iframeDoc.createElement('p');
            newP.innerHTML = '<br>';
            const wrapper = compEl.closest('.c4l-inline-group, .c4l-display-left');
            let insertAfter = wrapper || compEl;
            if (insertAfter.nextSibling &&
                insertAfter.nextSibling.nodeType === 1 &&
                insertAfter.nextSibling.classList &&
                insertAfter.nextSibling.classList.contains('c4l-spacer')) {
                insertAfter = insertAfter.nextSibling;
            }
            insertAfter.parentNode.insertBefore(newP, insertAfter.nextSibling);
            // Move cursor into the new paragraph.
            innerEditor.selection.setCursorLocation(newP, 0);
        }, true);

        // View swap — all views share the modal body.
        const mainView = root[0].querySelector('.tiny_c4lauthor__main-view');
        const aiContainer = root[0].querySelector('.tiny_c4lauthor__ai-container');
        const codeContainer = root[0].querySelector('.tiny_c4lauthor__code-container');
        const precisionContainer = root[0].querySelector('.tiny_c4lauthor__precision-container');
        let aiController = null;
        let aiCachedHtml = null;
        let aiCachedResult = null;
        let precisionController = null;
        let cmInstance = null;
        let currentView = 'regular';

        const updateSwitcherActive = (viewName) => {
            const btns = root[0].querySelectorAll('[data-action="view-switch"]');
            btns.forEach((btn) => {
                btn.classList.toggle('tiny_c4lauthor__view-btn--active',
                    btn.getAttribute('data-view') === viewName);
            });
        };

        const applyCurrentView = () => {
            if (currentView === 'code' && cmInstance && innerEditor) {
                const newHtml = cmInstance.state.doc.toString();
                innerEditor.undoManager.transact(() => {
                    innerEditor.setContent(newHtml);
                });
            }
            // Precision: edits are applied reactively to the inner editor.
        };

        const destroyCurrentView = () => {
            if (currentView === 'precision' && precisionController) {
                precisionController.destroy();
                precisionController = null;
            }
            if (currentView === 'code' && cmInstance) {
                cmInstance.destroy();
                cmInstance = null;
            }
        };

        /**
         * Get the scroll ratio (0–1) from the current view's scroll container.
         */
        const getScrollRatio = () => {
            let el = null;
            if (currentView === 'regular' && innerEditor) {
                const iDoc = innerEditor.getDoc();
                el = iDoc ? iDoc.documentElement : null;
            } else if (currentView === 'code' && cmInstance) {
                el = codeContainer.querySelector('.cm-scroller');
            } else if (currentView === 'precision') {
                const iframe = precisionContainer.querySelector('.tiny_c4lauthor__precision-iframe');
                if (iframe && iframe.contentDocument) {
                    el = iframe.contentDocument.documentElement;
                }
            }
            if (!el || el.scrollHeight <= el.clientHeight) {
                return 0;
            }
            return el.scrollTop / (el.scrollHeight - el.clientHeight);
        };

        /**
         * Set the scroll ratio (0–1) on a view's scroll container.
         * Deferred with rAF so the DOM has had time to layout.
         *
         * @param {string} viewName
         * @param {number} ratio
         */
        const setScrollRatio = (viewName, ratio) => {
            if (ratio <= 0) {
                return;
            }
            const apply = () => {
                let el = null;
                if (viewName === 'regular' && innerEditor) {
                    const iDoc = innerEditor.getDoc();
                    el = iDoc ? iDoc.documentElement : null;
                } else if (viewName === 'code') {
                    el = codeContainer.querySelector('.cm-scroller');
                } else if (viewName === 'precision') {
                    const iframe = precisionContainer.querySelector('.tiny_c4lauthor__precision-iframe');
                    if (iframe && iframe.contentDocument) {
                        el = iframe.contentDocument.documentElement;
                    }
                }
                if (el && el.scrollHeight > el.clientHeight) {
                    el.scrollTo({top: ratio * (el.scrollHeight - el.clientHeight), behavior: 'instant'});
                }
            };
            // Double-rAF to ensure layout is complete after view switch.
            requestAnimationFrame(() => requestAnimationFrame(apply));
        };

        // AI header button + view switcher references (needed by switchView and AI handlers).
        const aiHeaderBtnEl = root[0].querySelector('[data-action="ai-open"]');
        const viewSwitcherEl = root[0].querySelector('.tiny_c4lauthor__view-switcher');
        const mainFooter = root[0].querySelector('.tiny_c4lauthor__footer');

        const disableAiBtn = () => {
            if (aiHeaderBtnEl) {
                aiHeaderBtnEl.disabled = true;
                aiHeaderBtnEl.style.opacity = '0.4';
                aiHeaderBtnEl.style.pointerEvents = 'none';
            }
        };
        const enableAiBtn = () => {
            if (aiHeaderBtnEl) {
                aiHeaderBtnEl.disabled = false;
                aiHeaderBtnEl.style.opacity = '';
                aiHeaderBtnEl.style.pointerEvents = '';
            }
        };

        const hideAllViews = () => {
            if (mainView) {
                mainView.style.display = 'none';
            }
            if (aiContainer) {
                aiContainer.style.display = 'none';
            }
            if (codeContainer) {
                codeContainer.style.display = 'none';
            }
            if (precisionContainer) {
                precisionContainer.style.display = 'none';
            }
        };

        const buildCodeView = (scrollRatio) => {
            if (!innerEditor || !codeContainer) {
                return;
            }
            codeContainer.style.display = 'flex';
            codeContainer.style.flex = '1';
            codeContainer.style.minHeight = '0';
            codeContainer.style.flexDirection = 'column';

            const wrap = codeContainer.querySelector('.tiny_c4lauthor__code-editor-wrap');
            const currentHtml = innerEditor.getContent({format: 'html'}) || '';
            wrap.innerHTML = '';

            const state = CMState.create({
                doc: currentHtml,
                extensions: [
                    cmBasicSetup,
                    CMState.tabSize.of(2),
                    ...Object.entries(cmLang).map(
                        ([, langPlugin]) => langPlugin()
                    ),
                    CMView.lineWrapping,
                    CMView.theme({
                        '&': {height: '100%'},
                        '.cm-scroller': {overflow: 'auto'},
                    }),
                ],
            });
            cmInstance = new CMView({state, parent: wrap});
            cmInstance.focus();
            setScrollRatio('code', scrollRatio);
        };

        const buildPrecisionView = async(scrollRatio) => {
            if (!innerEditor || !precisionContainer) {
                return;
            }
            precisionContainer.style.display = 'flex';
            precisionContainer.style.flex = '1';
            precisionContainer.style.minHeight = '0';
            precisionContainer.style.flexDirection = 'column';

            precisionController = await mountPreciseView(precisionContainer, {
                getEditorContent: () => innerEditor.getContent({format: 'html'}) || '',
                setEditorContent: (html) => {
                    innerEditor.undoManager.transact(() => {
                        innerEditor.setContent(html);
                    });
                },
                getContentCss: () => contentCss,
            }, catalogue);

            // Precision iframe loads async — wait for it before restoring scroll.
            const pIframe = precisionContainer.querySelector('.tiny_c4lauthor__precision-iframe');
            if (pIframe && scrollRatio > 0) {
                pIframe.addEventListener('load', () => {
                    setScrollRatio('precision', scrollRatio);
                }, {once: true});
            }
        };

        const switchView = async(targetView) => {
            if (targetView === currentView) {
                return;
            }

            const scrollRatio = getScrollRatio();
            applyCurrentView();
            destroyCurrentView();
            hideAllViews();

            currentView = targetView;
            updateSwitcherActive(targetView);

            if (targetView === 'regular') {
                if (mainView) {
                    mainView.style.display = '';
                }
                setScrollRatio('regular', scrollRatio);
            } else if (targetView === 'code') {
                buildCodeView(scrollRatio);
            } else if (targetView === 'precision') {
                await buildPrecisionView(scrollRatio);
            }
        };

        // View switcher click handler.
        root.on('click', '[data-action="view-switch"]', (e) => {
            e.preventDefault();
            const target = e.currentTarget.getAttribute('data-view');
            switchView(target);
        });

        // AI Suggest — separate from the view switcher, with its own footer.
        const showMainViewFromAi = async() => {
            if (aiController) {
                aiController.destroy();
                aiController = null;
            }
            if (aiContainer) {
                aiContainer.style.display = 'none';
            }
            // Rebuild whichever view was active before AI was opened,
            // so any AI-applied changes are reflected.
            if (currentView === 'regular' && mainView) {
                mainView.style.display = '';
            } else if (currentView === 'code') {
                buildCodeView(0);
            } else if (currentView === 'precision') {
                await buildPrecisionView(0);
            }
            if (viewSwitcherEl) {
                viewSwitcherEl.style.display = '';
            }
            if (mainFooter) {
                mainFooter.style.display = '';
            }
            enableAiBtn();
        };

        /**
         * Make sure the user has accepted the AI policy, asking them first if needed.
         *
         * After acceptance the AI view opens once the server has stored it, because the
         * suggest service checks the policy too.
         *
         * @returns {Promise<boolean>} true if the policy is accepted now
         */
        const ensureAiPolicyAccepted = async() => {
            const userId = M.cfg.userId;
            AiPolicy.preconfigurePolicyState(userId, isAiPolicyAgreed(editor));
            if (await AiPolicy.getPolicyStatus(userId)) {
                return true;
            }
            const policyModal = await AiPolicyModal.create();
            policyModal.getModal().on(CustomEvents.events.activate, policyModal.getActionSelector('save'), async() => {
                for (let attempt = 0; attempt < 10; attempt++) {
                    const result = await fetchAiPolicyStatus(userId);
                    if (result.status) {
                        openAiView();
                        return;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 300));
                }
            });
            return false;
        };

        const openAiView = async() => {
            if (!innerEditor || !aiContainer) {
                return;
            }
            // Nothing is sent to the AI provider before the user has accepted the site's AI policy.
            if (!await ensureAiPolicyAccepted()) {
                return;
            }
            // Apply, destroy & hide current view — we'll rebuild on return.
            applyCurrentView();
            destroyCurrentView();
            hideAllViews();
            disableAiBtn();
            if (viewSwitcherEl) {
                viewSwitcherEl.style.display = 'none';
            }
            if (mainFooter) {
                mainFooter.style.display = 'none';
            }

            const loTitle = await getString('ai_learning_outcomes_title', component);
            const initialHtml = innerEditor.getContent({format: 'html'}) || '';
            let activeHtml = initialHtml;
            const storageKey = AI_STORAGE_PREFIX + getContextId(editor) + '_' + editor.id;
            let validation = aiValidateContent(activeHtml);

            aiContainer.style.display = 'flex';
            aiContainer.style.flex = '1';
            aiContainer.style.minHeight = '0';
            aiContainer.style.flexDirection = 'column';

            const runAnalyse = async() => {
                if (!aiController) {
                    return;
                }
                if (aiCheckAlreadyAnalysed(storageKey, activeHtml)) {
                    const msg = await getString('ai_guard_already_analysed', component);
                    await aiController.setSuggestions([], [msg], {showReanalyse: true});
                    return;
                }
                if (!validation.canAnalyse) {
                    const key = validation.reason === 'too_short' ? 'ai_guard_too_short' : 'ai_guard_saturated';
                    const msg = await getString(key, component);
                    await aiController.setSuggestions([], [msg]);
                    return;
                }
                if (aiCachedResult && aiCachedHtml === activeHtml) {
                    await aiController.setSuggestions(
                        aiCachedResult.suggestions || [],
                        aiCachedResult.warnings || []
                    );
                    return;
                }
                const contextid = getContextId(editor);
                if (!contextid) {
                    window.console.error('tiny_c4lauthor: missing contextid');
                    return;
                }
                const lang = getCurrentLanguage(editor) || document.querySelector('html').lang || 'en';
                const paragraphs = aiExtractParagraphs(activeHtml);
                let result;
                try {
                    result = await callSuggest({contextid, paragraphs, lang});
                } catch (e) {
                    Notification.exception(e);
                    await aiController.setSuggestions([], [aiErrorStr]);
                    return;
                }
                const protectedIdx = aiGetProtectedIndices(activeHtml);
                const adjacent = aiGetAdjacentToC4LIndices(activeHtml);
                const separated = aiGetSeparatedIndices(activeHtml);
                const aiRates = getAiRates(editor);
                const filtered = aiFilterSuggestions(
                    result.suggestions || [],
                    validation.existingComponents,
                    validation.freeParagraphs,
                    adjacent,
                    separated,
                    aiRates
                ).filter((s) => !protectedIdx.has(s.targetindex));
                aiCachedHtml = activeHtml;
                aiCachedResult = {...result, suggestions: filtered};
                await aiController.setSuggestions(filtered, result.warnings || []);
            };

            aiController = await mountAiView(aiContainer, {
                getHtmlForMode: () => activeHtml,
                onAnalyse: runAnalyse,
                onReanalyse: () => {
                    activeHtml = aiStripAllC4L(initialHtml);
                    validation = aiValidateContent(activeHtml);
                    aiCachedHtml = null;
                    aiCachedResult = null;
                    try {
                        localStorage.removeItem(storageKey);
                    } catch (e) {
                        // Ignore.
                    }
                },
                onBack: () => {
                    showMainViewFromAi();
                },
                onApply: (toWrap, toUnwrap) => {
                    const newHtml = aiApplyChanges(activeHtml, toWrap, toUnwrap, loTitle);
                    innerEditor.undoManager.transact(() => {
                        innerEditor.setContent(newHtml);
                    });
                    try {
                        const postHtml = innerEditor.getContent({format: 'html'}) || '';
                        localStorage.setItem(storageKey, aiContentFingerprint(postHtml));
                    } catch (e) {
                        // Ignore.
                    }
                    aiCachedHtml = null;
                    aiCachedResult = null;
                    showMainViewFromAi();
                },
            });

            await aiController.runInitialAnalyse();
        };

        // AI Suggest button click.
        root.on('click', '[data-action="ai-open"]', (e) => {
            e.preventDefault();
            openAiView();
        });

        // Sidebar collapse/expand — toggle via the permanent 20px strip.
        const bodyEl = root[0].querySelector('.tiny_c4lauthor__body');
        const sidebarToggle = root[0].querySelector('.tiny_c4lauthor__sidebar-toggle');

        // Toggle the inner TinyMCE body's wide class to match collapsed state.
        const setInnerBodyWide = (wide) => {
            if (innerEditor && innerEditor.getBody) {
                const innerBody = innerEditor.getBody();
                if (innerBody) {
                    innerBody.classList.toggle('tiny_c4lauthor-inner-body--wide', wide);
                }
            }
        };

        // Restore collapsed state.
        if (localStorage.getItem('tiny_c4lauthor_sidebar_collapsed') === '1') {
            bodyEl.classList.add('tiny_c4lauthor__body--sidebar-collapsed');
            setInnerBodyWide(true);
        }

        // Toggle strip click.
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', (e) => {
                e.preventDefault();
                const collapsed = bodyEl.classList.toggle('tiny_c4lauthor__body--sidebar-collapsed');
                setInnerBodyWide(collapsed);
                localStorage.setItem('tiny_c4lauthor_sidebar_collapsed', collapsed ? '1' : '0');
            });
        }

        // Initialize Bootstrap tooltips on sidebar component buttons (if enabled).
        if (showDocs(editor)) {
            root.find('[data-c4l-tooltip]').each(function() {
                $(this).tooltip({
                    html: true,
                    title: this.getAttribute('data-c4l-tooltip'),
                    placement: 'right',
                    trigger: 'hover',
                    delay: {show: 2000, hide: 0},
                    container: 'body',
                });
            });
        }

        // Collapse overflowing filter tabs behind a "More" button.
        const tabsContainer = root[0].querySelector('.tiny_c4lauthor__tabs');
        if (tabsContainer) {
            setupTabOverflow(tabsContainer, moreStr, root);
        }

        // Filter tabs.
        root.on('click', '.tiny_c4lauthor__tab', (e) => {
            e.preventDefault();
            const filterType = e.currentTarget.dataset.filter;

            root.find('.tiny_c4lauthor__tab').removeClass('tiny_c4lauthor__tab--active');
            e.currentTarget.classList.add('tiny_c4lauthor__tab--active');

            root.find('.tiny_c4lauthor__group').each(function() {
                if (filterType === 'all' || this.dataset.group === filterType) {
                    this.style.display = '';
                } else {
                    this.style.display = 'none';
                }
            });
        });

        // Component button click — insert HTML into inner TinyMCE.
        root.on('click', '.tiny_c4lauthor__comp-btn', async(e) => {
            e.preventDefault();
            if (!innerEditor) {
                return;
            }
            const compName = e.currentTarget.dataset.comp;
            const comp = catalogue.find(compName);
            if (!comp) {
                return;
            }

            const pending = new Pending('tiny_c4lauthor/insertComponent');
            const selectedText = innerEditor.selection.getContent({format: 'text'});
            const htmlPromise = buildComponentHtml(comp, selectedText, catalogue, innerEditor);
            if (comp.inserter) {
                // An inserter may wait for the user, who would keep the page pending.
                pending.resolve();
            }
            const compHtml = await htmlPromise;
            if (compHtml) {
                innerEditor.insertContent(compHtml);
            }
            innerEditor.focus();
            pending.resolve();
        });

        // Destroy inner editor on modal close.
        const destroyInner = () => {
            if (innerEditor) {
                try {
                    innerEditor.destroy();
                } catch (_) {
                    // Ignore errors during teardown.
                }
                innerEditor = null;
            }
            // Save variant preferences on close.
            saveVariantPreferences(catalogue);
            // Clear the open flag so the modal can be opened again.
            const container = editor.getContainer();
            if (container) {
                container.dataset.c4lauthorOpen = 'false';
            }
        };

        // Ask confirmation before discarding, using a custom Moodle modal.
        let confirmOpen = false;
        const confirmAndClose = async() => {
            if (confirmOpen) {
                return;
            }
            confirmOpen = true;
            const confirmModal = await Modal.create({
                title: buttonText,
                body: `<p>${discardStr}</p>` +
                    `<div class="d-flex justify-content-end gap-2 mt-3">` +
                    `<button class="btn btn-outline-danger btn-sm" data-action="discard">${discardBtnStr}</button>` +
                    `<button class="btn btn-primary btn-sm" data-action="goback">${keepEditingStr}</button>` +
                    `</div>`,
                show: true,
                removeOnClose: true,
            });
            const confirmRoot = confirmModal.getRoot();
            // Centre vertically.
            confirmRoot.find('.modal-dialog').addClass('modal-dialog-centered');
            // Hide default footer.
            confirmModal.hideFooter();

            confirmRoot.on('click', '[data-action="discard"]', () => {
                confirmOpen = false;
                confirmModal.hide();
                destroyInner();
                modal.hide();
            });
            confirmRoot.on('click', '[data-action="goback"]', () => {
                confirmOpen = false;
                confirmModal.hide();
            });
            confirmRoot.on('modal:hidden', () => {
                confirmOpen = false;
            });
        };

        // Intercept backdrop (outside) click — Moodle fires modal:outsideClick.
        root.on('modal:outsideClick', (e) => {
            e.preventDefault();
            confirmAndClose();
        });

        // Cancel button — close directly without confirmation.
        root.on('click', '[data-action="cancel"]', (e) => {
            e.preventDefault();
            destroyInner();
            modal.hide();
        });

        // Apply button — no confirmation needed.
        root.on('click', '[data-action="apply"]', (e) => {
            e.preventDefault();
            if (innerEditor) {
                const newHtml = innerEditor.getContent();
                editor.undoManager.transact(() => {
                    editor.setContent(newHtml);
                });
            }
            destroyInner();
            modal.hide();
        });

        // X button — intercept in capture phase before Moodle's own handler
        // can close the modal via CustomEvents.activate on [data-action="hide"].
        root[0].addEventListener('click', (e) => {
            const hideBtn = e.target.closest('[data-action="hide"], [data-action="closegrader"], .btn-close');
            if (hideBtn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                confirmAndClose();
            }
        }, true);

        // Intercept Escape key on the modal element.
        root[0].addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // If AI view is visible, go back to whichever view was active before.
                if (aiContainer && aiContainer.style.display !== 'none') {
                    e.preventDefault();
                    e.stopPropagation();
                    showMainViewFromAi();
                    return;
                }
                // If a non-regular switcher view is active, go back to regular.
                if (currentView !== 'regular') {
                    e.preventDefault();
                    e.stopPropagation();
                    switchView('regular');
                    return;
                }
                // If a TinyMCE dialog is open, let it handle Escape.
                if (document.querySelector('.tox-dialog')) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                confirmAndClose();
            }
        }, true);

        // Allow focus inside TinyMCE dialogs (e.g. source code textarea).
        // Moodle's modal focus trap can steal focus from the dialog;
        // this handler re-focuses the clicked element inside .tox-dialog.
        root[0].addEventListener('mousedown', (e) => {
            const dialog = e.target.closest('.tox-dialog');
            if (dialog) {
                e.stopPropagation();
            }
        }, true);

        // Clean up if modal is closed via other means.
        root.on('modal:hidden', destroyInner);
    };

    // Track the modal set-up as pending JS, so Behat waits until it is ready.
    const openModal = async(editor) => {
        const pending = new Pending('tiny_c4lauthor/openModal');
        try {
            await buildModal(editor);
        } finally {
            pending.resolve();
        }
    };

    return (editor) => {
        if (!isC4LVisible(editor)) {
            return;
        }

        editor.ui.registry.addIcon(buttonIcon, buttonImage.html);

        editor.ui.registry.addButton(buttonName, {
            icon: buttonIcon,
            tooltip: buttonText,
            onAction: () => openModal(editor),
        });

        // Stylesheets other plugins add for their components.
        const editorCss = getEditorCss(editor);
        if (editorCss.length) {
            const contentCss = [editor.options.get('content_css') ?? []].flat();
            editor.options.set('content_css', [...contentCss, ...editorCss]);
        }

        // Inject the site's brand colour and the custom preview CSS into the outer editor.
        const contentStyle = [brandColourRule(), getpreviewCSS(editor)].filter(Boolean).join('\n');
        if (contentStyle) {
            editor.options.set('content_style', contentStyle);
        }

        // Click-to-open: replace the editor UI with a clickable mask that opens the modal.
        if (isShowOverlay(editor)) {
            editor.on('init', () => {
                const container = editor.getContainer();

                // Skip if this is the inner editor inside our modal.
                if (container.closest('.tiny_c4lauthor')) {
                    return;
                }

                const triggerOpen = (e) => {
                    if (container.dataset.c4lauthorOpen === 'true') {
                        return;
                    }
                    if (e && e.stopPropagation) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    container.dataset.c4lauthorOpen = 'true';
                    openModal(editor);
                };

                container.classList.add('c4lauthor-overlay');

                // Create the overlay mask covering the entire editor container.
                const mask = document.createElement('div');
                mask.className = 'c4lauthor-mask';

                // Expand logo icon (center) — inline SVG.
                const expandLogoHtml = '<svg class="c4lauthor-mask__icon" width="50" height="50" ' +
                    'viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M23.38 40.87V28.23L34.25 33.6V45.98L23.38 40.87Z" fill="currentColor" opacity="0.2"/>' +
                    '<path d="M34.63 33.35L23.5 28.23L34.63 22.98L45 28.23L34.63 33.35Z" ' +
                    'fill="currentColor" opacity="0.1"/>' +
                    '<path d="M44.6 36.01L34.95 40.63V45.02L43.12 41.1C44.03 40.67 44.6 39.76 44.6 ' +
                    '38.76V36.01ZM29.08 42.87L33.55 45.02V40.63L29.08 38.48V42.87ZM23.9 34.45L33.55 ' +
                    '39.07V33.91L24.09 29.38S24 29.59 23.96 29.8C23.91 30 23.9 30.24 23.9 ' +
                    '30.24V34.45ZM34.95 33.91V39.07L39.43 36.93V31.76L34.95 33.91ZM40.83 31.09V36.26L44.6 ' +
                    '34.45V30C44.6 30 44.59 29.84 44.54 29.66C44.5 29.48 44.44 29.36 44.44 29.36L40.83 ' +
                    '31.09ZM24.97 28.25L34.25 32.69L38.51 30.65L29.18 26.16L25.31 28.04S25.21 28.09 25.15 ' +
                    '28.13C25.08 28.17 24.97 28.25 24.97 28.25ZM35.38 24.26C34.67 23.91 33.83 23.91 33.12 ' +
                    '24.26L30.79 25.38L40.13 29.88L43.54 28.24L43.46 28.18L43.23 28.06L35.38 ' +
                    '24.26ZM23.9 38.76C23.9 39.76 24.48 40.67 25.38 41.1L27.68 42.2V37.81L23.9 ' +
                    '36.01V38.76ZM45.99 39.05C45.89 40.47 45.03 41.74 43.73 42.37L34.25 46.9L24.77 ' +
                    '42.37C23.47 41.74 22.61 40.47 22.51 39.05L22.5 38.76V30.39S22.44 29.29 23.11 ' +
                    '28.22C23.78 27.16 25.31 26.48 25.31 26.48L32.51 23C33.61 22.46 34.89 22.46 35.99 ' +
                    '23L44.13 26.94C45.22 27.61 45.9 28.68 46 29.86V38.76L45.99 39.05Z" fill="currentColor"/>' +
                    '<path d="M16.86 51.58C17.15 51.29 17.63 51.29 17.92 51.58C18.21 51.87 18.21 52.35 17.92 ' +
                    '52.64L2.56 68H14.86C15.27 68 15.61 68.34 15.61 68.75C15.61 69.16 15.27 69.5 14.86 ' +
                    '69.5H0V54.75C0 54.34 0.34 54 0.75 54C1.16 54 1.5 54.34 1.5 54.75V66.94L16.86 ' +
                    '51.58ZM51.58 51.58C51.87 51.29 52.35 51.29 52.64 51.58L68 66.94V54.75C68 54.34 68.34 ' +
                    '54 68.75 54C69.16 54 69.5 54.34 69.5 54.75V69.5H54.75C54.34 69.5 54 69.16 54 68.75C54 ' +
                    '68.34 54.34 68 54.75 68H66.94L51.58 52.64C51.29 52.35 51.29 51.87 51.58 51.58ZM0 ' +
                    '14.75V0H14.86C15.27 0 15.61 0.34 15.61 0.75C15.61 1.16 15.27 1.5 14.86 1.5H2.56L17.92 ' +
                    '16.86C18.21 17.15 18.21 17.63 17.92 17.92C17.63 18.21 17.15 18.21 16.86 17.92L1.5 ' +
                    '2.56V14.75C1.5 15.16 1.16 15.5 0.75 15.5C0.34 15.5 0 15.16 0 14.75ZM69.5 14.75C69.5 ' +
                    '15.16 69.16 15.5 68.75 15.5C68.34 15.5 68 15.16 68 14.75V2.56L52.64 17.92C52.35 18.21 ' +
                    '51.87 18.21 51.58 17.92C51.29 17.63 51.29 17.15 51.58 16.86L66.94 1.5H54.75C54.34 1.5 ' +
                    '54 1.16 54 0.75C54 0.34 54.34 0 54.75 0H69.5V14.75Z" fill="currentColor"/></svg>';

                mask.innerHTML =
                    '<button class="c4lauthor-mask__close">' +
                        '<span>' + overlayRestoreStr + '</span>' +
                    '</button>' +
                    '<div class="c4lauthor-mask__center">' +
                        expandLogoHtml +

                        '<span class="c4lauthor-mask__text">' + overlayOpenStr + '</span>' +
                    '</div>';

                if (getComputedStyle(container).position === 'static') {
                    container.style.position = 'relative';
                }
                container.appendChild(mask);

                // Whole mask is clickable → open C4L Author editor modal.
                mask.addEventListener('click', triggerOpen);

                // Close button → hide mask, reveal original editor (stop propagation).
                mask.querySelector('.c4lauthor-mask__close').addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    mask.classList.add('c4lauthor-mask--hidden');
                });
            });
        }
    };
};
