<script setup lang="ts">
/**
 * The editor's view (D2, D26): the input, the steps, the picker that adds a step, and the output. Props in, events
 * out; the controller decides everything.
 */
import { LoaderCircleIcon, TriangleAlertIcon } from '@lucide/vue'
import { computed, useId } from 'vue'
import InputPanel from '@/components/InputPanel.vue'
import OutputPanel from '@/components/OutputPanel.vue'
import StepCard from '@/components/StepCard/StepCard.vue'
import type { StepPart } from '@/components/StepCard/types'
import TransformationPicker from '@/components/TransformationPicker/TransformationPicker.vue'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { FocusRequest } from '@/composables/useFocusRequest'
import type { Direction, ParameterValue } from '@/model/chain'
import type { RunResult } from '@/model/run'
import {
  CatalogStatus,
  SEARCH,
  type CatalogState,
  type ExampleLink,
  type FocusTarget,
  type RunAlert,
  type StepItem,
} from './types'

const props = defineProps<{
  catalogState: CatalogState
  input: string
  inputErrors: readonly string[]
  steps: readonly StepItem[]
  result: RunResult | undefined
  isUpdating: boolean
  runAlert: RunAlert | null
  /** The latest run in one sentence, for the live region (D15). */
  summary: string
  /** Where the focus goes after the latest edit (D15). */
  focusTarget: FocusTarget | null
  /** A link to the chain as it is now; `null` while the chain is empty (D49). */
  shareLink: string | null
  /** Why the link the editor was opened with could not be opened (D49). */
  linkProblem: string | null
  /** Links to the example chains, in display order (D50). */
  examples: readonly ExampleLink[]
}>()

const emit = defineEmits<{
  retryCatalog: []
  retryRun: []
  setInput: [input: string]
  addStep: [transformationId: string]
  removeStep: [id: string]
  moveStep: [id: string, direction: Direction]
  setValue: [id: string, name: string, value: ParameterValue]
  setEnabled: [id: string, enabled: boolean]
}>()

const stepsHeadingId = useId()
const examplesLabelId = useId()

// Each component gets the focus target only when it owns that place; the object stays the same between renders, so
// only a new edit asks for the focus again.
function focusOfStep(stepId: string): FocusRequest<StepPart> | null {
  const target = props.focusTarget
  return target !== null && 'stepId' in target && target.stepId === stepId ? target : null
}

const searchFocus = computed(() => (props.focusTarget?.part === SEARCH ? props.focusTarget : null))
</script>

<template>
  <p
    v-if="catalogState.status === CatalogStatus.loading"
    class="flex items-center gap-2 text-sm text-muted-foreground"
  >
    <LoaderCircleIcon class="size-4 animate-spin" />
    Loading the transformations…
  </p>

  <Alert v-else-if="catalogState.status === CatalogStatus.failed" variant="destructive">
    <TriangleAlertIcon />
    <AlertTitle>The transformations could not be loaded</AlertTitle>
    <AlertDescription>{{ catalogState.message }}</AlertDescription>
    <AlertAction>
      <Button variant="outline" size="sm" @click="emit('retryCatalog')">Try again</Button>
    </AlertAction>
  </Alert>

  <div v-else class="flex flex-col gap-4">
    <Alert v-if="linkProblem !== null" variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>This link could not be opened</AlertTitle>
      <AlertDescription>{{ linkProblem }}</AlertDescription>
    </Alert>

    <InputPanel
      :model-value="input"
      :max-length="catalogState.catalog.limits.maxInputLength"
      :errors="inputErrors"
      @update:model-value="emit('setInput', $event)"
    />

    <Alert v-if="runAlert !== null" variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>The chain could not run</AlertTitle>
      <AlertDescription>
        <p v-for="message in runAlert.messages" :key="message">{{ message }}</p>
      </AlertDescription>
      <AlertAction v-if="runAlert.canRetry">
        <Button variant="outline" size="sm" @click="emit('retryRun')">Try again</Button>
      </AlertAction>
    </Alert>

    <section v-if="steps.length > 0" :aria-labelledby="stepsHeadingId">
      <h2 :id="stepsHeadingId" class="sr-only">Steps</h2>
      <ol class="flex flex-col gap-4">
        <li v-for="(step, index) in steps" :key="step.id">
          <StepCard
            :number="index + 1"
            :transformation="step.transformation"
            :values="step.values"
            :enabled="step.enabled"
            :result="step.result"
            :errors="step.errors"
            :is-updating="isUpdating"
            :can-move-up="index > 0"
            :can-move-down="index < steps.length - 1"
            :focus-request="focusOfStep(step.id)"
            @move="emit('moveStep', step.id, $event)"
            @remove="emit('removeStep', step.id)"
            @change="(name, value) => emit('setValue', step.id, name, value)"
            @set-enabled="emit('setEnabled', step.id, $event)"
          />
        </li>
      </ol>
    </section>

    <TransformationPicker
      :catalog="catalogState.catalog"
      :full="steps.length >= catalogState.catalog.limits.maxSteps"
      :focus-request="searchFocus"
      @add="emit('addStep', $event)"
    />

    <!-- After the search that adds steps, so the input stays the first stop of the Tab key. -->
    <div
      v-if="examples.length > 0"
      class="-mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1 text-sm"
    >
      <span :id="examplesLabelId" class="text-muted-foreground">Or open an example:</span>
      <ul :aria-labelledby="examplesLabelId" class="flex flex-wrap gap-x-3 gap-y-1">
        <li v-for="example in examples" :key="example.id">
          <a
            :href="example.href"
            class="rounded-sm font-medium underline decoration-muted-foreground/60 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >{{ example.name }}</a
          >
        </li>
      </ul>
    </div>

    <OutputPanel :result="result" :is-updating="isUpdating" :summary="summary" :link="shareLink" />
  </div>
</template>
