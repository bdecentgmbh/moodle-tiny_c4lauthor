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
 * The toolbar shown over a component in the editor: delete, move and variants.
 *
 * @module      tiny_c4lauthor/variant_toolbar
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Format a variant name for display.
 *
 * @param {string} name
 * @param {Map} strings - Resolved lang strings.
 * @returns {string}
 */
const formatVariantLabel = (name, strings) => {
    // Use resolved lang string if available.
    const resolved = strings.get(name);
    if (resolved) {
        return resolved;
    }
    return name.charAt(0).toUpperCase() +
        name.slice(1).replace(/-/g, ' ');
};

/**
 * Set up the contextual variant toolbar inside the
 * inner TinyMCE editor.
 *
 * @param {object} ed - The inner TinyMCE editor instance.
 * @param {object} catalogue - The components the editor offers.
 * @param {string} deleteStr - Localised label for the delete button.
 * @param {string} moveUpStr - Localised label for the move-up button.
 * @param {string} moveDownStr - Localised label for the move-down button.
 */
export const setupVariantToolbar = (ed, catalogue, deleteStr, moveUpStr, moveDownStr) => {
    const iframeDoc = ed.getDoc();
    const iframeBody = ed.getBody();
    const allVariants = catalogue.variants;

    // Components whose wrapper is not a c4lv- class have to be named explicitly
    // or the hover test below never reaches them.
    const hoverSelector = catalogue.wrapperSelector;

    // Create toolbar (excluded from editor content).
    const toolbar = iframeDoc.createElement('div');
    toolbar.className = 'c4lauthor-vt';
    toolbar.setAttribute('data-mce-bogus', 'all');
    toolbar.setAttribute('contenteditable', 'false');
    iframeBody.appendChild(toolbar);

    let currentCompEl = null;
    let hideTimeout = null;

    const cancelHide = () => {
        clearTimeout(hideTimeout);
    };

    const hideToolbar = () => {
        toolbar.classList.remove('c4lauthor-vt--visible');
        currentCompEl = null;
    };

    const scheduleHide = () => {
        cancelHide();
        hideTimeout = setTimeout(hideToolbar, 200);
    };

    const trashIconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
        + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<polyline points="3 6 5 6 21 6"/>'
        + '<path d="M19 6l-1 14H6L5 6"/>'
        + '<path d="M10 11v6"/><path d="M14 11v6"/>'
        + '<path d="M9 6V4h6v2"/></svg>';

    const deleteComponent = (compEl) => {
        // If wrapped in .c4l-inline-group or .c4l-display-left, target the wrapper.
        const wrapper = compEl.closest('.c4l-inline-group, .c4l-display-left');
        const target = wrapper || compEl;

        const prev = target.previousElementSibling;
        const next = target.nextElementSibling;
        if (prev && prev.classList.contains('c4l-spacer')) {
            prev.remove();
        }
        if (next && next.classList.contains('c4l-spacer')) {
            next.remove();
        }
        target.remove();
        hideToolbar();
        ed.undoManager.add();
    };

    const chevronUpSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
        + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<polyline points="18 15 12 9 6 15"/></svg>';

    const chevronDownSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
        + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<polyline points="6 9 12 15 18 9"/></svg>';

    const moveComponent = (compEl, direction) => {
        const wrapper = compEl.closest('.c4l-inline-group, .c4l-display-left');
        const target = wrapper || compEl;

        // Walk siblings skipping spacers.
        let sibling = target;
        do {
            sibling = direction === 'up' ? sibling.previousElementSibling : sibling.nextElementSibling;
        } while (sibling && sibling.classList.contains('c4l-spacer'));

        if (!sibling || sibling === toolbar) {
            return;
        }

        if (direction === 'up') {
            iframeBody.insertBefore(target, sibling);
        } else {
            sibling.after(target);
        }

        currentCompEl = null;
        showToolbar(compEl, catalogue.find(catalogue.nameOf(compEl)) || {});
        ed.undoManager.add();
    };

    const deactivateVariant = (compEl, varName, btn) => {
        const varClass = 'c4l-' + varName + '-variant';
        compEl.classList.remove(varClass);
        if (btn) {
            btn.classList.remove('c4lauthor-vt__btn--active');
        }
        if (varName === 'caption') {
            const fc = compEl.querySelector('figcaption');
            if (fc) {
                fc.remove();
            }
        } else if (varName === 'quote') {
            const ec = compEl.querySelector('.c4l-embedded-caption');
            if (ec) {
                ec.remove();
            }
        }
    };

    const activateVariant = (compEl, varName, btn, vDef) => {
        const varClass = 'c4l-' + varName + '-variant';
        compEl.classList.add(varClass);
        if (btn) {
            btn.classList.add('c4lauthor-vt__btn--active');
        }
        if (vDef && vDef.html) {
            const tmp = iframeDoc.createElement('div');
            tmp.innerHTML = vDef.html;
            while (tmp.firstChild) {
                compEl.appendChild(tmp.firstChild);
            }
        }
    };

    const toggleVariant = (compEl, varName, btn) => {
        const varClass = 'c4l-' + varName + '-variant';
        const isActive = compEl.classList.contains(varClass);
        const vDef = allVariants.find((v) => v.name === varName);

        // Mutually exclusive group: clicking the active one is a no-op
        // (the group must always have exactly one active variant).
        if (vDef && vDef.group && isActive) {
            return;
        }

        if (isActive) {
            deactivateVariant(compEl, varName, btn);
            return;
        }

        // Activating a grouped variant: deactivate any other active
        // variant in the same group on this component.
        if (vDef && vDef.group) {
            const toolbar = btn && btn.parentNode;
            allVariants
                .filter((v) => v.group === vDef.group && v.name !== varName)
                .forEach((other) => {
                    const otherClass = 'c4l-' + other.name + '-variant';
                    if (compEl.classList.contains(otherClass)) {
                        const otherBtn = toolbar
                            ? toolbar.querySelector('[data-variant="' + other.name + '"]')
                            : null;
                        deactivateVariant(compEl, other.name, otherBtn);
                    }
                });
        }

        // Activating a variant that excludes others: deactivate them
        // on this component. Unlike `group`, excludes does not change
        // the ability to toggle the variant off later.
        if (vDef && Array.isArray(vDef.excludes)) {
            const toolbar = btn && btn.parentNode;
            vDef.excludes.forEach((excludedName) => {
                const excludedClass = 'c4l-' + excludedName + '-variant';
                if (compEl.classList.contains(excludedClass)) {
                    const excludedBtn = toolbar
                        ? toolbar.querySelector('[data-variant="' + excludedName + '"]')
                        : null;
                    deactivateVariant(compEl, excludedName, excludedBtn);
                }
            });
        }

        activateVariant(compEl, varName, btn, vDef);
    };

    const showToolbar = (compEl, comp) => {
        if (currentCompEl === compEl) {
            return;
        }
        currentCompEl = compEl;
        toolbar.innerHTML = '';

        // Delete button — always first.
        const delBtn = iframeDoc.createElement('button');
        delBtn.className = 'c4lauthor-vt__btn c4lauthor-vt__btn--delete';
        delBtn.innerHTML = trashIconSvg;
        delBtn.title = deleteStr;
        delBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteComponent(compEl);
        });
        toolbar.appendChild(delBtn);

        // Move up / move down buttons.
        const wrapper = compEl.closest('.c4l-inline-group, .c4l-display-left');
        const target = wrapper || compEl;

        const makeMoveBtn = (direction, svg, title) => {
            const btn = iframeDoc.createElement('button');
            btn.className = 'c4lauthor-vt__btn c4lauthor-vt__btn--move c4lauthor-vt__btn--move-' + direction;
            btn.innerHTML = svg;
            btn.title = title;

            // Check if at edge.
            let sib = target;
            do {
                sib = direction === 'up' ? sib.previousElementSibling : sib.nextElementSibling;
            } while (sib && sib.classList.contains('c4l-spacer'));
            if (!sib || sib === toolbar) {
                btn.classList.add('c4lauthor-vt__btn--disabled');
            }

            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!btn.classList.contains('c4lauthor-vt__btn--disabled')) {
                    moveComponent(compEl, direction);
                }
            });
            return btn;
        };

        toolbar.appendChild(makeMoveBtn('up', chevronUpSvg, moveUpStr));
        toolbar.appendChild(makeMoveBtn('down', chevronDownSvg, moveDownStr));

        (comp.variants || []).forEach((varName) => {
            const btn = iframeDoc.createElement('button');
            btn.className = 'c4lauthor-vt__btn';
            btn.textContent = formatVariantLabel(varName, catalogue.strings);
            btn.dataset.variant = varName;

            const varClass = 'c4l-' + varName + '-variant';
            if (compEl.classList.contains(varClass)) {
                btn.classList.add('c4lauthor-vt__btn--active');
            }

            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleVariant(compEl, varName, btn);
            });

            toolbar.appendChild(btn);
        });

        // Position above the component, right-aligned.
        let top = 0;
        let el = compEl;
        while (el && el !== iframeBody) {
            top += el.offsetTop;
            el = el.offsetParent;
        }
        toolbar.classList.add('c4lauthor-vt--visible');
        const tbHeight = toolbar.offsetHeight;
        toolbar.style.top = (top - tbHeight - 6) + 'px';
        toolbar.style.right = '16px';
    };

    const isInsideExpanded = (el, x, y, buffer) => {
        const rect = el.getBoundingClientRect();
        const cs = iframeDoc.defaultView
            .getComputedStyle(el);
        const mt = (parseInt(cs.marginTop) || 0) + buffer;
        const mr = (parseInt(cs.marginRight) || 0) + buffer;
        const mb = (parseInt(cs.marginBottom) || 0) + buffer;
        const ml = (parseInt(cs.marginLeft) || 0) + buffer;
        return x >= rect.left - ml &&
            x <= rect.right + mr &&
            y >= rect.top - mt &&
            y <= rect.bottom + mb;
    };

    const ensureToolbar = () => {
        if (!iframeBody.contains(toolbar)) {
            const htmlEl = iframeDoc.documentElement;
            const scrollY = htmlEl.scrollTop;
            iframeBody.appendChild(toolbar);
            htmlEl.scrollTop = scrollY;
        }
    };

    ed.on('SetContent Undo Redo', ensureToolbar);

    iframeBody.addEventListener('mousemove', (e) => {
        ensureToolbar();

        if (toolbar.contains(e.target)) {
            cancelHide();
            return;
        }

        const compEl = e.target.closest(hoverSelector);
        if (compEl) {
            cancelHide();
            const compName = catalogue.nameOf(compEl);
            if (compName) {
                const comp = catalogue.find(compName);
                if (comp) {
                    showToolbar(compEl, comp);
                    return;
                }
            }
        }

        if (currentCompEl &&
            iframeBody.contains(currentCompEl)) {
            const inComp = isInsideExpanded(
                currentCompEl, e.clientX, e.clientY, 12
            );
            const tbRect = toolbar.getBoundingClientRect();
            const inTb = e.clientX >= tbRect.left - 8 &&
                e.clientX <= tbRect.right + 8 &&
                e.clientY >= tbRect.top - 8 &&
                e.clientY <= tbRect.bottom + 8;
            if (inComp || inTb) {
                cancelHide();
                return;
            }
        }

        scheduleHide();
    });

    iframeBody.addEventListener('mouseleave', scheduleHide);
};
