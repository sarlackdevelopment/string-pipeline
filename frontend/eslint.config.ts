/**
 * ESLint covers what oxlint cannot: Vue templates, template accessibility and type-aware
 * TypeScript rules. Oxlint runs first; eslint-plugin-oxlint switches off the rules it already ran.
 */
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from 'eslint-config-prettier/flat'
import pluginOxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts}'],
  },

  globalIgnores(['**/dist/**', '**/coverage/**']),

  ...pluginVue.configs['flat/recommended'],
  ...pluginVueA11y.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,

  {
    name: 'app/component-conventions',
    rules: {
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-emits-declaration': ['error', 'type-literal'],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/no-undef-components': 'error',
      'vue/no-unused-refs': 'error',
      'vue/prefer-use-template-ref': 'error',
      'vue/require-typed-ref': 'error',
      // An optional prop of a type-based declaration is `undefined` by default, and TypeScript tracks that.
      'vue/require-default-prop': 'off',
      // The UI kit's text controls, by their kebab-case names. <Input> and <Textarea> already count as input and
      // textarea.
      'vuejs-accessibility/form-control-has-label': [
        'error',
        { controlComponents: ['combobox-input', 'input-group-input', 'input-group-textarea'] },
      ],
      // HTML links a label to its control by wrapping it or by `for`; the rule's default demands both at once.
      'vuejs-accessibility/label-has-for': ['error', { required: { some: ['nesting', 'id'] } }],
    },
  },

  {
    // The UI kit copied from shadcn-vue (D28). Its names follow its folders (ui/button/Button.vue), and its form
    // controls get their labels where they are used, which is where the rule above checks them.
    name: 'app/ui-kit',
    files: ['src/components/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vuejs-accessibility/form-control-has-label': 'off',
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/tests/**'],
  },

  {
    name: 'app/tests',
    files: ['src/tests/**'],
    rules: {
      // `waitFor(() => expect(...))` is how Testing Library and Vitest wait for an assertion to pass.
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
