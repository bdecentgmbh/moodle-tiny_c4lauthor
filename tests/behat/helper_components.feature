@editor @editor_tiny @tiny @tiny_c4lauthor @javascript
Feature: Panel list, timeline and combo helpers
  In order to structure lists, sequences and text with images
  As a teacher
  I need to insert the panel list, timeline and combo helpers and edit them precisely

  Background:
    Given the following "courses" exist:
      | fullname | shortname |
      | Course 1 | C1        |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Teacher   | One      | teacher1@example.com |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher1 | C1     | editingteacher |
    And the following "activities" exist:
      | activity | name   | course | idnumber | intro       | introformat | content            | contentformat |
      | page     | Page 1 | C1     | page1    | Description | 1           | <p>Hello world</p> | 1             |

  Scenario Outline: Each helper can be inserted and saved
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    When I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "<label>" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then "<selector>" "css_element" should exist in the "region-main" "region"

    Examples:
      | label      | selector                              |
      | Panel list | ul.c4lv-panellist.c4l-numbered-variant |
      | Timeline   | .c4lv-timeline .c4l-timeline-event    |
      | Combo      | .c4l-combo.c4l-text-image-variant     |

  Scenario: A timeline event's year can be changed in precision mode
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    And I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Timeline" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    When I click on "Precision" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    And I switch to "tiny_c4lauthor__precision-iframe" class iframe
    And I click on "2012" "text"
    And I switch to the main frame
    And I set the field with xpath "(//input[@data-sub='0'])[2]" to "1999"
    And I click on "Content" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then I should see "1999" in the ".c4lv-timeline" "css_element"
    And I should not see "2012" in the ".c4lv-timeline" "css_element"
