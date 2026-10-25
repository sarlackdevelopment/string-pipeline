<script setup lang="ts">
import type { ComboboxInputEmits, ComboboxInputProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { SearchIcon } from '@lucide/vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from 'cn'
import { ComboboxInput, useForwardPropsEmits } from 'reka-ui'
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
    />
  </InputGroup>
</template>
