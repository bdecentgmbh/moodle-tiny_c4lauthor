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
 * A dropdown menu for buttons in the editor toolbar and quickbar.
 *
 * @module      tiny_c4lauthor/dropdown
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Show a custom DOM dropdown near a TinyMCE toolbar/quickbar button.
 * This bypasses TinyMCE's built-in MenuButton dropdown, which has a
 * positioning bug that causes the menu to render off-screen when the
 * editor is destroyed and recreated inside a modal.
 *
 * @param {object} ed - TinyMCE editor instance.
 * @param {string} btnTooltip - The tooltip of the button (used to locate it in the DOM).
 * @param {Array} items - Array of {label, icon, onAction} objects.
 */
export const showCustomDropdown = (ed, btnTooltip, items) => {
    // Close any existing custom dropdown.
    document.querySelectorAll('.c4l-custom-dropdown').forEach((el) => el.remove());

    // Find the button by its aria-label.  The quickbar lives in
    // .tox-tinymce-aux which is a sibling of .tox-tinymce, so we
    // search the modal (or the whole document as fallback).
    const edContainer = ed.getContainer();
    const searchRoot = edContainer
        ? (edContainer.closest('.tiny_c4lauthor') || edContainer.parentNode)
        : document;
    let btn = searchRoot.querySelector(
        '.tox-tinymce-aux button[aria-label="' + btnTooltip + '"]'
    );
    if (!btn) {
        btn = document.querySelector(
            '.tox-tinymce-aux button[aria-label="' + btnTooltip + '"]'
        );
    }
    if (!btn) {
        return;
    }

    const btnRect = btn.getBoundingClientRect();

    // Build dropdown element.
    const dropdown = document.createElement('div');
    dropdown.className = 'c4l-custom-dropdown';
    dropdown.style.cssText =
        'position:fixed;z-index:10070;background:#fff;' +
        'border:1px solid rgb(222,226,230);border-radius:6px;' +
        'box-shadow:0 4px 14px rgba(0,0,0,.18);' +
        'max-height:280px;overflow-y:auto;min-width:160px;' +
        'padding:4px 0;' +
        'scrollbar-width:thin;scrollbar-color:rgba(0,0,0,0.2) transparent;';
    dropdown.style.top = btnRect.bottom + 4 + 'px';
    dropdown.style.left = btnRect.left + 'px';

    items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'c4l-custom-dropdown__item';
        row.style.cssText =
            'padding:5px 12px 5px 8px;cursor:pointer;font-size:13px;' +
            'white-space:nowrap;display:flex;align-items:center;gap:8px;';
        // Add icon if provided (SVG string).
        if (item.iconHtml) {
            const iconWrap = document.createElement('span');
            iconWrap.style.cssText =
                'display:inline-flex;width:20px;height:20px;' +
                'align-items:center;justify-content:center;flex-shrink:0;' +
                'overflow:visible;';
            iconWrap.innerHTML = item.iconHtml;
            // Scale SVG and inner image to fit.
            const svg = iconWrap.querySelector('svg');
            if (svg) {
                svg.style.width = '18px';
                svg.style.height = '18px';
            }
            const img = iconWrap.querySelector('image');
            if (img) {
                img.setAttribute('width', '18');
                img.setAttribute('height', '18');
            }
            row.appendChild(iconWrap);
        }
        const textSpan = document.createElement('span');
        textSpan.textContent = item.label;
        row.appendChild(textSpan);
        if (item.enabled === false) {
            row.style.opacity = '0.45';
            row.style.cursor = 'default';
        } else {
            row.addEventListener('mouseenter', () => {
                row.style.background = '#f0f0f0';
            });
            row.addEventListener('mouseleave', () => {
                row.style.background = '';
            });
            row.addEventListener('click', () => {
                dropdown.remove();
                item.onAction();
            });
        }
        dropdown.appendChild(row);
    });

    document.body.appendChild(dropdown);

    // Adjust if dropdown overflows viewport.
    const dRect = dropdown.getBoundingClientRect();
    if (dRect.right > window.innerWidth) {
        dropdown.style.left =
            (window.innerWidth - dRect.width - 10) + 'px';
    }
    if (dRect.bottom > window.innerHeight) {
        dropdown.style.top = (btnRect.top - dRect.height - 4) + 'px';
    }

    // Close on click outside, Escape, or any interaction inside the editor
    // iframe (which lives in a separate document and does not bubble to
    // the main document).
    const close = (e) => {
        if (e && e.type === 'keydown' && e.key !== 'Escape') {
            return;
        }
        // Don't close if the click is inside the dropdown itself.
        if (e && e.target instanceof Node && dropdown.contains(e.target)) {
            return;
        }
        dropdown.remove();
        document.removeEventListener('mousedown', close);
        document.removeEventListener('keydown', close);
        ed.off('click', close);
        ed.off('NodeChange', close);
    };
    // Delay listener so the current click doesn't immediately close it.
    requestAnimationFrame(() => {
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', close);
        ed.on('click', close);
        ed.on('NodeChange', close);
    });
};
