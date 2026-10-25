<script setup lang="ts">
import type { ComboboxInputEmits, ComboboxInputProps } from 'reka-ui'

import { computed, type HTMLAttributes } from 'vue'
import { SearchIcon } from '@lucide/vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from 'cn'
import { ComboboxInput, injectComboboxRootContext, useForwardPropsEmits } from 'reka-ui'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<
  ComboboxInputProps & {
    class?: HTMLAttributes['class']
  }
>()

const emits = defineEmits<ComboboxInputEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// WAI-ARIA asks for aria-controls and aria-activedescendant only while the list shows. Reka UI keeps both after the list
// closes and leaves the page, where they name elements that no longer exist, which axe reports (D15).
const root = injectComboboxRootContext()
const controls = computed(() => (root.open.value ? root.contentId : undefined))
const activeDescendant = computed(() =>
  root.open.value ? root.highlightedElement.value?.id : undefined,
)
</script>

<template>
  <!-- The group draws the focus ring: its own rules only look for an input-group-control (D15). -->
  <InputGroup
    class="has-[[data-slot=combobox-input]:focus-visible]:border-ring has-[[data-slot=combobox-input]:focus-visible]:ring-3 has-[[data-slot=combobox-input]:focus-visible]:ring-ring/50"
  >
    <InputGroupAddon>
      <SearchIcon class="size-4 shrink-0 opacity-50" />
    </InputGroupAddon>
    <ComboboxInput
      data-slot="combobox-input"
      :class="
        cn('flex-1 outline-none disabled:cursor-not-allowed disabled:opacity-50', props.class)
      "
      v-bind="{ ...$attrs, ...forwarded }"
      :aria-controls="controls"
      :aria-activedescendant="activeDescendant"
    />
  </InputGroup>
</template>
