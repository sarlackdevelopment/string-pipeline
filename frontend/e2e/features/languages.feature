# Beyond the brief; D15, D52
Feature: Use the editor in English, German or Russian
  As a person who reads German or Russian more easily than English
  I want the editor, the transformations and the server's messages in my language
  So that I understand every label, hint and error

  Scenario: A first visit follows the browser's language
    Given the browser prefers German
    And the editor is open
    Then the language "Deutsch" is chosen
    And the page is marked as "de"
    And the search for steps is called "Schritt hinzufügen"
    When I search the steps for "Regex"
    Then the search offers "Treffer extrahieren"
    And the search offers "Treffer ersetzen"
    When I press Escape
    Then axe finds no accessibility violations

  Scenario: The server's messages follow the chosen language
    Given the editor is open
    When I choose the language "Русский"
    And I open the example "Цепочка из задания"
    Then step 1 shows "Выполнен"
    And the output is "Real Python!"
    When I set "Найти" to "" in step 1
    Then step 1 shows "Введите значение"
    And the run summary says "Шагу 1, «Заменить», нужно значение."

  Scenario: The chosen language stays after a reload
    Given the editor is open
    When I choose the language "Deutsch"
    And I reload the page
    Then the language "Deutsch" is chosen
    And the search for steps is called "Schritt hinzufügen"
