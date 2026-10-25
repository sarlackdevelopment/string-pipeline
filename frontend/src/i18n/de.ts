/**
 * The app's own texts in German (D52). Short labels use the infinitive, as German interfaces do; full sentences
 * address the reader as "Sie".
 */
import type { Messages } from './en'

export const de: Messages = {
  app: {
    tagline: 'Textumwandlungen verketten, ohne Code zu schreiben.',
    crashed: 'Etwas ist schiefgelaufen',
    crashedDetail:
      'Der Editor funktioniert nicht mehr. Laden Sie die Seite neu, um von vorn zu beginnen.',
    reload: 'Neu laden',
  },
  language: {
    label: 'Sprache',
  },
  theme: {
    label: 'Farbschema',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
  },
  editor: {
    loading: 'Die Transformationen werden geladen…',
    catalogFailed: 'Die Transformationen konnten nicht geladen werden',
    linkFailed: 'Dieser Link konnte nicht geöffnet werden',
    runFailed: 'Die Kette konnte nicht ausgeführt werden',
    tryAgain: 'Erneut versuchen',
    steps: 'Schritte',
    examples: 'Oder ein Beispiel öffnen:',
  },
  input: {
    label: 'Eingabe',
    placeholder: 'Zu bearbeitenden Text eingeben oder einfügen',
    count: '{length} / {max} Zeichen',
  },
  picker: {
    label: 'Schritt hinzufügen',
    placeholder: 'Suchen, zum Beispiel „ersetzen“ oder „Regex“',
    empty: 'Keine Transformation passt.',
    full: 'Eine Kette kann nur einen Schritt haben. | Eine Kette kann bis zu {n} Schritte haben.',
  },
  step: {
    legend: 'Schritt {number}: {name}',
    run: 'Schritt {number} ausführen',
    moveUp: 'Schritt {number} nach oben verschieben',
    moveDown: 'Schritt {number} nach unten verschieben',
    remove: 'Schritt {number} entfernen',
    output: 'Ausgabe dieses Schritts',
    off: 'Dieser Schritt ist ausgeschaltet, der Text geht unverändert hindurch.',
    waiting: 'Dieser Schritt läuft, sobald alle Schritte darüber gelaufen sind.',
    unsupportedField:
      'Diese Art von Parameter kann die App noch nicht bearbeiten, daher verwendet der Schritt seinen Standardwert.',
  },
  status: {
    executed: 'Ausgeführt',
    notConfigured: 'Nicht eingerichtet',
    invalidParameters: 'Ungültige Werte',
    failed: 'Fehlgeschlagen',
    notRun: 'Nicht ausgeführt',
    running: 'Läuft',
    off: 'Aus',
  },
  output: {
    label: 'Ausgabe',
    summary: 'Zusammenfassung des Laufs',
    updating: 'Wird aktualisiert',
    copy: 'Kopieren',
    copied: 'Kopiert',
    copiedOutput: 'Die Ausgabe wurde kopiert.',
    copyLink: 'Link kopieren',
    copiedLink: 'Der Link wurde kopiert.',
    emptyText: 'Leerer Text',
    none: 'Noch keine Ausgabe.',
    waiting: 'Die Ausgabe erscheint, sobald alle Schritte gelaufen sind.',
  },
  summary: {
    oneRan: 'Der Schritt wurde ausgeführt.',
    allRan: 'Alle {n} Schritte wurden ausgeführt.',
    oneOff: 'Der Schritt ist ausgeschaltet.',
    allOff: 'Alle {n} Schritte sind ausgeschaltet.',
    someOff: 'Ausgeführt: {ran} von {total} Schritten; ausgeschaltet: {off}.',
    needsValue: 'Schritt {number}, {name}, braucht einen Wert.',
    invalidValue: 'Schritt {number}, {name}, hat einen ungültigen Wert.',
    failed: 'Schritt {number}, {name}, ist fehlgeschlagen: {message}',
    notRun: 'Schritt {number}, {name}, wurde nicht ausgeführt.',
  },
  failure: {
    app: 'In der App ist ein Fehler aufgetreten. Laden Sie die Seite neu, um von vorn zu beginnen.',
    network:
      'Der Server ist nicht erreichbar. Prüfen Sie, ob er läuft, und versuchen Sie es dann erneut.',
    http: 'Der Server hat mit HTTP {status} geantwortet. Versuchen Sie es gleich noch einmal.',
    invalid:
      'Der Server hat eine Antwort geschickt, die diese App nicht versteht. App und Server stammen vielleicht aus verschiedenen Versionen.',
  },
  link: {
    unreadable:
      'Er enthält keine Kette, die diese App lesen kann. Vielleicht ging beim Kopieren ein Teil verloren.',
    unknownTransformation:
      'Er verwendet eine Transformation, die diese App nicht hat: „{transformation}“.',
  },
}
