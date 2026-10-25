<script setup lang="ts">
/**
 * What every parameter field shares (D15): the label, the description and the issue, linked to the control for
 * screen readers. The control comes in through the default slot, which receives the ids to use, like a render prop
 * in React.
 */
import { computed, useId } from 'vue'
import type { Field } from '@/model/fields'
import { IssueSeverity, type FieldIssue } from './types'

const props = defineProps<{
  field: Field
  issue: FieldIssue | null
  /** A checkbox: control first, label beside it. */
  inline?: boolean
}>()

const id = useId()
const descriptionId = `${id}-description`
const issueId = `${id}-issue`

const describedBy = computed(() => {
  const ids = [
    props.field.description === '' ? null : descriptionId,
    props.issue === null ? null : issueId,
  ].filter((value) => value !== null)
  return ids.length > 0 ? ids.join(' ') : undefined
})
const invalid = computed(() => props.issue?.severity === IssueSeverity.error)
</script>

<template>
  <div
    :class="
      inline
        ? 'grid grid-cols-[auto_1fr] content-start gap-x-2.5 gap-y-1'
        : 'grid content-start gap-1.5'
    "
  >
    <label
      :for="id"
      :class="['text-sm leading-snug font-medium', inline && 'col-start-2 row-start-1']"
    >
      {{ field.title }}
    </label>
    <div :class="inline && 'col-start-1 row-start-1 flex h-5 items-center'">
      <slot :id="id" :described-by="describedBy" :invalid="invalid" />
    </div>
    <p
      v-if="field.description !== ''"
      :id="descriptionId"
      :class="['text-xs text-muted-foreground', inline && 'col-start-2']"
    >
      {{ field.description }}
    </p>
    <p
      v-if="issue !== null"
      :id="issueId"
      :class="[
        'text-xs',
        invalid ? 'font-medium text-destructive' : 'text-muted-foreground',
        inline && 'col-start-2',
      ]"
    >
      {{ issue.message }}
    </p>
  </div>
</template>
