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

/**
 * Tiny c4lauthor plugin settings.
 *
 * @package    tiny_c4lauthor
 * @copyright  2022 Marc Català <reskit@gmail.com>
 * @copyright  2026 Roger Segú
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$ADMIN->add('editortiny', new admin_category('tiny_c4lauthor', new lang_string('pluginname', 'tiny_c4lauthor')));

$settings = new admin_settingpage('tiny_c4lauthor_settings', new lang_string('pluginname', 'tiny_c4lauthor'));

if ($ADMIN->fulltree) {
    // General settings heading.
    $settings->add(new admin_setting_heading(
        'tiny_c4lauthor/generalsettings',
        new lang_string('generalsettings', 'tiny_c4lauthor'),
        ''
    ));

    // Click to open.
    $name = get_string('setting_showoverlay', 'tiny_c4lauthor');
    $desc = get_string('setting_showoverlay_desc', 'tiny_c4lauthor');
    $setting = new admin_setting_configcheckbox('tiny_c4lauthor/showoverlay', $name, $desc, 0);
    $settings->add($setting);

    // Enable docs tooltips.
    $settings->add(new admin_setting_configcheckbox(
        'tiny_c4lauthor/enabledocs',
        get_string('enabledocs', 'tiny_c4lauthor'),
        get_string('enabledocs_desc', 'tiny_c4lauthor'),
        0
    ));

    // Components offered to students: those aimed at them, and those not intended for them.
    $settings->add(new \tiny_c4lauthor\local\admin_setting_student_components(
        'tiny_c4lauthor/aimedatstudents',
        get_string('aimedatstudents', 'tiny_c4lauthor'),
        get_string('aimedatstudents_desc', 'tiny_c4lauthor'),
        true
    ));
    $settings->add(new \tiny_c4lauthor\local\admin_setting_student_components(
        'tiny_c4lauthor/notintendedforstudents',
        get_string('notintendedforstudents', 'tiny_c4lauthor'),
        get_string('notintendedforstudents_desc', 'tiny_c4lauthor'),
        false
    ));

    // AI Suggest settings heading.
    $settings->add(new admin_setting_heading(
        'tiny_c4lauthor/ai_settings',
        new lang_string('ai_settings', 'tiny_c4lauthor'),
        new lang_string('ai_settings_desc', 'tiny_c4lauthor')
    ));

    // Enable/disable AI suggest globally.
    $settings->add(new admin_setting_configcheckbox(
        'tiny_c4lauthor/ai_enabled',
        get_string('ai_enabled', 'tiny_c4lauthor'),
        get_string('ai_enabled_desc', 'tiny_c4lauthor'),
        0
    ));

    // Per-component: enable checkbox + max rate per 10 paragraphs.
    $aicomponents = [
        'attention'         => ['default' => 3, 'icon' => 'c4l_attention_icon_blue'],
        'tip'               => ['default' => 3, 'icon' => 'noun_project_icons/c4l_tip_icon'],
        'keyconcept'        => ['default' => 3, 'icon' => 'noun_project_icons/c4l_keyconcept_icon'],
        'reminder'          => ['default' => 2, 'icon' => 'noun_project_icons/c4l_reminder_icon'],
    ];

    foreach ($aicomponents as $comp => $info) {
        $label = get_string('ai_label_' . $comp, 'tiny_c4lauthor');
        $iconurl = $OUTPUT->image_url($info['icon'], 'tiny_c4lauthor');
        $iconhtml = ' <img src="' . $iconurl . '" alt="" style="width:24px;height:24px;vertical-align:middle;'
            . 'margin-left:6px;margin-top:-2px;background-color:#ecf3ff;padding:4px;border-radius:4px">';

        // Enable checkbox for this component (with icon after name).
        $settings->add(new admin_setting_configcheckbox(
            'tiny_c4lauthor/ai_comp_enabled_' . $comp,
            get_string('ai_comp_enabled', 'tiny_c4lauthor', $label) . $iconhtml,
            '',
            1
        ));

        // Max rate per 10 paragraphs (no icon).
        $settings->add(new admin_setting_configtext(
            'tiny_c4lauthor/ai_maxrate_' . $comp,
            get_string('ai_maxrate', 'tiny_c4lauthor', $label),
            get_string('ai_maxrate_desc', 'tiny_c4lauthor'),
            $info['default'],
            PARAM_INT
        ));
    }

    // Minimum suggestions.
    $settings->add(new admin_setting_configtext(
        'tiny_c4lauthor/ai_min_suggestions',
        get_string('ai_min_suggestions', 'tiny_c4lauthor'),
        get_string('ai_min_suggestions_desc', 'tiny_c4lauthor'),
        12,
        PARAM_INT
    ));

    // AI prompt extension.
    $settings->add(new admin_setting_configtextarea(
        'tiny_c4lauthor/ai_prompt_extra',
        get_string('ai_prompt_extra', 'tiny_c4lauthor'),
        get_string('ai_prompt_extra_desc', 'tiny_c4lauthor'),
        ''
    ));

    // Custom components heading.
    $settings->add(new admin_setting_heading(
        'tiny_c4lauthor/customcomponents',
        new lang_string('customcomponents', 'tiny_c4lauthor'),
        ''
    ));

    // Number of custom components.
    $name = 'tiny_c4lauthor/customcompcount';
    $title = get_string('customcompcount', 'tiny_c4lauthor');
    $description = get_string('customcompcountdesc', 'tiny_c4lauthor');
    $options = range(0, 12);
    $options = array_combine($options, $options);
    $setting = new admin_setting_configselect($name, $title, $description, 0, $options);
    $setting->set_updatedcallback('purge_all_caches');
    $settings->add($setting);

    // CSS for preview content inside editor.
    $name = 'tiny_c4lauthor/custompreviewcss';
    $title = get_string('custompreviewcss', 'tiny_c4lauthor');
    $url = new moodle_url('/admin/settings.php', ['section' => 'additionalhtml']);
    $link = html_writer::link($url, get_string('additionalhtml', 'tiny_c4lauthor'), ['target' => '_blank']);
    $description = get_string('custompreviewcssdesc', 'tiny_c4lauthor', $link);
    $setting = new admin_setting_configtextarea($name, $title, $description, '');
    $settings->add($setting);

    // Images bank.
    $fileareaid = 'customimagesbank';
    $name = 'tiny_c4lauthor/customimagesbank';
    $title = get_string('customimagesbank', 'tiny_c4lauthor');
    $description = get_string('customimagesbankdesc', 'tiny_c4lauthor');
    $options = ['accepted_types' => ['image'], 'maxfiles' => -1];
    $setting = new admin_setting_configstoredfile($name, $title, $description, $fileareaid, 0, $options);
    $settings->add($setting);

    // Dynamic per-component settings.
    if (!$customcompcount = get_config('tiny_c4lauthor', 'customcompcount')) {
        $customcompcount = 0;
    }

    for ($componentindex = 1; $componentindex <= $customcompcount; $componentindex++) {
        // Header.
        $name = 'tiny_c4lauthor/customcomptitle' . $componentindex;
        $title = get_string('customcomptitle', 'tiny_c4lauthor', $componentindex);
        $title = html_writer::tag('h4', $title);
        $setting = new admin_setting_description($name, '', $title);
        $settings->add($setting);

        // Enable.
        $name = 'tiny_c4lauthor/customcompenable' . $componentindex;
        $title = get_string('customcompenable', 'tiny_c4lauthor', $componentindex);
        $description = get_string('customcompenabledesc', 'tiny_c4lauthor');
        $setting = new admin_setting_configcheckbox($name, $title, $description, 0);
        $settings->add($setting);

        // Name.
        $name = 'tiny_c4lauthor/customcompname' . $componentindex;
        $title = get_string('customcompname', 'tiny_c4lauthor', $componentindex);
        $description = get_string('customcompnamedesc', 'tiny_c4lauthor');
        $setting = new admin_setting_configtext_with_maxlength($name, $title, $description, '', PARAM_TEXT, null, 15);
        $settings->add($setting);

        // Icon.
        $fileareaid = 'customcompicon' . $componentindex;
        $name = 'tiny_c4lauthor/customcompicon' . $componentindex;
        $title = get_string('customcompicon', 'tiny_c4lauthor', $componentindex);
        $description = get_string('customcompicondesc', 'tiny_c4lauthor');
        $options = ['accepted_types' => ['image'], 'maxfiles' => 1];
        $setting = new admin_setting_configstoredfile($name, $title, $description, $fileareaid, 0, $options);
        $settings->add($setting);

        // Text.
        $name = 'tiny_c4lauthor/customcomptext' . $componentindex;
        $title = get_string('customcomptext', 'tiny_c4lauthor', $componentindex);
        $description = get_string('customcomptextdesc', 'tiny_c4lauthor');
        $setting = new admin_setting_configtextarea($name, $title, $description, '', PARAM_TEXT);
        $settings->add($setting);

        // Code.
        $name = 'tiny_c4lauthor/customcompcode' . $componentindex;
        $title = get_string('customcompcode', 'tiny_c4lauthor', $componentindex);
        $description = get_string('customcompcodedesc', 'tiny_c4lauthor');
        $setting = new admin_setting_configtextarea($name, $title, $description, '');
        $settings->add($setting);

        // Variant.
        $name = 'tiny_c4lauthor/customcompvariant' . $componentindex;
        $title = get_string('customcompvariant', 'tiny_c4lauthor', $componentindex);
        $description = get_string('customcompvariantdesc', 'tiny_c4lauthor');
        $setting = new admin_setting_configcheckbox($name, $title, $description, 0);
        $settings->add($setting);

        // Sortorder.
        $name = 'tiny_c4lauthor/customcompsortorder' . $componentindex;
        $title = get_string('customcompsortorder', 'tiny_c4lauthor', $componentindex);
        $description = get_string('customcompsortorderdesc', 'tiny_c4lauthor');
        $setting = new admin_setting_configtext($name, $title, $description, $componentindex, PARAM_INT);
        $settings->add($setting);
    }
}

// The settings and the standalone fallback page share the plugin's category.
$ADMIN->add('tiny_c4lauthor', $settings);
$ADMIN->add('tiny_c4lauthor', new admin_externalpage(
    'tiny_c4lauthor_standalone',
    new lang_string('standalone_heading', 'tiny_c4lauthor'),
    new moodle_url('/lib/editor/tiny/plugins/c4lauthor/admin/standalone.php')
));
$settings = null;
