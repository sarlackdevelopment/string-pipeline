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
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/tests/**'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
