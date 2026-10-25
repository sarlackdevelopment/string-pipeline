# R1.3; D15, D48
Feature: Use the editor with a keyboard and a screen reader
  As a person who uses a keyboard or a screen reader
  I want the editor to keep my place and tell me what happened
  So that I can build a chain as well as anyone else

  Background:
    Given the editor is open

  Scenario: A step added from the keyboard takes the focus, and the run is announced
    When I type "Fake Python" as the input
    And I pick the step "Replace" with the keyboard
    Then the focus is in "Find" of step 1
    And the run summary says "Step 1, Replace, needs a value."

  Scenario: axe finds no violations, not even with an error and the list open
    When I type "Price: 5 EUR" as the input
    And I add the step "Regex replace"
    And I set "Pattern" to "(" in step 1
    And I open the list of transformations
    Then axe finds no accessibility violations

  Scenario: The focus stays visible in a Windows contrast theme
    Given the page uses forced colours
    When I press Tab
    Then "Input" has the focus and a visible outline

  Scenario: The switch of a step that is off stays visible in a Windows contrast theme
    Given the page uses forced colours
    When I type "Fake Python" as the input
    And I add the step "Append"
    And I turn off step 1
    Then the switch of step 1 shows that the step is off

  Scenario: Every stop of the Tab key shows where the focus is
    When I type "Fake Python" as the input
    And I add the step "Regex extract"
    Then every stop of the Tab key shows where the focus is
