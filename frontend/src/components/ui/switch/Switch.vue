<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from 'cn'
import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from 'reka-ui'

const props = withDefaults(
  defineProps<
    SwitchRootProps & {
      class?: HTMLAttributes['class']
      size?: 'sm' | 'default'
    }
  >(),
  {
    size: 'default',
  },
)

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'size')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <!-- Changed from shadcn-vue: off, the switch is outlined in muted-foreground, 4.75:1 on white, instead of a light
       grey track at 1.26:1, below the 3:1 that WCAG 1.4.11 asks of a control. In a Windows contrast theme, system
       colours paint the thumb and the track that is on, which the theme would otherwise paint as the background. -->
  <SwitchRoot
    v-slot="slotProps"
    data-slot="switch"
    :data-size="size"
    v-bind="forwarded"
    :class="
      cn(
        'peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary forced-colors:data-checked:bg-[Highlight] data-unchecked:border-muted-foreground data-unchecked:bg-background data-disabled:cursor-not-allowed data-disabled:opacity-50',
        props.class,
      )
    "
  >
    <SwitchThumb
      data-slot="switch-thumb"
      class="pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground forced-colors:data-checked:bg-[HighlightText] data-unchecked:bg-muted-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 forced-colors:data-unchecked:bg-[CanvasText]"
    >
      <slot name="thumb" v-bind="slotProps" />
    </SwitchThumb>
  </SwitchRoot>
</template>
