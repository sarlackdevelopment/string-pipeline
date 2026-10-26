/**
 * The app's own texts in Russian (D52). A count that a noun agrees with takes three plural forms, which the Russian
 * plural rule in `index.ts` chooses between; where the count could take any form, it stands after a colon instead.
 */
import type { Messages } from './en'

export const ru: Messages = {
  app: {
    tagline: 'Цепочки преобразований текста без программирования.',
    crashed: 'Что-то пошло не так',
    crashedDetail: 'Редактор перестал работать. Перезагрузите страницу, чтобы начать заново.',
    reload: 'Перезагрузить',
  },
  language: {
    label: 'Язык',
  },
  theme: {
    label: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная',
  },
  editor: {
    loading: 'Загрузка преобразований…',
    catalogFailed: 'Не удалось загрузить преобразования',
    linkFailed: 'Не удалось открыть ссылку',
    runFailed: 'Не удалось выполнить цепочку',
    tryAgain: 'Повторить',
    steps: 'Шаги',
    examples: 'Или откройте пример:',
    noSteps: 'Шагов пока нет. Добавьте шаг через поиск выше или откройте пример.',
  },
  notices: {
    label: 'Уведомление',
    region: 'Уведомления ({hotkey})',
    close: 'Закрыть сообщение',
    retryElsewhere: 'Измените цепочку, чтобы запустить её снова.',
  },
  input: {
    label: 'Входной текст',
    placeholder: 'Введите или вставьте текст для преобразования',
    count: 'Символов: {length} из {max}',
  },
  picker: {
    label: 'Добавить шаг',
    placeholder: 'Поиск, например «заменить» или «regex»',
    empty: 'Ничего не найдено.',
    full: 'В цепочке может быть не больше {n} шага. | В цепочке может быть не больше {n} шагов. | В цепочке может быть не больше {n} шагов.',
  },
  step: {
    legend: 'Шаг {number}: {name}',
    run: 'Выполнять шаг {number}',
    moveUp: 'Переместить шаг {number} вверх',
    moveDown: 'Переместить шаг {number} вниз',
    remove: 'Удалить шаг {number}',
    drag: 'Перетащите, чтобы переместить шаг',
    output: 'Результат этого шага',
    off: 'Шаг выключен, поэтому текст проходит через него без изменений.',
    waiting: 'Этот шаг выполнится, когда выполнятся все шаги выше.',
    unsupportedField:
      'Такой параметр приложение пока не умеет редактировать, поэтому шаг использует значение по умолчанию.',
  },
  status: {
    executed: 'Выполнен',
    notConfigured: 'Не настроен',
    invalidParameters: 'Неверные значения',
    failed: 'Ошибка',
    notRun: 'Не выполнялся',
    running: 'Выполняется',
    off: 'Выключен',
  },
  output: {
    label: 'Результат',
    summary: 'Итог выполнения',
    updating: 'Обновляется',
    copy: 'Копировать',
    copied: 'Скопировано',
    copiedOutput: 'Результат скопирован.',
    copyLink: 'Копировать ссылку',
    copiedLink: 'Ссылка скопирована.',
    emptyText: 'Пустой текст',
    none: 'Результата пока нет.',
    waiting: 'Результат появится, когда выполнятся все шаги.',
  },
  summary: {
    oneRan: 'Шаг выполнен.',
    allRan: 'Выполнены все шаги: {n}.',
    oneOff: 'Шаг выключен.',
    allOff: 'Выключены все шаги: {n}.',
    someOff: 'Выполнено шагов: {ran} из {total}, выключено: {off}.',
    needsValue: 'Шагу {number}, «{name}», нужно значение.',
    invalidValue: 'У шага {number}, «{name}», неверное значение.',
    failed: 'Шаг {number}, «{name}», завершился ошибкой: {message}',
    notRun: 'Шаг {number}, «{name}», не выполнялся.',
  },
  failure: {
    app: 'В приложении что-то пошло не так. Перезагрузите страницу, чтобы начать заново.',
    network: 'Сервер недоступен. Проверьте, что он запущен, и повторите попытку.',
    http: 'Сервер ответил кодом HTTP {status}. Повторите попытку чуть позже.',
    invalid:
      'Сервер прислал ответ, который приложение не понимает. Возможно, приложение и сервер разных версий.',
  },
  link: {
    unreadable:
      'В ней нет цепочки, которую приложение может прочитать. Возможно, при копировании часть ссылки потерялась.',
    unknownTransformation:
      'В ней используется преобразование, которого нет в приложении: «{transformation}».',
  },
}
