@editor @editor_tiny @tiny @tiny_c4lauthor @javascript
Feature: Standalone fallback for content without the plugin
  In order to keep C4L content working if the plugin is uninstalled
  As an admin
  I need to copy the content styles and the page script

  Scenario: The admin copies the styles and the script
    Given I log in as "admin"
    When I navigate to "Plugins > Text editors > TinyMCE editor > C4L Author > Standalone fallback" in site administration
    Then I should see "Standalone fallback"
    And "textarea[data-c4l-standalone='css']" "css_element" should exist
    And "textarea[data-c4l-standalone='js']" "css_element" should exist
    And I should see ".c4lv-tabs" in the "textarea[data-c4l-standalone='css']" "css_element"
    And I should see "C4L_AUTHOR_STRINGS" in the "textarea[data-c4l-standalone='js']" "css_element"
