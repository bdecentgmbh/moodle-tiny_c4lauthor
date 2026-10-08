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
 * The components and variants C4L Author offers.
 *
 * Each component's markup is in templates/components/<name>.mustache. See
 * \tiny_c4lauthor\local\components for what each key means.
 *
 * @package    tiny_c4lauthor
 * @copyright  2026 Roger Segú, bdecent gmbh <https://bdecent.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$components = [
    'keyconcept' => [
        'id' => 0,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/keyconcept',
        'iconclass' => 'c4l-keyconcept-icon',
        'menuicon' => 'noun_project_icons/c4l_keyconcept_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc tempor odio vel turpis consequat sodales.',
        'docs' => [
            'description' => 'docs_keyconcept_desc',
            'usecases' => ['docs_keyconcept_use1', 'docs_keyconcept_use2', 'docs_keyconcept_use3'],
        ],
        'variants' => ['full-width'],
        'convertible' => 1,
        'precision' => [
            [
                'selector' => 'span[data-id]',
                'label' => 'precision_field_text',
                'type' => 'textarea',
                'innerhtml' => true,
                'fallback' => true,
            ],
        ],
    ],
    'tip' => [
        'id' => 1,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/tip',
        'iconclass' => 'c4l-tip-icon',
        'menuicon' => 'noun_project_icons/c4l_tip_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc tempor odio vel turpis consequat sodales.',
        'docs' => [
            'description' => 'docs_tip_desc',
            'usecases' => ['docs_tip_use1', 'docs_tip_use2', 'docs_tip_use3'],
        ],
        'variants' => ['full-width'],
        'convertible' => 2,
        'precision' => [
            [
                'selector' => 'span[data-id]',
                'label' => 'precision_field_text',
                'type' => 'textarea',
                'innerhtml' => true,
                'fallback' => true,
            ],
        ],
    ],
    'reminder' => [
        'id' => 2,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/reminder',
        'iconclass' => 'c4l-reminder-icon',
        'menuicon' => 'noun_project_icons/c4l_reminder_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc tempor odio vel turpis consequat sodales.',
        'docs' => [
            'description' => 'docs_reminder_desc',
            'usecases' => ['docs_reminder_use1', 'docs_reminder_use2', 'docs_reminder_use3'],
        ],
        'variants' => ['full-width'],
        'convertible' => 3,
        'precision' => [
            [
                'selector' => 'span[data-id]',
                'label' => 'precision_field_text',
                'type' => 'textarea',
                'innerhtml' => true,
                'fallback' => true,
            ],
        ],
    ],
    'quote' => [
        'id' => 3,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/quote',
        'iconclass' => 'c4l-quote-icon',
        'menuicon' => 'noun_project_icons/c4l_quote_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus a posuere nibh, eu '
            . 'mollis lacus. Praesent dictum in velit sed dapibus.',
        'docs' => [
            'description' => 'docs_quote_desc',
            'usecases' => ['docs_quote_use1', 'docs_quote_use2', 'docs_quote_use3', 'docs_quote_use4'],
        ],
        'variants' => ['full-width', 'quote'],
        'convertible' => 9,
        'precision' => [
            [
                'selector' => '.c4l-quote-text p',
                'label' => 'precision_field_text',
                'type' => 'textarea',
            ],
            [
                'selector' => '.c4l-embedded-caption span',
                'label' => 'precision_field_author',
                'type' => 'input',
                'optional' => true,
            ],
            [
                'selector' => '.c4l-embedded-caption',
                'label' => 'precision_field_source',
                'type' => 'input',
                'optional' => true,
                'handler' => 'captiontext',
            ],
        ],
    ],
    'dodontcards' => [
        'id' => 4,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/dodontcards',
        'iconclass' => 'c4l-dodontcards-icon',
        'menuicon' => 'c4l_dodontcards_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus a posuere nibh, eu '
            . 'mollis lacus. Praesent dictum in velit sed dapibus.Orci varius natoque penatibus et '
            . 'magnis dis parturient montes, nascetur ridiculus mus.',
        'docs' => [
            'description' => 'docs_dodontcards_desc',
            'usecases' => ['docs_dodontcards_use1', 'docs_dodontcards_use2'],
        ],
        'variants' => ['full-width'],
        'precision' => [
            [
                'selector' => '.c4l-dodontcards-do',
                'label' => 'precision_field_do',
                'type' => 'textarea',
            ],
            [
                'selector' => '.c4l-dodontcards-dont',
                'label' => 'precision_field_dont',
                'type' => 'textarea',
            ],
        ],
    ],
    'readingcontext' => [
        'id' => 5,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/readingcontext',
        'iconclass' => 'c4l-readingcontext-icon',
        'menuicon' => 'noun_project_icons/c4l_readingcontext_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus leo, hendrerit ac sem '
            . 'vitae, posuere egestas nisi. Lorem ipsum dolor sit amet. Phasellus leo, hendrerit ac sem '
            . 'vitae, posuere egestas nisi.',
        'docs' => [
            'description' => 'docs_readingcontext_desc',
            'usecases' => ['docs_readingcontext_use1', 'docs_readingcontext_use2', 'docs_readingcontext_use3'],
        ],
        'variants' => ['full-width', 'quote', 'comfort-reading'],
        'convertible' => 8,
        'precision' => [
            [
                'selector' => 'p',
                'label' => 'precision_field_text',
                'type' => 'textarea',
            ],
            [
                'selector' => '.c4l-embedded-caption span',
                'label' => 'precision_field_author',
                'type' => 'input',
                'optional' => true,
            ],
            [
                'selector' => '.c4l-embedded-caption',
                'label' => 'precision_field_source',
                'type' => 'input',
                'optional' => true,
                'handler' => 'captiontext',
            ],
        ],
    ],
    'example' => [
        'id' => 6,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/example',
        'iconclass' => 'c4l-example-icon',
        'menuicon' => 'c4l_example_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus a posuere nibh, eu '
            . 'mollis lacus. Praesent dictum in velit sed dapibus. Orci varius natoque penatibus et '
            . 'magnis dis parturient montes, nascetur ridiculus mus.',
        'docs' => [
            'description' => 'docs_example_desc',
            'usecases' => ['docs_example_use1', 'docs_example_use2'],
        ],
        'variants' => ['full-width'],
        'convertible' => 10,
        'precision' => [
            [
                'selector' => 'h1',
                'label' => 'precision_field_title',
                'type' => 'input',
            ],
            [
                'selector' => 'p',
                'label' => 'precision_field_text',
                'type' => 'textarea',
            ],
        ],
    ],
    'figure' => [
        'id' => 7,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/figure',
        'iconclass' => 'c4l-figure-icon',
        'menuicon' => 'c4l_figure_icon',
        'text' => 'Consectetur adipiscing elit.',
        'docs' => [
            'description' => 'docs_figure_desc',
            'usecases' => ['docs_figure_use1', 'docs_figure_use2', 'docs_figure_use3'],
        ],
        'variants' => ['full-width', 'caption'],
        'precision' => [
            [
                'selector' => 'img',
                'label' => 'precision_field_image_alt',
                'type' => 'image-alt',
            ],
            [
                'selector' => '.c4l-figure-footer',
                'label' => 'precision_field_caption',
                'type' => 'input',
                'optional' => true,
            ],
            [
                'selector' => '.c4l-figure-caption',
                'label' => 'precision_field_source',
                'type' => 'input',
                'optional' => true,
            ],
        ],
    ],
    'tag' => [
        'id' => 8,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/tag',
        'iconclass' => 'c4l-tag-icon',
        'menuicon' => 'noun_project_icons/c4l_tag_icon',
        'text' => 'Lorem ipsum',
        'docs' => [
            'description' => 'docs_tag_desc',
            'usecases' => ['docs_tag_use1', 'docs_tag_use2'],
        ],
        'variants' => ['align-right'],
        'precision' => [
            [
                'selector' => null,
                'label' => 'precision_field_text',
                'type' => 'input',
                'handler' => 'trimmedtext',
            ],
        ],
    ],
    'inlinetag' => [
        'id' => 9,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/inlinetag',
        'iconclass' => 'c4l-inlinetag-icon',
        'menuicon' => 'c4l_inlinetag_icon',
        'text' => 'Text',
        'docs' => [
            'description' => 'docs_inlinetag_desc',
            'usecases' => ['docs_inlinetag_use1', 'docs_inlinetag_use2'],
        ],
        'variants' => [],
        'precision' => [
            [
                'selector' => null,
                'label' => 'precision_field_text',
                'type' => 'input',
                'handler' => 'textcontent',
            ],
        ],
    ],
    'attention' => [
        'id' => 10,
        'category' => 'procedural',
        'template' => 'tiny_c4lauthor/components/attention',
        'iconclass' => 'c4l-attention-icon',
        'menuicon' => 'c4l_attention_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc tempor odio vel turpis consequat sodales.',
        'docs' => [
            'description' => 'docs_attention_desc',
            'usecases' => ['docs_attention_use1', 'docs_attention_use2'],
        ],
        'variants' => ['full-width'],
        'convertible' => 4,
        'precision' => [
            [
                'selector' => 'span[data-id]',
                'label' => 'precision_field_text',
                'type' => 'textarea',
                'innerhtml' => true,
                'fallback' => true,
            ],
        ],
    ],
    'estimatedtime' => [
        'id' => 11,
        'category' => 'procedural',
        'template' => 'tiny_c4lauthor/components/estimatedtime',
        'iconclass' => 'c4l-estimatedtime-icon',
        'menuicon' => 'noun_project_icons/c4l_estimatedtime_icon',
        'text' => '15',
        'docs' => [
            'description' => 'docs_estimatedtime_desc',
            'usecases' => ['docs_estimatedtime_use1', 'docs_estimatedtime_use2'],
        ],
        'variants' => ['align-left'],
        'precision' => [
            [
                'selector' => null,
                'label' => 'precision_field_value',
                'type' => 'input',
                'handler' => 'valuebeforesuffix',
            ],
        ],
    ],
    'duedate' => [
        'id' => 12,
        'category' => 'procedural',
        'template' => 'tiny_c4lauthor/components/duedate',
        'iconclass' => 'c4l-duedate-icon',
        'menuicon' => 'noun_project_icons/c4l_duedate_icon',
        'text' => 'November 17th',
        'docs' => [
            'description' => 'docs_duedate_desc',
            'usecases' => ['docs_duedate_use1'],
        ],
        'variants' => ['align-left'],
        'precision' => [
            [
                'selector' => null,
                'label' => 'precision_field_value',
                'type' => 'input',
                'handler' => 'trimmedtext',
            ],
        ],
    ],
    'proceduralcontext' => [
        'id' => 13,
        'category' => 'procedural',
        'template' => 'tiny_c4lauthor/components/proceduralcontext',
        'iconclass' => 'c4l-proceduralcontext-icon',
        'menuicon' => 'c4l_proceduralcontext_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus a posuere nibh, eu '
            . 'mollis lacus. Praesent dictum in velit sed dapibus. Orci varius natoque penatibus et '
            . 'magnis dis parturient montes, nascetur ridiculus mus. Nulla quis lorem aliquet, fermentum '
            . 'dolor ac, venenatis turpis.',
        'docs' => [
            'description' => 'docs_proceduralcontext_desc',
            'usecases' => ['docs_proceduralcontext_use1', 'docs_proceduralcontext_use2', 'docs_proceduralcontext_use3'],
        ],
        'variants' => [],
        'convertible' => 7,
        'precision' => [
            [
                'selector' => null,
                'label' => 'precision_field_text',
                'type' => 'textarea',
                'handler' => 'textcontent',
            ],
        ],
    ],
    'learningoutcomes' => [
        'id' => 14,
        'category' => 'procedural',
        'template' => 'tiny_c4lauthor/components/learningoutcomes',
        'iconclass' => 'c4l-learningoutcomes-icon',
        'menuicon' => 'c4l_learningoutcomes_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut porta, neque id feugiat '
            . 'consectetur, enim ipsum tincidunt nunc, id suscipit mauris urna sit amet lectus.',
        'docs' => [
            'description' => 'docs_learningoutcomes_desc',
            'usecases' => ['docs_learningoutcomes_use1', 'docs_learningoutcomes_use2'],
        ],
        'variants' => ['full-width', 'ordered-list'],
        'precision' => [
            [
                'selector' => '.c4l-learningoutcomes-title',
                'label' => 'precision_field_title',
                'type' => 'input',
            ],
            [
                'selector' => '.c4l-learningoutcomes-list > li:not(.c4l-learningoutcomes-title)',
                'label' => 'precision_field_item',
                'type' => 'list',
            ],
        ],
    ],
    'gradingvalue' => [
        'id' => 15,
        'category' => 'evaluative',
        'template' => 'tiny_c4lauthor/components/gradingvalue',
        'iconclass' => 'c4l-gradingvalue-icon',
        'menuicon' => 'noun_project_icons/c4l_gradingvalue_icon',
        'text' => '33.3%',
        'docs' => [
            'description' => 'docs_gradingvalue_desc',
            'usecases' => ['docs_gradingvalue_use1'],
        ],
        'variants' => ['align-left'],
        'precision' => [
            [
                'selector' => null,
                'label' => 'precision_field_value',
                'type' => 'input',
                'handler' => 'valueafterprefix',
            ],
        ],
    ],
    'expectedfeedback' => [
        'id' => 16,
        'category' => 'evaluative',
        'template' => 'tiny_c4lauthor/components/expectedfeedback',
        'iconclass' => 'c4l-expectedfeedback-icon',
        'menuicon' => 'noun_project_icons/c4l_expectedfeedback_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus a posuere nibh, eu '
            . 'mollis lacus. Praesent dictum in velit sed dapibus.',
        'docs' => [
            'description' => 'docs_expectedfeedback_desc',
            'usecases' => ['docs_expectedfeedback_use1', 'docs_expectedfeedback_use2', 'docs_expectedfeedback_use3'],
        ],
        'variants' => ['full-width'],
        'convertible' => 6,
        'precision' => [
            [
                'selector' => 'span[data-id]',
                'label' => 'precision_field_text',
                'type' => 'textarea',
                'innerhtml' => true,
                'fallback' => true,
            ],
        ],
    ],
    'allpurposecard' => [
        'id' => 17,
        'category' => 'helper',
        'template' => 'tiny_c4lauthor/components/allpurposecard',
        'iconclass' => 'c4l-allpurposecard-icon',
        'menuicon' => 'c4l_allpurposecard_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus a posuere nibh, eu '
            . 'mollis lacus. Praesent dictum in velit sed dapibus. Orci varius natoque penatibus et '
            . 'magnis dis parturient montes, nascetur ridiculus mus.',
        'docs' => [
            'description' => 'docs_allpurposecard_desc',
            'usecases' => ['docs_allpurposecard_use1', 'docs_allpurposecard_use2'],
        ],
        'variants' => ['full-width'],
        'convertible' => 5,
        'precision' => [
            [
                'selector' => 'span[data-id]',
                'label' => 'precision_field_text',
                'type' => 'textarea',
                'innerhtml' => true,
                'fallback' => true,
            ],
        ],
    ],
    'conceptreview' => [
        'id' => 18,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/conceptreview',
        'iconclass' => 'c4l-conceptreview-icon',
        'menuicon' => 'c4l_conceptreview_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc tempor odio vel turpis consequat sodales.',
        'docs' => [
            'description' => 'docs_conceptreview_desc',
            'usecases' => ['docs_conceptreview_use1', 'docs_conceptreview_use2'],
        ],
        'variants' => ['full-width'],
        'convertible' => 11,
        'precision' => [
            [
                'selector' => '.c4l-concept-review-title',
                'label' => 'precision_field_title',
                'type' => 'input',
            ],
            [
                'selector' => 'span[data-id]',
                'label' => 'precision_field_text',
                'type' => 'textarea',
                'innerhtml' => true,
                'fallback' => true,
            ],
        ],
    ],
    'furtherreading' => [
        'id' => 19,
        'category' => 'contextual',
        'template' => 'tiny_c4lauthor/components/furtherreading',
        'iconclass' => 'c4l-furtherreading-icon',
        'menuicon' => 'c4l_furtherreading_icon',
        'text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut porta, neque id feugiat '
            . 'consectetur, enim ipsum tincidunt nunc, id suscipit mauris urna sit amet lectus.',
        'docs' => [
            'description' => 'docs_furtherreading_desc',
            'usecases' => [
                'docs_furtherreading_use1',
                'docs_furtherreading_use2',
                'docs_furtherreading_use3',
                'docs_furtherreading_use4',
            ],
        ],
        'variants' => ['full-width'],
        'precision' => [
            [
                'selector' => '.c4l-further-reading-title',
                'label' => 'precision_field_title',
                'type' => 'input',
            ],
            [
                'selector' => '.c4l-furtherreading-list > li:not(.c4l-further-reading-title)',
                'label' => 'precision_field_item',
                'type' => 'list',
            ],
        ],
    ],
    'aiuseallowed' => [
        'id' => 20,
        'category' => 'evaluative',
        'template' => 'tiny_c4lauthor/components/aiuseallowed',
        'iconclass' => 'c4l-aiuseallowed-icon',
        'menuicon' => 'c4l_aiuseallowed_icon',
        'text' => 'Use of AI is <strong>allowed</strong>',
        'docs' => [
            'description' => 'docs_aiuseallowed_desc',
            'usecases' => ['docs_aiuseallowed_use1', 'docs_aiuseallowed_use2'],
        ],
        'variants' => ['align-left'],
        'precision' => [
            [
                'selector' => null,
                'label' => 'precision_field_text',
                'type' => 'input',
                'handler' => 'trimmedtext',
            ],
        ],
    ],
    'aiusenotallowed' => [
        'id' => 21,
        'category' => 'evaluative',
        'template' => 'tiny_c4lauthor/components/aiusenotallowed',
        'iconclass' => 'c4l-aiusenotallowed-icon',
        'menuicon' => 'c4l_aiusenotallowed_icon',
        'text' => 'Use of AI is <strong>not allowed</strong>',
        'docs' => [
            'description' => 'docs_aiusenotallowed_desc',
            'usecases' => ['docs_aiusenotallowed_use1', 'docs_aiusenotallowed_use2', 'docs_aiusenotallowed_use3'],
        ],
        'variants' => ['align-left'],
        'precision' => [
            [
                'selector' => null,
                'label' => 'precision_field_text',
                'type' => 'input',
                'handler' => 'trimmedtext',
            ],
        ],
    ],
    'aiusereported' => [
        'id' => 22,
        'category' => 'evaluative',
        'template' => 'tiny_c4lauthor/components/aiusereported',
        'iconclass' => 'c4l-aiusereported-icon',
        'menuicon' => 'c4l_aiusereported_icon',
        'text' => 'Use of AI must be <strong>reported</strong>',
        'docs' => [
            'description' => 'docs_aiusereported_desc',
            'usecases' => [
                'docs_aiusereported_use1',
                'docs_aiusereported_use2',
                'docs_aiusereported_use3',
                'docs_aiusereported_use4',
            ],
        ],
        'variants' => ['align-left'],
        'precision' => [
            [
                'selector' => null,
                'label' => 'precision_field_text',
                'type' => 'input',
                'handler' => 'trimmedtext',
            ],
        ],
    ],
    'statement' => [
        'id' => 33,
        'category' => 'procedural',
        'template' => 'tiny_c4lauthor/components/statement',
        'iconclass' => 'c4l-statement-icon',
        'menuicon' => 'c4l-statement-icon',
        'wrapperclass' => 'c4lv-statement',
        'text' => 'Task statement.',
        'docs' => [
            'description' => 'docs_statement_desc',
            'usecases' => [],
        ],
        'variants' => ['full-width'],
        'precision' => [
            [
                'selector' => '.task-statement p',
                'label' => 'precision_field_text',
                'type' => 'textarea',
            ],
        ],
    ],
    'assessment' => [
        'id' => 37,
        'category' => 'evaluative',
        'template' => 'tiny_c4lauthor/components/assessment',
        'iconclass' => 'c4l-assessment-icon',
        'menuicon' => 'c4l-assessment-icon',
        'wrapperclass' => 'c4lv-assessment',
        'text' => 'Information about the assessment.',
        'docs' => [
            'description' => 'docs_assessment_desc',
            'usecases' => [],
        ],
        'variants' => ['full-width'],
        'precision' => [
            [
                'selector' => '.teacher-assessment-text p',
                'label' => 'precision_field_text',
                'type' => 'textarea',
            ],
        ],
    ],
    'panellist' => [
        'id' => 55,
        'category' => 'helper',
        'template' => 'tiny_c4lauthor/components/panellist',
        'iconclass' => 'c4l-panellist-icon',
        'menuicon' => 'c4l_panellist_icon',
        'text' => 'Curabitur gravida est ultrices quam.',
        'docs' => [
            'description' => 'docs_panellist_desc',
            'usecases' => [],
        ],
        'variants' => ['numbered', 'checkmarks', 'compact', 'full-width'],
        'precision' => [
            [
                'selector' => 'li',
                'label' => 'precision_field_item',
                'type' => 'list',
            ],
        ],
    ],
    'timeline' => [
        'id' => 56,
        'category' => 'helper',
        'template' => 'tiny_c4lauthor/components/timeline',
        'iconclass' => 'c4l-timeline-icon',
        'menuicon' => 'c4l_timeline_icon',
        'text' => 'Description of the event.',
        'docs' => [
            'description' => 'docs_timeline_desc',
            'usecases' => [],
        ],
        'variants' => ['full-width', 'split', 'continuitybefore', 'continuityafter'],
        'precision' => [
            [
                'selector' => '.c4l-timeline-event',
                'label' => 'precision_field_event',
                'type' => 'list',
                'handler' => 'timelineevents',
                'subfields' => [
                    [
                        'key' => 'year',
                        'selector' => '.c4l-timeline-year',
                        'type' => 'input',
                        'label' => 'precision_field_year',
                    ],
                    [
                        'key' => 'text',
                        'selector' => '.c4l-timeline-text',
                        'type' => 'textarea',
                        'label' => 'precision_field_text',
                    ],
                ],
            ],
        ],
    ],
    'combo' => [
        'id' => 48,
        'category' => 'helper',
        'template' => 'tiny_c4lauthor/components/combo',
        'iconclass' => 'c4l-combo-icon',
        'menuicon' => 'c4l-combo-icon',
        'wrapperclass' => 'c4l-combo',
        'text' => 'Lorem ipsum dolor sit amet.',
        'docs' => [
            'description' => 'docs_combo_desc',
            'usecases' => [],
        ],
        'variants' => ['text-image', 'image-text'],
        'precision' => [
            [
                'selector' => '.text p',
                'label' => 'precision_field_text',
                'type' => 'textarea',
            ],
            [
                'selector' => '.text li',
                'label' => 'precision_field_item',
                'type' => 'list',
            ],
            [
                'selector' => 'img',
                'label' => 'precision_field_image_alt',
                'type' => 'image-alt',
            ],
        ],
    ],
];

