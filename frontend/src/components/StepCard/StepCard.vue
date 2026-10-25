<script setup lang="ts">
/**
 * One step of the chain (D2, D12, D13, D15): a fieldset named after the step, its status, buttons to move or remove
 * it, the form of its parameters, and the step's own output.
 */
import { ArrowDownIcon, ArrowUpIcon, LoaderCircleIcon, Trash2Icon } from '@lucide/vue'
import { computed } from 'vue'
import ParameterForm from '@/components/ParameterForm/ParameterForm.vue'
import { Button } from '@/components/ui/button'
import type { Transformation } from '@/model/catalog'
import { Direction, type ParameterValue, type StepValues } from '@/model/chain'
import type { StepErrors } from '@/model/problem'
import { StepStatus, type StepResult } from '@/model/run'
import { fieldIssues } from './model/issues'
import { statusDisplay, Tone } from './model/status'

const props = defineProps<{
  /** The position in the chain, from 1. */
  number: number
  transformation: Transformation
  values: StepValues
  result: StepResult | undefined
  errors: StepErrors | undefined
  isUpdating: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  move: [direction: Direction]
  remove: []
  change: [name: string, value: ParameterValue]
}>()

const status = computed(() => statusDisplay(props.result, props.isUpdating))
const issues = computed(() => fieldIssues(props.result, props.errors))

// Outlined on the white card: tinted backgrounds would push the coloured text below a 4.5:1 contrast.
const toneClasses: Record<Tone, string> = {
  [Tone.success]: 'border-success/40 text-success',
  [Tone.neutral]: 'border-border text-foreground',
  [Tone.error]: 'border-destructive/40 text-destructive',
  [Tone.muted]: 'border-border text-muted-foreground',
}
</script>

<template>
  <fieldset class="min-w-0 rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
    <!-- Floated, so the legend sits inside the card instead of on its border. -->
    <legend class="float-left text-sm leading-7 font-semibold">
      Step {{ number }}: {{ transformation.name }}
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
      <Button
        variant="ghost"
        size="icon-sm"
        :disabled="!canMoveUp"
        :aria-label="`Move step ${number} up`"
        @click="emit('move', Direction.up)"
      >
        <ArrowUpIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        :disabled="!canMoveDown"
        :aria-label="`Move step ${number} down`"
        @click="emit('move', Direction.down)"
      >
        <ArrowDownIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        :aria-label="`Remove step ${number}`"
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
        :fields="transformation.fields"
        :values="values"
        :issues="issues"
        @change="(name, value) => emit('change', name, value)"
      />
      <div v-if="result?.status === StepStatus.executed" class="grid gap-1.5">
        <p class="text-xs font-medium text-muted-foreground">Output of this step</p>
        <pre
          class="max-h-48 overflow-auto rounded-lg bg-muted px-3 py-2 font-mono text-sm break-words whitespace-pre-wrap"
        ><template v-if="result.output !== ''">{{ result.output }}</template><span v-else class="font-sans text-foreground/60 italic">Empty text</span></pre>
      </div>
      <p
        v-else-if="result?.status === StepStatus.failed"
        class="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive"
      >
        {{ result.message }}
      </p>
      <p v-else-if="result?.status === StepStatus.notRun" class="text-sm text-muted-foreground">
        This step runs once every step above it has run.
      </p>
    </div>
  </fieldset>
</template>
