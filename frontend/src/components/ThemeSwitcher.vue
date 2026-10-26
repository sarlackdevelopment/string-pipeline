<script setup lang="ts">
/**
 * Light, dark or the system's theme (D51). A radio group, so it is a single stop of the Tab key and the arrow keys move
 * the choice; Reka UI gives it the roles and the keyboard, and the look is a segmented control. The chosen option is
 * filled in the primary colour. In a Windows contrast theme it is filled in system colours, which the theme would
 * otherwise repaint in the colour of the page, and opts out of the backplate the theme draws behind text, which would
 * hide its label.
 *
 * Below lg only the icons show and the names are left to screen readers: their length differs between the languages,
 * and on a narrow header the longer ones pushed the tagline onto more lines or the control onto a row of its own (D53).
 * The options stay 24 pixels high without their names, the least size that WCAG 2.5.8 asks of a target.
 */
import { MonitorIcon, MoonIcon, SunIcon } from '@lucide/vue'
import { RadioGroupItem, RadioGroupRoot, type AcceptableValue } from 'reka-ui'
import { useI18n } from 'vue-i18n'
import { Theme, useTheme } from '@/composables/useTheme'

const { t } = useI18n()
const theme = useTheme()

const options = [
  { value: Theme.light, label: 'theme.light', icon: SunIcon },
  { value: Theme.dark, label: 'theme.dark', icon: MoonIcon },
  { value: Theme.system, label: 'theme.system', icon: MonitorIcon },
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
    :aria-label="t('theme.label')"
    class="inline-flex gap-0.5 rounded-lg border bg-background p-0.5"
    @update:model-value="choose"
  >
    <RadioGroupItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      class="inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-primary data-checked:text-primary-foreground forced-colors:data-checked:bg-[Highlight] forced-colors:data-checked:text-[HighlightText] forced-colors:data-checked:forced-color-adjust-none"
    >
      <component :is="option.icon" class="size-3.5" />
      <span class="sr-only lg:not-sr-only">{{ t(option.label) }}</span>
    </RadioGroupItem>
  </RadioGroupRoot>
</template>
