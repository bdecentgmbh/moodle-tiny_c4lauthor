<?php
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

namespace tiny_c4lauthor\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_value;
use core_external\external_single_structure;
use core_external\external_multiple_structure;
use tiny_c4lauthor\local\components;

/**
 * Web service returning the components and variants the editor offers.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_components extends external_api {
    /**
     * Define the parameters for the execute method.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'contextid' => new external_value(PARAM_INT, 'Context id of the editor'),
        ]);
    }

    /**
     * Define the return structure for the execute method.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        $field = [
            'selector' => new external_value(PARAM_RAW, 'CSS selector of the element, empty for the component itself'),
            'label' => new external_value(PARAM_RAW, 'Lang string key of the label'),
            'type' => new external_value(PARAM_ALPHANUMEXT, 'textarea, input, list, image-src or image-alt'),
        ];
        return new external_single_structure([
            'components' => new external_multiple_structure(
                new external_single_structure([
                    'name' => new external_value(PARAM_ALPHANUMEXT, 'Component name'),
                    'id' => new external_value(PARAM_INT, 'Component id, for components of C4L Author', VALUE_OPTIONAL),
                    'component' => new external_value(PARAM_COMPONENT, 'Plugin the component comes from'),
                    'category' => new external_value(PARAM_ALPHA, 'Category'),
                    'template' => new external_value(PARAM_SAFEPATH, 'Template with the markup'),
                    'iconclass' => new external_value(PARAM_ALPHANUMEXT, 'Class of the sidebar button'),
                    'menuicon' => new external_value(PARAM_SAFEPATH, 'Pix path of the menu icon'),
                    'icon' => new external_value(PARAM_URL, 'URL of the icon, for components from other plugins'),
                    'wrapperclass' => new external_value(PARAM_ALPHANUMEXT, 'Class identifying the component'),
                    'text' => new external_value(PARAM_RAW, 'Default text of the placeholder'),
                    'docs' => new external_single_structure([
                        'description' => new external_value(PARAM_RAW, 'Lang string key of the description'),
                        'usecases' => new external_multiple_structure(
                            new external_value(PARAM_RAW, 'Lang string key of a use case')
                        ),
                    ]),
                    'variants' => new external_multiple_structure(
                        new external_value(PARAM_ALPHANUMEXT, 'Variant name')
                    ),
                    'convertible' => new external_value(PARAM_INT, 'Position in the convert menu, 0 if not convertible'),
                    'precision' => new external_multiple_structure(
                        new external_single_structure($field + [
                            'innerhtml' => new external_value(PARAM_BOOL, 'Whether the value is HTML'),
                            'fallback' => new external_value(PARAM_BOOL, 'Whether to use the component when the selector misses'),
                            'optional' => new external_value(PARAM_BOOL, 'Whether to leave the field out when missing'),
                            'handler' => new external_value(PARAM_ALPHANUMEXT, 'Name of the extract and apply handler'),
                            'subfields' => new external_multiple_structure(
                                new external_single_structure($field + [
                                    'key' => new external_value(PARAM_ALPHANUMEXT, 'Key of the value in a row'),
                                ])
                            ),
                        ])
                    ),
                    'inserter' => new external_value(PARAM_PATH, 'AMD module that returns the markup to insert'),
                ])
            ),
            'variants' => new external_multiple_structure(
                new external_single_structure([
                    'name' => new external_value(PARAM_ALPHANUMEXT, 'Variant name'),
                    'id' => new external_value(PARAM_INT, 'Variant id'),
                    'template' => new external_value(PARAM_SAFEPATH, 'Template with the HTML the variant adds'),
                    'group' => new external_value(PARAM_ALPHANUMEXT, 'Group of variants of which exactly one is active'),
                    'excludes' => new external_multiple_structure(
                        new external_value(PARAM_ALPHANUMEXT, 'Name of a variant this one switches off')
                    ),
                ])
            ),
            'strings' => new external_multiple_structure(
                new external_single_structure([
                    'key' => new external_value(PARAM_RAW, 'Lang string key, prefixed with the plugin for other plugins'),
                    'value' => new external_value(PARAM_RAW, 'Lang string'),
                ])
            ),
        ]);
    }

    /**
     * Get the components, variants and their strings.
     *
     * @param int $contextid Context id of the editor.
     * @return array
     */
    public static function execute(int $contextid): array {
        $params = self::validate_parameters(self::execute_parameters(), ['contextid' => $contextid]);

        $context = \context::instance_by_id($params['contextid'], MUST_EXIST);
        self::validate_context($context);
        require_capability('tiny/c4lauthor:use', $context);
        require_capability('tiny/c4lauthor:viewplugin', $context);

        return components::export_for_editor($context);
    }
}
