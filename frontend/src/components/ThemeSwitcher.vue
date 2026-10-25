<script setup lang="ts">
/**
 * Light, dark or the system's theme (D51). A radio group, so it is a single stop of the Tab key and the arrow keys move
 * the choice; Reka UI gives it the roles and the keyboard, and the look is a segmented control. The chosen option is
 * filled in the primary colour. In a Windows contrast theme it is filled in system colours, which the theme would
 * otherwise repaint in the colour of the page, and opts out of the backplate the theme draws behind text, which would
 * hide its label.
 */
import { MonitorIcon, MoonIcon, SunIcon } from '@lucide/vue'
import { RadioGroupItem, RadioGroupRoot, type AcceptableValue } from 'reka-ui'
import { Theme, useTheme } from '@/composables/useTheme'

const theme = useTheme()

const options = [
  { value: Theme.light, label: 'Light', icon: SunIcon },
  { value: Theme.dark, label: 'Dark', icon: MoonIcon },
  { value: Theme.system, label: 'System', icon: MonitorIcon },
] as const

function choose(value: AcceptableValue | undefined): void {
  const option = options.find((each) => each.value === value)
  if (option !== undefined) {
    theme.value = option.value
  }
}
</script>

<template>
  <RadioGroupRoot
    :model-value="theme"
    orientation="horizontal"
    aria-label="Theme"
    class="inline-flex gap-0.5 rounded-lg border bg-background p-0.5"
    @update:model-value="choose"
  >
    <RadioGroupItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-primary data-checked:text-primary-foreground forced-colors:data-checked:bg-[Highlight] forced-colors:data-checked:text-[HighlightText] forced-colors:data-checked:forced-color-adjust-none"
    >
      <component :is="option.icon" class="size-3.5" />
      {{ option.label }}
    </RadioGroupItem>
  </RadioGroupRoot>
</template>
