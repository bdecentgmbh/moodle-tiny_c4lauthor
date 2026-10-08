@editor @editor_tiny @tiny @tiny_c4lauthor @javascript
Feature: Insert C4L components with the C4L Author modal
  In order to structure my teaching content
  As a teacher
  I need to insert a component in the C4L Author modal and apply it to the editor

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

  Scenario: Applying the modal adds the chosen component to the editor content
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    When I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Key concept" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then ".c4lv-keyconcept" "css_element" should exist in the "region-main" "region"
    And I should see "Hello world" in the "region-main" "region"

  Scenario: Cancelling the modal leaves the editor content unchanged
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    When I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Key concept" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    And I click on "Cancel" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then ".c4lv-keyconcept" "css_element" should not exist in the "region-main" "region"
    And I should see "Hello world" in the "region-main" "region"
