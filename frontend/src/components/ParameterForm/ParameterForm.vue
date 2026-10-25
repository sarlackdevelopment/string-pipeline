<script setup lang="ts">
/**
 * The form of one step, built from its transformation's fields (R2.1, D27). Each field kind has its component in
 * the registry, so the form knows no transformation and no kind by name.
 */
import type { ParameterValue, StepValues } from '@/model/chain'
import type { Field } from '@/model/fields'
import { fieldComponents } from './registry'
import type { FieldIssues } from './types'

defineProps<{
  fields: readonly Field[]
  values: StepValues
  issues: FieldIssues
}>()

const emit = defineEmits<{
  change: [name: string, value: ParameterValue]
}>()
</script>

<template>
  <div v-if="fields.length > 0" class="grid gap-x-4 gap-y-4 sm:grid-cols-2">
    <component
      :is="fieldComponents[field.kind]"
      v-for="field in fields"
      :key="field.name"
      :field="field"
      :model-value="values[field.name] ?? null"
      :issue="issues[field.name] ?? null"
      @update:model-value="(value: ParameterValue) => emit('change', field.name, value)"
    />
  </div>
</template>
