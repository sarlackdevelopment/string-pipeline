/**
 * The app's own texts in English (D52). Their shape is the type of every language's texts, so a text missing from
 * German or Russian does not compile. The transformations' texts come from the API in the reader's language.
 *
 * vue-i18n's syntax: `{name}` is a value, and `|` separates the plural forms of a text that takes a count.
 */
export const en = {
  app: {
    tagline: 'Chain text transformations without writing code.',
    crashed: 'Something went wrong',
    crashedDetail: 'The editor stopped working. Reload the page to start again.',
    reload: 'Reload',
  },
  language: {
    label: 'Language',
  },
  theme: {
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  editor: {
    loading: 'Loading the transformations…',
    catalogFailed: 'The transformations could not be loaded',
    linkFailed: 'This link could not be opened',
    runFailed: 'The chain could not run',
    tryAgain: 'Try again',
    steps: 'Steps',
    examples: 'Or open an example:',
    noSteps: 'No steps yet. Add one with the search above, or open an example.',
  },
  notices: {
    label: 'Notification',
    region: 'Notifications ({hotkey})',
    close: 'Close the message',
    retryElsewhere: 'Change the chain to run it again.',
  },
  input: {
    label: 'Input',
    placeholder: 'Type or paste the text to transform',
    count: '{length} / {max} characters',
  },
  picker: {
    label: 'Add a step',
    placeholder: 'Search, for example “replace” or “regex”',
    empty: 'No transformation matches.',
    full: 'A chain can have only one step. | A chain can have up to {n} steps.',
  },
  step: {
    legend: 'Step {number}: {name}',
    run: 'Run step {number}',
    moveUp: 'Move step {number} up',
    moveDown: 'Move step {number} down',
    remove: 'Remove step {number}',
    drag: 'Drag to move the step',
    output: 'Output of this step',
    off: 'This step is off, so the text passes through it unchanged.',
    waiting: 'This step runs once every step above it has run.',
    unsupportedField:
      'This app cannot edit this kind of parameter yet, so the step uses its default value.',
  },
  status: {
    executed: 'Executed',
    notConfigured: 'Not configured',
    invalidParameters: 'Invalid parameters',
    failed: 'Failed',
    notRun: 'Not run',
    running: 'Running',
    off: 'Off',
  },
  output: {
    label: 'Output',
    summary: 'Run summary',
    updating: 'Updating',
    copy: 'Copy',
    copied: 'Copied',
    copiedOutput: 'Copied the output.',
    copyLink: 'Copy link',
    copiedLink: 'Copied the link.',
    emptyText: 'Empty text',
    none: 'No output yet.',
    waiting: 'The output appears once every step has run.',
  },
  summary: {
    oneRan: 'The step ran.',
    allRan: 'All {n} steps ran.',
    oneOff: 'The step is off.',
    allOff: 'All {n} steps are off.',
    someOff:
      '{ran} of {total} steps ran; {off} is off. | {ran} of {total} steps ran; {off} are off.',
    needsValue: 'Step {number}, {name}, needs a value.',
    invalidValue: 'Step {number}, {name}, has an invalid value.',
    failed: 'Step {number}, {name}, failed: {message}',
    notRun: 'Step {number}, {name}, did not run.',
  },
  failure: {
    app: 'Something went wrong in the app. Reload the page to start again.',
    network: 'The server cannot be reached. Check that it is running, then try again.',
    http: 'The server answered with HTTP {status}. Try again in a moment.',
    invalid:
      'The server sent an answer that this app does not understand. The app and the server may be from different versions.',
  },
  link: {
    unreadable:
      'It does not hold a chain that this app can read. Part of it may have been lost when it was copied.',
    unknownTransformation:
      'It uses a transformation that this app does not have: "{transformation}".',
  },
}

export type Messages = typeof en
