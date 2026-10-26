# Beyond the brief; D53
Feature: A layout that fits the window
  As a person who builds a long chain, on a large screen or on a phone
  I want the input, the search for steps and the output to stay at hand, and the page to fit my window
  So that I can add and follow steps without scrolling back and forth

  Scenario: Only the steps scroll; the input, the search and the output stay in view
    Given a window of 1280 by 800 pixels
    And the editor is open
    When I add the step "Change case" 8 times
    And I type "Fake Python" as the input
    Then the output is "FAKE PYTHON"
    And step 1 is out of view
    And the page itself does not scroll
    When I scroll to step 1
    Then step 8 is out of view
    And the header, the input, the search for steps and the output are in view
    And the page itself does not scroll

  Scenario: On a phone the page scrolls as a whole
    Given a window of 390 by 844 pixels
    And the editor is open
    When I add the step "Append" 3 times
    Then the page itself scrolls

  Scenario Outline: The header keeps its layout in every language
    Given a window of <width> by 800 pixels
    And the editor is open
    Then the header is the same in English, German and Russian

    Examples:
      | width |
      | 768   |
      | 1024  |
      | 1280  |
