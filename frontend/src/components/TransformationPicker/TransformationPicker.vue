<script setup lang="ts">
/**
 * Adds a step (R1.3, D28): a combobox that searches the catalog's transformations by name and description, grouped
 * by category. Its own value always stays empty, so the same transformation can be added twice in a row, and the
 * search field clears after each pick. The list opens inside the page, not at the end of the body, so it stays within
 * the page's landmarks (D15).
 */
import { computed, useId, useTemplateRef } from 'vue'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxViewport,
} from '@/components/ui/combobox'
import { useFocusRequest, type FocusRequest } from '@/composables/useFocusRequest'
import type { Catalog } from '@/model/catalog'
import { groupByCategory } from './model/groups'

const props = defineProps<{
  catalog: Catalog
  /** The chain has as many steps as the catalog allows. */
  full: boolean
  /** Asks for the focus on the search field, after the last step was removed (D15). */
  focusRequest: FocusRequest<'search'> | null
}>()

const emit = defineEmits<{
  add: [transformationId: string]
}>()

const id = useId()
const hintId = `${id}-hint`
const groups = computed(() => groupByCategory(props.catalog))

const root = useTemplateRef<HTMLDivElement>('root')
useFocusRequest(
  () => props.focusRequest,
  () => {
    root.value?.querySelector('input')?.focus()
  },
)

function pick(value: unknown): void {
  if (typeof value === 'string' && value !== '') {
    emit('add', value)
  }
}
</script>

<template>
  <div ref="root" class="grid gap-2 rounded-xl border border-dashed bg-card/60 p-4">
    <label :for="id" class="text-sm font-semibold">Add a step</label>
    <Combobox model-value="" :disabled="full" open-on-click @update:model-value="pick">
      <ComboboxAnchor>
        <ComboboxInput
          :id="id"
          placeholder="Search, for example “replace” or “regex”"
          :aria-describedby="full ? hintId : undefined"
        />
      </ComboboxAnchor>
      <ComboboxList :portal="false">
        <ComboboxViewport>
          <ComboboxEmpty>No transformation matches.</ComboboxEmpty>
          <ComboboxGroup
            v-for="group in groups"
            :key="group.category.id"
            :heading="group.category.name"
          >
            <ComboboxItem
              v-for="transformation in group.transformations"
              :key="transformation.id"
              :value="transformation.id"
              class="flex-col items-start gap-0.5 py-1.5 pr-2"
            >
              <span class="font-medium">{{ transformation.name }}</span>
              <span class="text-xs text-muted-foreground">{{ transformation.description }}</span>
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxViewport>
      </ComboboxList>
    </Combobox>
    <p v-if="full" :id="hintId" class="text-xs text-muted-foreground">
      A chain can have up to {{ catalog.limits.maxSteps }} steps.
    </p>
  </div>
</template>
