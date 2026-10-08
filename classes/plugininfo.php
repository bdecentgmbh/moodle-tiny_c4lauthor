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

namespace tiny_c4lauthor;

use context;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_configuration;
use tiny_c4lauthor\local\ai_access;

/**
 * Tiny c4lauthor plugin.
 *
 * @package    tiny_c4lauthor
 * @copyright  2022 Marc Català <reskit@gmail.com>
 * @copyright  2026 Roger Segú
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugininfo extends plugin implements plugin_with_buttons, plugin_with_configuration {
    /**
     * Return the list of buttons provided by this plugin.
     *
     * @return string[]
     */
    public static function get_available_buttons(): array {
        return [
            'tiny_c4lauthor/c4lauthor',
        ];
    }

    /**
     * Whether the plugin is available to the current user in this context.
     *
     * @param context $context The context.
     * @param array $options Options for the editor.
     * @param array $fpoptions File picker options.
     * @param ?\editor_tiny\editor $editor The editor instance.
     * @return bool
     */
    public static function is_enabled(
        context $context,
        array $options,
        array $fpoptions,
        ?\editor_tiny\editor $editor = null
    ): bool {
        return has_capability('tiny/c4lauthor:use', $context)
            && has_capability('tiny/c4lauthor:viewplugin', $context);
    }

    /**
     * Return the plugin configuration for the given context.
     *
     * @param context $context The context.
     * @param array $options Options for the editor.
     * @param array $fpoptions File picker options.
     * @param ?\editor_tiny\editor $editor The editor instance.
     * @return array Plugin configuration.
     */
    public static function get_plugin_configuration_for_context(
        context $context,
        array $options,
        array $fpoptions,
        ?\editor_tiny\editor $editor = null
    ): array {
        global $USER;

        $config = get_config('tiny_c4lauthor');

        $showoverlay = $config->showoverlay ?? '';
        $viewc4l = has_capability('tiny/c4lauthor:viewplugin', $context);
        $showdocs = isset($config->enabledocs) && $config->enabledocs !== '' ? (bool) $config->enabledocs : false;
        $isstudent = !has_capability('gradereport/grader:view', $context);

        $allowedcomps = [];
        if ($isstudent) {
            $aimedcomps = explode(',', get_config('tiny_c4lauthor', 'aimedatstudents'));
            $notintendedcomps = explode(',', get_config('tiny_c4lauthor', 'notintendedforstudents'));
            $allowedcomps = array_merge($aimedcomps, $notintendedcomps);
        }

        $previewcss = $config->custompreviewcss ?? '';
        $customcomponents = self::get_custom_components($config);

        // AI suggest: setting, capability and per-course AI setting, as the web service checks them.
        $aienabled = ai_access::can_use($context);

        // AI rate limits per component (max per 10 paragraphs).
        // Disabled components get rate 0.
        $airates = [];
        $aicomponents = ['attention', 'tip', 'keyconcept', 'reminder'];
        $defaults = ['attention' => 3, 'tip' => 3, 'keyconcept' => 3, 'reminder' => 2];
        foreach ($aicomponents as $comp) {
            $enabledkey = 'ai_comp_enabled_' . $comp;
            $compenabled = isset($config->$enabledkey) && $config->$enabledkey !== ''
                ? (bool) $config->$enabledkey : true;
            if (!$compenabled) {
                $airates[$comp] = 0;
                continue;
            }
            $ratekey = 'ai_maxrate_' . $comp;
            $val = isset($config->$ratekey) && $config->$ratekey !== '' ? (int) $config->$ratekey : $defaults[$comp];
            $airates[$comp] = $val;
        }

        return [
            'showoverlay' => ($showoverlay === false || $showoverlay === '') ? true : (bool) $showoverlay,
            'isstudent' => $isstudent,
            'allowedcomps' => $allowedcomps,
            'viewc4l' => $viewc4l,
            'showdocs' => $showdocs,
            'previewcss' => $previewcss,
            'customcomps' => $customcomponents,
            'aienabled' => $aienabled,
            'aipolicyagreed' => $aienabled && ai_access::policy_accepted($USER->id),
            'airates' => json_encode($airates),
        ];
    }

    /**
     * Get the custom components.
     *
     * @param  \stdClass $config tiny_c4lauthor config
     * @return array
     */
    public static function get_custom_components(\stdClass $config) {
        global $OUTPUT;

        $customcomponents = [];
        $customcompcount = $config->customcompcount ?? 0;
        if ($customcompcount > 0) {
            $context = \context_system::instance();
            $customfiles = [];
            if (!empty($config->customimagesbank)) {
                $fs = get_file_storage();
                $files = $fs->get_area_files(
                    $context->id,
                    'tiny_c4lauthor',
                    'customimagesbank',
                    false,
                    'itemid',
                    false
                );
                foreach ($files as $file) {
                    $customfiles[$file->get_filename()] = $file;
                }
            }
            for ($i = 1; $i <= $customcompcount; $i++) {
                $compcode   = "customcompcode{$i}";
                $compenable = "customcompenable{$i}";
                $compname   = "customcompname{$i}";
                if (
                    isset($config->$compenable) && $config->$compenable === '1'
                    && !empty(trim($config->$compname ?? ''))
                    && !empty(trim($config->$compcode ?? ''))
                ) {
                    $compicon  = "customcompicon{$i}";
                    $comptext  = "customcomptext{$i}";
                    $compvar   = "customcompvariant{$i}";
                    $compsort  = "customcompsortorder{$i}";

                    if (!empty($config->$compicon)) {
                        $icon = \moodle_url::make_pluginfile_url(
                            $context->id,
                            'tiny_c4lauthor',
                            "customcompicon{$i}",
                            0,
                            '/',
                            basename($config->$compicon)
                        );
                    } else {
                        $icon = $OUTPUT->image_url('c4l_customcomponent_icon', 'tiny_c4lauthor');
                    }

                    // Replace {} before searching for images and cleaning code.
                    $html = str_replace('{{CUSTOMCLASS}}', '~~CUSTOMCLASS~~', $config->$compcode);
                    $html = str_replace('{{PLACEHOLDER}}', '~~PLACEHOLDER~~', $html);

                    // Set url images.
                    $html = preg_replace_callback(
                        '/{{([^}]*)}}/',
                        function ($matches) use ($customfiles) {
                            if (isset($matches[1]) && isset($customfiles[$matches[1]])) {
                                $file = $customfiles[$matches[1]];
                                $fileurl = \moodle_url::make_pluginfile_url(
                                    $file->get_contextid(),
                                    $file->get_component(),
                                    $file->get_filearea(),
                                    $file->get_itemid(),
                                    $file->get_filepath(),
                                    $file->get_filename(),
                                    false
                                )->out();
                                return $fileurl;
                            } else {
                                return '';
                            }
                        },
                        $html
                    );

                    // Clean HTML code. clean_text() only sanitises; format_text() would also run filters.
                    $html = clean_text($html, FORMAT_HTML);
                    $html = preg_replace('/ style=("|\')(.*?)("|\')/', '', $html);

                    // Restore {}.
                    $html = str_replace('~~CUSTOMCLASS~~', '{{CUSTOMCLASS}}', $html);
                    $html = str_replace('~~PLACEHOLDER~~', '{{PLACEHOLDER}}', $html);

                    $key = count($customcomponents);
                    $customcomponents[$key]['id'] = $i;
                    $customcomponents[$key]['name'] = 'customcomp' . $i;
                    $customcomponents[$key]['buttonname'] = $config->$compname;
                    $customcomponents[$key]['icon'] = $icon->out();
                    $customcomponents[$key]['code'] = $html;
                    $customcomponents[$key]['text'] = $config->$comptext ?? '';
                    $customcomponents[$key]['variants'] = isset($config->$compvar) && $config->$compvar === '1';
                    $customcomponents[$key]['sortorder'] = $config->$compsort ?? $i;
                }
            }

            usort($customcomponents, function ($a, $b) {
                return $a['sortorder'] <=> $b['sortorder'];
            });
        }

        return $customcomponents;
    }
}
