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
 * Tiny C4L Author plugin options.
 *
 * @module      tiny_c4lauthor/options
 * @copyright   2022 Marc Català <reskit@gmail.com>
 * @copyright   2026 Roger Segú <rogersegu@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getPluginOptionName} from 'editor_tiny/options';
import {pluginName} from './common';

const clickToOpenName = getPluginOptionName(pluginName, 'showoverlay');
const isstudentName = getPluginOptionName(pluginName, 'isstudent');
const allowedcompsName = getPluginOptionName(pluginName, 'allowedcomps');
const viewc4lName = getPluginOptionName(pluginName, 'viewc4l');
const showdocsName = getPluginOptionName(pluginName, 'showdocs');
const previewCSSName = getPluginOptionName(pluginName, 'previewcss');
const customCompsName = getPluginOptionName(pluginName, 'customcomps');
const editorCssName = getPluginOptionName(pluginName, 'editorcss');
const aienabledName = getPluginOptionName(pluginName, 'aienabled');
const airatesName = getPluginOptionName(pluginName, 'airates');
const aipolicyagreedName = getPluginOptionName(pluginName, 'aipolicyagreed');

export const register = (editor) => {
    const registerOption = editor.options.register;

    registerOption(clickToOpenName, {
        processor: 'boolean',
        "default": true,
    });

    registerOption(isstudentName, {
        processor: 'boolean',
        "default": false,
    });

    registerOption(allowedcompsName, {
        processor: 'array',
        "default": [],
    });

    registerOption(showdocsName, {
        processor: 'boolean',
        "default": false,
    });

    registerOption(viewc4lName, {
        processor: 'boolean',
        "default": true,
    });

    registerOption(previewCSSName, {
        processor: 'string',
        "default": '',
    });

    registerOption(customCompsName, {
        processor: 'array',
        "default": [],
    });

    registerOption(editorCssName, {
        processor: 'array',
        "default": [],
    });

    registerOption(aienabledName, {
        processor: 'boolean',
        "default": true,
    });

    registerOption(aipolicyagreedName, {
        processor: 'boolean',
        "default": false,
    });

    registerOption(airatesName, {
        processor: 'string',
        "default": '{}',
    });
};

export const isShowOverlay = (editor) => editor.options.get(clickToOpenName);
export const isC4LVisible = (editor) => editor.options.get(viewc4lName);
export const isStudent = (editor) => editor.options.get(isstudentName);
export const showDocs = (editor) => editor.options.get(showdocsName);
export const getallowedComponents = (editor) => editor.options.get(allowedcompsName);
export const getcustomComponents = (editor) => editor.options.get(customCompsName);
export const getEditorCss = (editor) => editor.options.get(editorCssName);
export const getpreviewCSS = (editor) => editor.options.get(previewCSSName);
export const isAiEnabled = (editor) => editor.options.get(aienabledName);
export const isAiPolicyAgreed = (editor) => editor.options.get(aipolicyagreedName);
export const getAiRates = (editor) => {
    const raw = editor.options.get(airatesName);
    if (!raw || typeof raw !== 'string') {
        return {};
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        return {};
    }
};
