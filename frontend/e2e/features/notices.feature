# Beyond the brief; D15, D55
Feature: Notices at the bottom right
  As a person who builds a chain
  I want to learn what went wrong without the page shifting under me
  So that I can read it, act on it, and go on working

  Background:
    Given the editor is open

  Scenario: A failed run pops up at the bottom right and goes away by itself
    Given the server fails every run
    When I type "Fake Python" as the input
    Then a notice says "Something went wrong on the server."
    And the notice is at the bottom right of the window
    And axe finds no accessibility violations
    And the notice goes away by itself

  Scenario: Notices pile up with the newest in front, and spread out under the pointer
    Given the server cannot be reached for runs
    When I open a link whose chain was cut off
    Then a notice says "This link could not be opened"
    And a notice says "The server cannot be reached"
    And 2 notices are stacked, the newest in front
    When I point at the notices
    Then the notices spread out, one above the other
