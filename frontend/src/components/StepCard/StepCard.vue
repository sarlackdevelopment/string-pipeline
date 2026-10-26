<script setup lang="ts">
/**
 * One step of the chain (D2, D12, D13, D15): a fieldset named after the step, its status, a switch that turns it off
 * (D48), a handle to drag it to another place (D54), buttons to move or remove it, the form of its parameters, and the
 * step's own output.
 */
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  Trash2Icon,
} from '@lucide/vue'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import ParameterForm from '@/components/ParameterForm/ParameterForm.vue'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useFocusRequest, type FocusRequest } from '@/composables/useFocusRequest'
import type { Transformation } from '@/model/catalog'
import { Direction, type ParameterValue, type StepValues } from '@/model/chain'
import type { StepErrors } from '@/model/problem'
import { StepStatus, type StepResult } from '@/model/run'
import { fieldIssues } from './model/issues'
import { offStatus, statusDisplay, Tone } from './model/status'
import { StepPart } from './types'

const props = defineProps<{
  /** The position in the chain, from 1. */
  number: number
  transformation: Transformation
  values: StepValues
  /** False while the step is off: runs leave it out (D48). */
  enabled: boolean
  result: StepResult | undefined
  errors: StepErrors | undefined
  isUpdating: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  /** Asks the card to focus one of its parts after an edit (D15). */
  focusRequest: FocusRequest<StepPart> | null
}>()

const emit = defineEmits<{
  move: [direction: Direction]
  remove: []
  change: [name: string, value: ParameterValue]
  setEnabled: [enabled: boolean]
}>()

const { t } = useI18n()
const status = computed(() =>
  props.enabled ? statusDisplay(props.result, props.isUpdating, t) : offStatus(t),
)
const issues = computed(() => fieldIssues(props.result, props.errors))

const card = useTemplateRef<HTMLFieldSetElement>('card')

// The parts are marked with data-part in the template. A part the card does not have, such as the first field of a
// step without parameters, falls back to the card itself.
const partSelectors: Record<Exclude<StepPart, typeof StepPart.card>, string> = {
  [StepPart.firstField]: '[data-part="fields"] :is(input, select, textarea, button)',
  [StepPart.moveUp]: '[data-part="move-up"]',
  [StepPart.moveDown]: '[data-part="move-down"]',
}

useFocusRequest(
  () => props.focusRequest,
  (part) => {
    const root = card.value
    if (root === null) {
      return
    }
    const target =
      part === StepPart.card ? root : (root.querySelector<HTMLElement>(partSelectors[part]) ?? root)
    target.focus()
  },
)

// Outlined on the white card: tinted backgrounds would push the coloured text below a 4.5:1 contrast.
const toneClasses: Record<Tone, string> = {
  [Tone.success]: 'border-success/40 text-success',
  [Tone.neutral]: 'border-border text-foreground',
  [Tone.error]: 'border-destructive/40 text-destructive',
  [Tone.muted]: 'border-border text-muted-foreground',
}
</script>

<template>
  <!-- tabindex="-1": the card takes the focus only from code, after the step before it was removed, after it moved to
       an end of the chain, or after it was dragged (D54). -->
  <!-- A step that is off gets a dashed border: a lighter card would push its text below a 4.5:1 contrast. -->
  <fieldset
    ref="card"
    tabindex="-1"
    :class="[
      'min-w-0 rounded-xl border bg-card p-4 text-card-foreground shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
      { 'border-dashed': !enabled },
    ]"
  >
    <!-- For the pointer only, and only while the step can move: the buttons below move it from the keyboard, and with
         a single tap (D54). -->
    <span
      v-if="canMoveUp || canMoveDown"
      data-drag-handle
      aria-hidden="true"
      :title="t('step.drag')"
      class="float-left -ml-1 flex h-7 w-5 cursor-grab touch-none items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
    >
      <GripVerticalIcon class="size-4" />
    </span>
    <!-- Floated, so the legend sits inside the card instead of on its border. -->
    <legend class="float-left text-sm leading-7 font-semibold">
      {{ t('step.legend', { number, name: transformation.name }) }}
    </legend>
    <div class="float-right flex items-center gap-1">
      <span
        :class="[
          'mr-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
          toneClasses[status.tone],
        ]"
      >
        <LoaderCircleIcon v-if="status.busy" class="size-3 animate-spin" />
        <span v-else class="size-1.5 rounded-full bg-current" />
        {{ status.label }}
      </span>
      <Switch
        class="mx-1.5"
        :model-value="enabled"
        :aria-label="t('step.run', { number })"
        @update:model-value="emit('setEnabled', $event)"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        data-part="move-up"
        :disabled="!canMoveUp"
        :aria-label="t('step.moveUp', { number })"
        @click="emit('move', Direction.up)"
      >
        <ArrowUpIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        data-part="move-down"
        :disabled="!canMoveDown"
        :aria-label="t('step.moveDown', { number })"
        @click="emit('move', Direction.down)"
      >
        <ArrowDownIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        :aria-label="t('step.remove', { number })"
        @click="emit('remove')"
      >
        <Trash2Icon />
      </Button>
    </div>

    <div class="clear-both flex flex-col gap-4 pt-1">
      <p class="text-sm text-muted-foreground">{{ transformation.description }}</p>
      <p v-for="message in errors?.step ?? []" :key="message" class="text-sm text-destructive">
        {{ message }}
      </p>
      <ParameterForm
        data-part="fields"
        :fields="transformation.fields"
        :values="values"
        :issues="issues"
        @change="(name, value) => emit('change', name, value)"
      />
      <p v-if="!enabled" class="text-sm text-muted-foreground">{{ t('step.off') }}</p>
      <div v-else-if="result?.status === StepStatus.executed" class="grid gap-1.5">
        <p class="text-xs font-medium text-muted-foreground">{{ t('step.output') }}</p>
        <pre
          class="max-h-48 overflow-auto rounded-lg bg-muted px-3 py-2 font-mono text-sm break-words whitespace-pre-wrap"
        ><template v-if="result.output !== ''">{{ result.output }}</template><span v-else class="font-sans text-foreground/60 italic">{{ t('output.emptyText') }}</span></pre>
      </div>
      <p
        v-else-if="result?.status === StepStatus.failed"
        class="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive"
      >
        {{ result.message }}
      </p>
      <p v-else-if="result?.status === StepStatus.notRun" class="text-sm text-muted-foreground">
        {{ t('step.waiting') }}
      </p>
    </div>
  </fieldset>
</template>
