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
 * The sidebar listing the components.
 *
 * @module      tiny_c4lauthor/sidebar
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Build the sidebar HTML with C4L component buttons.
 *
 * @param {object} catalogue - The components the editor offers.
 * @param {object} filterLabels - Translated filter labels keyed by type.
 * @param {boolean} userIsStudent - Whether the current user is a student.
 * @param {Array} allowedComps - Allowed component names for students.
 * @param {boolean} enableTooltips - Whether to add docs tooltips to component buttons.
 * @returns {string} Sidebar HTML.
 */
export const buildSidebar = (catalogue, filterLabels, userIsStudent, allowedComps, enableTooltips) => {
    // Collect visible types.
    const typeOrder = ['contextual', 'procedural', 'evaluative', 'helper', 'custom'];

    // Filter components based on student/allowed.
    const visibleComponents = catalogue.components.filter((comp) => {
        if (!userIsStudent) {
            return true;
        }
        return allowedComps.includes(comp.name);
    });

    // Determine which types have visible components.
    const visibleTypes = new Set(visibleComponents.map((c) => c.category));
    const types = ['all', ...typeOrder.filter((t) => visibleTypes.has(t))];

    let tabsHtml = '';
    types.forEach((type) => {
        const active = type === 'all' ? ' tiny_c4lauthor__tab--active' : '';
        const label = filterLabels[type] || type;
        tabsHtml += `<button class="tiny_c4lauthor__tab${active}" data-filter="${type}">${label}</button>`;
    });

    // Group components by type.
    const groups = {};
    visibleComponents.forEach((comp) => {
        if (!groups[comp.category]) {
            groups[comp.category] = [];
        }
        groups[comp.category].push(comp);
    });

    let groupsHtml = '';
    typeOrder.forEach((type) => {
        if (!groups[type] || groups[type].length === 0) {
            return;
        }
        const label = filterLabels[type] || type;
        let itemsHtml = '';
        groups[type].forEach((comp) => {
            const compLabel = comp.label;
            const iconHtml = comp.icon
                ? `<img src="${comp.icon}" class="c4l-custom-icon-img" alt="">`
                : `<span class="c4l-button-text"></span>`;

            // Build tooltip from docs if available and enabled.
            let tooltipAttr = '';
            if (enableTooltips && comp.docs && comp.docs.description) {
                let tip = catalogue.strings.get(comp.docs.description) || '';
                if (comp.docs.usecases && comp.docs.usecases.length) {
                    const cases = comp.docs.usecases
                        .map((uc) => catalogue.strings.get(uc))
                        .filter(Boolean);
                    if (cases.length) {
                        tip += '<ul style="text-align:left;margin:6px 0 0;padding-left:18px">' +
                            cases.map((c) => '<li>' + c + '</li>').join('') + '</ul>';
                    }
                }
                const escaped = tip.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                tooltipAttr = ` data-c4l-tooltip="${escaped}"`;
            }

            itemsHtml +=
                `<button class="tiny_c4lauthor__comp-btn ${comp.iconclass}"` +
                ` data-comp="${comp.name}" data-type="${comp.category}"${tooltipAttr}>` +
                iconHtml +
                `<span class="tiny_c4lauthor__comp-name">${compLabel}</span>` +
                `</button>`;
        });
        groupsHtml += `<div class="tiny_c4lauthor__group" data-group="${type}">` +
            `<div class="tiny_c4lauthor__group-header">${label}</div>` +
            `<div class="tiny_c4lauthor__group-grid">${itemsHtml}</div>` +
            `</div>`;
    });

    return `<div class="tiny_c4lauthor__sidebar">` +
        `<div class="tiny_c4lauthor__tabs">${tabsHtml}</div>` +
        `<div class="tiny_c4lauthor__sidebar-list">${groupsHtml}</div>` +
        `</div>`;
};

/**
 * Detect which filter tabs overflow the container and collapse
 * them behind a "More" dropdown.  Must be called after the modal
 * is visible so measurements are accurate.
 *
 * @param {HTMLElement} tabsContainer - The .tiny_c4lauthor__tabs element.
 * @param {string} moreLabel - Translated label for the "More" button.
 * @param {jQuery} root - Modal root for event delegation.
 */