$variants = [
    'align-center' => [
        'id' => 0,
    ],
    'align-left' => [
        'id' => 1,
    ],
    'align-right' => [
        'id' => 2,
    ],
    'caption' => [
        'id' => 3,
        'template' => 'tiny_c4lauthor/variants/caption',
    ],
    'comfort-reading' => [
        'id' => 4,
    ],
    'dont-card-only' => [
        'id' => 5,
    ],
    'full-width' => [
        'id' => 6,
        'excludes' => ['split'],
    ],
    'ordered-list' => [
        'id' => 7,
    ],
    'quote' => [
        'id' => 8,
        'template' => 'tiny_c4lauthor/variants/quote',
    ],
    'checkmarks' => [
        'id' => 9,
        'group' => 'list-bullet',
    ],
    'numbered' => [
        'id' => 18,
        'group' => 'list-bullet',
    ],
    'continuitybefore' => [
        'id' => 19,
    ],
    'continuityafter' => [
        'id' => 20,
    ],
    'split' => [
        'id' => 21,
        'excludes' => ['full-width'],
    ],
    'compact' => [
        'id' => 22,
    ],
    'text-image' => [
        'id' => 15,
        'group' => 'combo-layout',
    ],
    'image-text' => [
        'id' => 16,
        'group' => 'combo-layout',
    ],
];
