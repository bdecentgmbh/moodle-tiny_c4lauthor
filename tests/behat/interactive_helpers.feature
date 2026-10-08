@editor @editor_tiny @tiny @tiny_c4lauthor @javascript
Feature: Helpers from the bdecent build, with their page behaviour
  In order to structure content with tabs, slides and collapsible sections
  As a teacher
  I need the helpers to insert, to work on the page and to keep older content working

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
      | label         | selector                                         |
      | Styled list   | ul.c4lv-styledlist.c4l-checkmarks-variant        |
      | Link block    | a.c4l-linkblock .link-name                       |
      | Tabs          | .c4lv-tabs .c4l-tablist-button                   |
      | Carousel      | .c4lv-carousel .c4l-slide                        |
      | Collapsible   | .c4lv-collapsible .c4l-collapsible-toggle        |
      | Styled table  | .c4l-table-container.c4l-solid-variant table     |

  Scenario: Tabs show one tab at a time on the page
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    And I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Tabs" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then I should not see "Content tab 2."
    And I click on "Tab 2" "button" in the ".c4l-tablist" "css_element"
    And I should see "Content tab 2."
    And I should not see "Content tab 3."

  Scenario: A collapsible opens its content
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    And I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Collapsible" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then I should not see "Collapsible content here."
    And I click on "Collapsible title" "button" in the ".c4lv-collapsible" "css_element"
    And I should see "Collapsible content here."

  Scenario: A carousel moves between its slides
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    And I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Carousel" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then ".c4l-carousel-indicator:nth-child(1).active" "css_element" should exist
    And I click on "Next slide" "button"
    And ".c4l-carousel-indicator:nth-child(2).active" "css_element" should exist

  Scenario: Tabs and slides can be added in the editor
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    And I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Tabs" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    And I click on "Carousel" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    When I click on the "+ Add tab" control in the C4L Author editor
    And I click on the "+ Add slide" control in the C4L Author editor
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I switch to the "Page content" TinyMCE editor iframe
    Then "[data-c4l-active]" "css_element" should not exist
    And "[data-c4l-editing]" "css_element" should not exist
    And ".c4l-editor-toolbar" "css_element" should not exist
    And I switch to the main frame
    And I press "Save and display"
    And I should see "Tab 4" in the ".c4l-tablist" "css_element"
    And ".c4l-carousel-indicator:nth-child(4)" "css_element" should exist

  Scenario Outline: Precision mode points a link block only to a web or mail address
    Given I am on the "Page 1" "page activity editing" page logged in as "teacher1"
    And I click on the "C4L Author" button for the "Page content" TinyMCE editor
    And I click on "Link block" "button" in the ".tiny_c4lauthor__sidebar" "css_element"
    When I click on "Precision" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    And I switch to "tiny_c4lauthor__precision-iframe" class iframe
    And I click on "a.c4l-linkblock" "css_element"
    And I switch to the main frame
    And I set the field with xpath "//input[@data-field='1']" to "<address>"
    And I click on "Content" "button" in the ".tiny_c4lauthor__view-switcher" "css_element"
    And I click on "Apply" "button" in the ".tiny_c4lauthor__footer" "css_element"
    And I press "Save and display"
    Then the "href" attribute of "a.c4l-linkblock" "css_element" should contain "<href>"

    Examples:
      | address             | href        |
      | https://moodle.org/ | moodle.org  |
      | javascript:alert(1) | #           |

  Scenario: Content of the bdecent build keeps working where Moodle cleans it, and its link blocks run no scripts
    Given the following "activities" exist:
      | activity | name         | course | idnumber |
      | forum    | Forum 1      | C1     | forum    |
    And the following "mod_forum > discussions" exist:
      | user     | forum | name        | message |
      | teacher1 | forum | Old helpers | <div class="c4l-tabs-container"><ul class="nav nav-tabs"><li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#t1">Old 1</button></li><li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#t2">Old 2</button></li></ul><div class="tab-content"><div class="tab-pane active show" id="t1"><div class="c4l-tab-title">Old 1</div><p>Old content 1</p></div><div class="tab-pane" id="t2"><div class="c4l-tab-title">Old 2</div><p>Old content 2</p></div></div></div><div class="c4l-collapsible c4l-buttondropdown-variant"><button class="btn collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#c1" aria-expanded="false">Old title</button><div class="collapse" id="c1"><div class="card card-body">Old hidden content</div></div></div><p><a href="#" class="c4l-linkblock evil"><span class="link-content"><span class="link-name">Evil</span><span class="link-url">javascript:alert(1)</span></span></a></p><p><a href="https://example.com" class="c4l-linkblock good"><span class="link-content"><span class="link-name">Good</span><span class="link-url">https://moodle.org/</span></span></a></p> |
    When I am on the "Forum 1" "forum activity" page logged in as "teacher1"
    And I follow "Old helpers"
    Then I should see "Old content 1"
    And I should not see "Old content 2"
    And I click on "Old 2" "button" in the ".c4l-tablist" "css_element"
    And I should see "Old content 2"
    And I should not see "Old hidden content"
    And I click on "Old title" "button" in the ".c4lv-collapsible" "css_element"
    And I should see "Old hidden content"
    And the "href" attribute of "a.c4l-linkblock.evil" "css_element" should not contain "javascript"
    And the "href" attribute of "a.c4l-linkblock.good" "css_element" should contain "moodle.org"
