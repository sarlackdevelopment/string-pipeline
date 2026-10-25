<script setup lang="ts">
/**
 * A yes-or-no parameter (D43): a checkbox with its label beside it.
 */
import { Checkbox } from '@/components/ui/checkbox'
import type { BooleanField } from '@/model/fields'
import FieldShell from '../FieldShell.vue'
import type { FieldIssue } from '../types'

defineProps<{ field: BooleanField; issue: FieldIssue | null }>()
const value = defineModel<boolean>({ required: true })
</script>

<template>
  <FieldShell v-slot="{ id, describedBy, invalid }" :field="field" :issue="issue" inline>
    <Checkbox
      :id="id"
      :model-value="value"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @update:model-value="value = $event === true"
    />
  </FieldShell>
</template>
