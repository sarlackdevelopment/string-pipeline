<script setup lang="ts">
/**
 * A parameter in a shape this app does not know (D43): a notice instead of a guess. The step gets no value for it,
 * so the server uses its default.
 */
import type { ParameterValue } from '@/model/chain'
import type { UnsupportedField } from '@/model/fields'
import type { FieldIssue } from '../types'

defineProps<{
  field: UnsupportedField
  issue: FieldIssue | null
  /** Every field gets a value from the form; this one has nothing to show it in. */
  modelValue: ParameterValue
}>()
</script>

<template>
  <div class="grid content-start gap-1.5">
    <p class="text-sm leading-snug font-medium">{{ field.title }}</p>
    <p class="text-xs text-muted-foreground">
      This app cannot edit this kind of parameter yet, so the step uses its default value.
    </p>
    <p v-if="issue !== null" class="text-xs font-medium text-destructive">{{ issue.message }}</p>
  </div>
</template>
