<script setup lang="ts">
/**
 * A parameter with a fixed list of options (D43): the browser's own select, styled like the other controls.
 */
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import type { ChoiceField } from '@/model/fields'
import FieldShell from '../FieldShell.vue'
import type { FieldIssue } from '../types'

defineProps<{ field: ChoiceField; issue: FieldIssue | null }>()
const value = defineModel<string>({ required: true })
</script>

<template>
  <FieldShell v-slot="{ id, describedBy, invalid }" :field="field" :issue="issue">
    <NativeSelect
      :id="id"
      :model-value="value"
      class="w-full"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @update:model-value="value = String($event)"
    >
      <NativeSelectOption v-for="option in field.options" :key="option.value" :value="option.value">
        {{ option.title }}
      </NativeSelectOption>
    </NativeSelect>
  </FieldShell>
</template>
