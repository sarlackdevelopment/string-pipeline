<script setup lang="ts">
/**
 * A text parameter (D43): one line, kept exactly as typed, never trimmed.
 */
import { Input } from '@/components/ui/input'
import type { TextField } from '@/model/fields'
import FieldShell from '../FieldShell.vue'
import type { FieldIssue } from '../types'

defineProps<{ field: TextField; issue: FieldIssue | null }>()
const value = defineModel<string>({ required: true })
</script>

<template>
  <FieldShell v-slot="{ id, describedBy, invalid }" :field="field" :issue="issue">
    <Input
      :id="id"
      :model-value="value"
      type="text"
      class="font-mono"
      autocomplete="off"
      spellcheck="false"
      :maxlength="field.maxLength ?? undefined"
      :aria-required="field.required"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @update:model-value="value = String($event)"
    />
  </FieldShell>
</template>
