<script setup lang="ts">
/**
 * A whole-number parameter (D43). The browser's number input helps with typing; only the server checks the value
 * (D14), so a fraction reaches it and comes back as an error at the field.
 */
import { Input } from '@/components/ui/input'
import type { IntegerField } from '@/model/fields'
import FieldShell from '../FieldShell.vue'
import type { FieldIssue } from '../types'

defineProps<{ field: IntegerField; issue: FieldIssue | null }>()
const value = defineModel<number | null>({ required: true })

// Vue reads a number input as a number, or as '' while it is empty or holds no number yet: that is no value.
function update(typed: string | number): void {
  value.value = typeof typed === 'number' ? typed : null
}
</script>

<template>
  <FieldShell v-slot="{ id, describedBy, invalid }" :field="field" :issue="issue">
    <Input
      :id="id"
      :model-value="value ?? ''"
      type="number"
      inputmode="numeric"
      step="1"
      class="font-mono"
      :min="field.minimum ?? undefined"
      :max="field.maximum ?? undefined"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @update:model-value="update"
    />
  </FieldShell>
</template>
