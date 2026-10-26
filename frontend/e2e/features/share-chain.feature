# Beyond the brief; D48, D49, D55
Feature: Share a chain with a link
  As a person who built a chain
  I want a link that opens it as it is
  So that someone else, or I later on, can pick it up

  Background:
    Given the editor is open

  Scenario: A copied link opens the same chain in a fresh page
    When I type "Fake Python" as the input
    And I add the step "Replace"
    And I set "Find" to "Fake" in step 1
    And I set "Replace with" to "Real" in step 1
    And I add the step "Append"
    And I set "Text" to "!" in step 2
    And I turn off step 1
    And I copy the link to the chain and open it in a fresh page
    Then step 1 shows "Off"
    And the output is "Fake Python!"

  Scenario: A link that was cut off says so
    When I open a link whose chain was cut off
    Then a notice says "This link could not be opened"
