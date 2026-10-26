<script setup lang="ts">
/**
 * The text the chain starts from (R1.2). Its length is capped by the catalog's limit (D21) and counted as the server
 * counts it: in UTF-16 code units, like `maxlength`. It shares the card at the top with the search that adds steps, so it
 * stays in view (D53): the field grows with its text up to five lines, then scrolls.
 */
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps<{
  maxLength: number
  /** What a rejected request said about the input (D41). */
  errors: readonly string[]
}>()

const text = defineModel<string>({ required: true })

const id = useId()
const countId = `${id}-count`
const errorsId = `${id}-errors`

const { t, n } = useI18n()
// Written the way the interface's language writes numbers: 10,000, 10.000 or 10 000 (D52).
const count = computed(() =>
  t('input.count', { length: n(text.value.length), max: n(props.maxLength) }),
)
const describedBy = computed(() => (props.errors.length > 0 ? `${countId} ${errorsId}` : countId))
</script>

<template>
  <section class="grid gap-2">
    <div class="flex items-baseline justify-between gap-2">
      <h2 class="text-sm font-semibold">
        <label :for="id">{{ t('input.label') }}</label>
      </h2>
      <span :id="countId" class="text-xs text-muted-foreground tabular-nums">{{ count }}</span>
    </div>
    <Textarea
      :id="id"
      :model-value="text"
      :maxlength="maxLength"
      rows="2"
      class="max-h-32 font-mono"
      spellcheck="false"
      :placeholder="t('input.placeholder')"
      :aria-invalid="errors.length > 0"
      :aria-describedby="describedBy"
      @update:model-value="text = String($event)"
    />
    <ul v-if="errors.length > 0" :id="errorsId" class="text-sm text-destructive">
      <li v-for="message in errors" :key="message">{{ message }}</li>
    </ul>
  </section>
</template>