export const setupTabOverflow = (tabsContainer, moreLabel, root) => {
    // Defer until the modal transition has finished and layout is settled.
    setTimeout(() => {
        const tabs = Array.from(tabsContainer.querySelectorAll('.tiny_c4lauthor__tab'));
        if (!tabs.length) {
            return;
        }

        // Use each tab's actual rendered position to detect which ones
        // overflow beyond the container's visible height.
        const containerTop = tabsContainer.getBoundingClientRect().top;
        const containerHeight = tabsContainer.clientHeight;
        const maxBottom = containerTop + containerHeight;

        // First check: do all tabs fit without a "More" button?
        let allFit = true;
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].getBoundingClientRect().bottom > maxBottom) {
                allFit = false;
                break;
            }
        }
        if (allFit) {
            return;
        }

        // We need a "More" button. Append it so the reflow accounts for it.
        const moreBtn = document.createElement('button');
        moreBtn.className = 'tiny_c4lauthor__tab tiny_c4lauthor__tab--more';
        moreBtn.textContent = moreLabel;
        tabsContainer.appendChild(moreBtn);

        // Hide tabs from the end, one by one, until "More" fits
        // inside the container (i.e. its bottom <= maxBottom).
        let overflowStartIndex = tabs.length;
        for (let i = tabs.length - 1; i >= 0; i--) {
            if (moreBtn.getBoundingClientRect().bottom <= maxBottom) {
                break;
            }
            tabs[i].style.display = 'none';
            overflowStartIndex = i;
        }

        if (overflowStartIndex >= tabs.length) {
            // Everything fits even with "More" — restore and remove it.
            tabs.forEach((t) => {
                t.style.display = '';
            });
            tabsContainer.removeChild(moreBtn);
            return;
        }

        // Collect hidden tabs for the dropdown.
        const hiddenTabs = tabs.slice(overflowStartIndex);

        // Create dropdown menu — append to the modal body (outside
        // any overflow:hidden ancestor) so it is not clipped.
        const modalBody = tabsContainer.closest('.tiny_c4lauthor') || document.body;
        const menu = document.createElement('div');
        menu.className = 'tiny_c4lauthor__more-menu';
        hiddenTabs.forEach((t) => {
            const item = document.createElement('button');
            item.className = 'tiny_c4lauthor__more-item';
            item.textContent = t.textContent;
            item.dataset.filter = t.dataset.filter;
            menu.appendChild(item);
        });
        modalBody.appendChild(menu);

        // Position menu below the "More" button.
        const positionMenu = () => {
            const btnRect = moreBtn.getBoundingClientRect();
            const modalRect = modalBody.getBoundingClientRect();
            menu.style.top = (btnRect.bottom - modalRect.top + 4) + 'px';
            menu.style.left = (btnRect.left - modalRect.left) + 'px';
        };

        // Toggle menu on "More" click.
        moreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            positionMenu();
            menu.classList.toggle('tiny_c4lauthor__more-menu--visible');
        });

        // Menu item click — apply filter.
        root.on('click', '.tiny_c4lauthor__more-item', (e) => {
            e.preventDefault();
            const filterType = e.currentTarget.dataset.filter;

            root.find('.tiny_c4lauthor__tab').removeClass('tiny_c4lauthor__tab--active');
            moreBtn.classList.add('tiny_c4lauthor__tab--active');
            menu.classList.remove('tiny_c4lauthor__more-menu--visible');

            root.find('.tiny_c4lauthor__group').each(function() {
                if (filterType === 'all' || this.dataset.group === filterType) {
                    this.style.display = '';
                } else {
                    this.style.display = 'none';
                }
            });
        });

        // Close menu when clicking outside.
        document.addEventListener('click', (e) => {
            if (!moreBtn.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.remove('tiny_c4lauthor__more-menu--visible');
            }
        });
    }, 300);
};
