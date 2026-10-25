# Beyond the brief; D49, D50
Feature: Start from an example
  As a person who wants to see what the editor can do
  I want ready-made chains that open with one click
  So that I can learn from them and change them

  Background:
    Given the editor is open

  Scenario: An example opens with one click, and Back returns to the chain before it
    When I type "Hello" as the input
    Then the address holds the chain
    When I open the example "Title to URL slug"
    Then the output is "/blog/10-tips-for-better-regular-expressions"
    When I go back
    Then the input is "Hello"
    And the chain has no steps
