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
use tiny_c4lauthor\local\ai_access;

/**
 * Web service for AI-based C4L component suggestions.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 Roger Segú <rogersegu@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class suggest extends external_api {
    /** @var int Most paragraphs accepted in one request. */
    public const MAX_PARAGRAPHS = 200;

    /** @var int Paragraph texts are cut to this many characters. */
    public const MAX_PARAGRAPH_LENGTH = 5000;

    /** @var int Most characters accepted in one request, after cutting. */
    public const MAX_TOTAL_LENGTH = 60000;

    /**
     * Define the parameters for the execute method.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'contextid'  => new external_value(PARAM_INT, 'Context id'),
            'paragraphs' => new external_multiple_structure(
                new external_single_structure([
                    'index' => new external_value(PARAM_INT, '0-based paragraph index in the content'),
                    'text'  => new external_value(PARAM_TEXT, 'Paragraph text'),
                ]),
                'Paragraphs to classify'
            ),
            'lang'       => new external_value(PARAM_ALPHANUMEXT, 'Language code', VALUE_DEFAULT, 'en'),
        ]);
    }

    /**
     * Define the return structure for the execute method.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'suggestions' => new external_multiple_structure(
                new external_single_structure([
                    'component'   => new external_value(PARAM_ALPHANUMEXT, 'Component key'),
                    'targettype'  => new external_value(PARAM_ALPHA, 'Target type'),
                    'targetindex' => new external_value(PARAM_INT, '0-based index'),
                    'confidence'  => new external_value(PARAM_FLOAT, '0..1'),
                    'rationale'   => new external_value(PARAM_TEXT, 'Short rationale'),
                    'preview'     => new external_value(PARAM_RAW, 'Preview text'),
                ])
            ),
            'warnings' => new external_multiple_structure(
                new external_value(PARAM_TEXT, 'Warning message'),
                'Warnings',
                VALUE_DEFAULT,
                []
            ),
        ]);
    }

    /**
     * Execute the AI suggest web service.
     *
     * @param int $contextid The context ID.
     * @param array $paragraphs Paragraphs as [{index, text}, ...].
     * @param string $lang Language code.
     * @return array Suggestions and warnings.
     */
    public static function execute(int $contextid, array $paragraphs, string $lang = 'en'): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'contextid' => $contextid,
            'paragraphs' => $paragraphs,
            'lang' => $lang,
        ]);

        $context = \context::instance_by_id($params['contextid'], MUST_EXIST);
        self::validate_context($context);
        require_capability('tiny/c4lauthor:aisuggest', $context);

        if (!ai_access::is_enabled_on_site()) {
            throw new \moodle_exception('ai_disabled', 'tiny_c4lauthor');
        }
        if (!ai_access::is_enabled_in_context($context)) {
            return self::warning(get_string('ai_disabled_here', 'tiny_c4lauthor'));
        }
        if (!ai_access::policy_accepted($USER->id)) {
            return self::warning(get_string('ai_policy_required', 'tiny_c4lauthor'));
        }

        $items = $params['paragraphs'];
        if (count($items) > self::MAX_PARAGRAPHS) {
            return self::warning(get_string('ai_guard_too_long', 'tiny_c4lauthor'));
        }
        $total = 0;
        foreach ($items as $key => $item) {
            $items[$key]['text'] = \core_text::substr($item['text'], 0, self::MAX_PARAGRAPH_LENGTH);
            $total += \core_text::strlen($items[$key]['text']);
        }
        if ($total > self::MAX_TOTAL_LENGTH) {
            return self::warning(get_string('ai_guard_too_long', 'tiny_c4lauthor'));
        }

        // Require a configured AI provider.
        if (!\tiny_c4lauthor\ai_classifier::is_available()) {
            return self::warning(get_string('ai_no_provider', 'tiny_c4lauthor'));
        }

        return \tiny_c4lauthor\ai_classifier::classify($params['contextid'], $items, $params['lang']);
    }

    /**
     * Build a result with no suggestions and one warning.
     *
     * @param string $message
     * @return array
     */
    private static function warning(string $message): array {
        return ['suggestions' => [], 'warnings' => [$message]];
    }
}
