# Beyond the brief; D15, D51
Feature: Choose a light or a dark theme
  As a person who reads the screen in a dark room or in bright light
  I want the editor in the theme I choose, or in my system's
  So that the text is comfortable to read

  Scenario: The editor follows the system's dark theme until I choose another
    Given the system prefers a dark theme
    And the editor is open
    Then the editor is dark
    And the theme "System" is chosen
    When I choose the theme "Light"
    Then the editor is light

  Scenario: A chosen theme stays after a reload, and shows before the app runs
    Given the editor is open
    When I choose the theme "Dark"
    Then the page is dark before the app runs
    When I reload the page
    Then the editor is dark
    And the theme "Dark" is chosen

  Scenario: The theme can be chosen with the keyboard
    Given the editor is open
    When I press Tab
    And I press Tab
    And I press the left arrow key
    Then the theme "Dark" is chosen
    And the editor is dark
