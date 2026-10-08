@editor @editor_tiny @tiny @tiny_c4lauthor @javascript
Feature: Components insert their declared markup
  In order to get consistent content
  As a teacher
  I need each component to insert the markup it is declared with

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

  Scenario Outline: A component inserts its template
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    When I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "<label>" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then "<selector>" "css_element" should exist in the "region-main" "region"
    And I should see "<text>" in the "<selector>" "css_element"

    Examples:
      | label             | selector                                               | text              |
      | Key concept       | div.c4lv-keyconcept                                    | Lorem ipsum dolor |
      | Quote             | .c4lv-quote .c4l-quote-text p                          | Lorem ipsum dolor |
      | Learning outcomes | ul.c4lv-learningoutcomes li.c4l-learningoutcomes-title | Learning outcomes |
      | Estimated time    | .c4l-inline-group .c4lv-estimatedtime                  | min               |
      | Grading value     | .c4l-inline-group .c4lv-gradingvalue                   | 33.3%             |

  Scenario: Precision mode edits a field through its handler
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    And I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Tag" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    When I click on "Precision" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    And I switch to "tiny_c4lauthor__precision-iframe" class iframe
    And I click on ".c4lv-tag" "css_element"
    And I switch to the main frame
    And I set the field with xpath "//input[@data-field='0']" to "Week 3"
    And I click on "Content" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then I should see "Week 3" in the ".c4lv-tag" "css_element"

  Scenario Outline: Precision mode keeps the fixed text around a value
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    And I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "<label>" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    When I click on "Precision" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    And I switch to "tiny_c4lauthor__precision-iframe" class iframe
    And I click on "<selector>" "css_element"
    And I switch to the main frame
    And I set the field with xpath "//input[@data-field='0']" to "<value>"
    And I click on "Content" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then I should see "<result>" in the "<selector>" "css_element"

    Examples:
      | label          | selector            | value | result             |
      | Estimated time | .c4lv-estimatedtime | 45    | 45 min             |
      | Grading value  | .c4lv-gradingvalue  | 50%   | Grading value: 50% |

  Scenario: A custom component inserts the HTML the admin wrote
    Given the following config values are set as admin:
      | customcompcount   | 1                                                     | tiny_c4lauthor |
      | customcompenable1 | 1                                                     | tiny_c4lauthor |
      | customcompname1   | Info box                                              | tiny_c4lauthor |
      | customcompcode1   | <div class="{{CUSTOMCLASS}}"><p>{{PLACEHOLDER}}</p></div> | tiny_c4lauthor |
    And I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    When I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Info box" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then I should see "Lorem ipsum dolor sit amet" in the ".c4lv-customcomp1.c4lv-custom-component" "css_element"
