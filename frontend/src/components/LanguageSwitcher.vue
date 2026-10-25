<script setup lang="ts">
/**
 * The interface's language (D52): the browser's own select, with each language named in itself and marked with its
 * `lang`, so a reader finds theirs whatever the page is in now and a screen reader pronounces it. The label is there
 * for screen readers; the icon says the same to the eye.
 */
import { LanguagesIcon } from '@lucide/vue'
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useLanguage } from '@/composables/useLanguage'
import { isLanguage, LANGUAGES } from '@/i18n'

const { t } = useI18n()
const language = useLanguage()
const id = useId()

function choose(value: unknown): void {
  if (isLanguage(value)) {
    language.value = value
  }
}
</script>

<template>
  <div class="inline-flex items-center gap-1.5">
    <label :for="id" class="sr-only">{{ t('language.label') }}</label>
    <LanguagesIcon class="size-4 text-muted-foreground" aria-hidden="true" />
    <NativeSelect :id="id" :model-value="language" size="sm" @update:model-value="choose">
      <NativeSelectOption
        v-for="option in LANGUAGES"
        :key="option.code"
        :value="option.code"
        :lang="option.code"
      >
        {{ option.name }}
      </NativeSelectOption>
    </NativeSelect>
  </div>
</template>
