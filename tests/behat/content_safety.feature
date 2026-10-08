@editor @editor_tiny @tiny @tiny_c4lauthor @javascript
Feature: Stored content cannot run scripts in C4L Author
  In order to edit content written by others safely
  As a teacher
  I need C4L Author to treat editor content as data, never as code in the page

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

  Scenario: Content that tries to close the modal's textarea stays inert
    Given the following "activities" exist:
      | activity | name   | course | idnumber | intro       | introformat | contentformat | content |
      | page     | Page 1 | C1     | page1    | Description | 1           | 1             | <p>Hello world</p><script>/*</textarea><img src="x" onerror="document.body.setAttribute('data-c4lpwned', '1')">*/</script> |
    And I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    When I click on the "C4L Author" button for the "Page content" TinyMCE editor
    Then "body[data-c4lpwned]" "css_element" should not exist
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    And I should see "Hello world" in the "region-main" "region"

  Scenario: The precision preview does not run scripts and leaves no markers in the content
    Given the following "activities" exist:
      | activity | name   | course | idnumber | intro       | introformat | contentformat | content |
      | page     | Page 1 | C1     | page1    | Description | 1           | 1             | <div class="c4lv-tip" role="note"><span data-id="R1">Tip text</span></div><script>parent.document.body.setAttribute('data-c4lpwned', '1');</script> |
    And I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    And I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And "body[data-c4lpwned]" "css_element" should not exist
    When I click on "Precision" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    Then "body[data-c4lpwned]" "css_element" should not exist
    And I switch to "tiny_c4lauthor__precision-iframe" class iframe
    And I click on "Tip text" "text"
    And I switch to the main frame
    And ".tiny_c4lauthor__precision-fields" "css_element" should exist
    And "body[data-c4lpwned]" "css_element" should not exist
    And I click on "Content" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    And ".c4lv-tip" "css_element" should exist in the "region-main" "region"
    And "[data-c4l-idx]" "css_element" should not exist in the "region-main" "region"
    And "[data-c4l-selected]" "css_element" should not exist in the "region-main" "region"
