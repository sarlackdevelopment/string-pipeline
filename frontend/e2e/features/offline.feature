# Beyond the brief; D56, D57
Feature: Work without the network
  As a person who builds a chain on the go
  I want the app to open, and my chain to wait, while the network is gone
  So that a weak or a lost connection does not stop my work

  @service-worker
  Scenario: The app opens without the network once it has been open with it
    Given the editor has been open with the network
    When the network is gone
    And I reload the page
    And I add the step "Replace"
    Then step 1 is "Replace"

  @service-worker
  Scenario: The server's own pages do not turn into the app
    Given the editor has been open with the network
    When I open the address "/api/catalog"
    Then the page shows the server's JSON, not the app

  Scenario: A run waits for the network, and runs once it is back
    Given the editor is open
    When the network is gone
    And I type "Fake Python" as the input
    Then a notice says "No network connection"
    And the output waits for the network
    And axe finds no accessibility violations
    When the network is back
    Then the output is "Fake Python"
