<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { InputGroupVariants } from '.'
import { cn } from 'cn'
import { inputGroupAddonVariants } from '.'

const props = withDefaults(
  defineProps<{
    align?: InputGroupVariants['align']
    class?: HTMLAttributes['class']
  }>(),
  {
    align: 'inline-start',
  },
)

// A click on the addon, such as an icon, focuses the input next to it; a click on a button inside it does not.
function focusInput(event: MouseEvent) {
  if (event.target instanceof Element && event.target.closest('button') !== null) {
    return
  }
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.parentElement?.querySelector('input')?.focus()
  }
}
</script>

<template>
  <!-- No role="group": an unlabelled group around one labelled input only adds noise for screen readers. -->
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -- mouse-only convenience; keyboard users reach the input directly -->
  <div
    data-slot="input-group-addon"
    :data-align="props.align"
    :class="cn(inputGroupAddonVariants({ align: props.align }), props.class)"
    @click="focusInput"
  >
    <slot />
  </div>
</template>
