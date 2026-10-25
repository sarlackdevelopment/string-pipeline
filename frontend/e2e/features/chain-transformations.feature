# R1.1, R1.2, R1.3, R2.1; D7, D9, D12, D42
Feature: Chain text transformations
  As a person who edits text but does not write code
  I want to chain transformations and set each one up in a form
  So that I see what every step does to my text

  Background:
    Given the editor is open

  @smoke
  Scenario: The chain of the brief: replace, then append
    When I type "Fake Python" as the input
    And I add the step "Replace"
    And I set "Find" to "Fake" in step 1
    And I set "Replace with" to "Real" in step 1
    And I add the step "Append"
    And I set "Text" to "!" in step 2
    Then step 1 shows "Real Python"
    And the output is "Real Python!"

  Scenario: A pattern that Java cannot read is shown at its field
    When I type "Price: 5 EUR" as the input
    And I add the step "Regex replace"
    And I set "Pattern" to "(" in step 1
    Then step 1 says "Unclosed group at character 2" at "Pattern"
    And there is no output until every step has run

  Scenario: An emoji with a skin tone counts as one character
    When I type "👍🏽 ok" as the input
    And I add the step "Substring"
    And I set "End" to "1" in step 1
    Then the output is "👍🏽"
