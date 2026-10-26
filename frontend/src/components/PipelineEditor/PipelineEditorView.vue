<script setup lang="ts">
/**
 * The editor's view (D2, D26, D53): the input, the steps and the output in the part that scrolls, and below it the
 * picker that adds a step with the examples. Props in, events out; the controller decides everything.
 */
import { LoaderCircleIcon, TriangleAlertIcon } from '@lucide/vue'
import { ToastProvider, ToastViewport } from 'reka-ui'
import { computed, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import EditorNotices from '@/components/EditorNotices.vue'
import InputPanel from '@/components/InputPanel.vue'
import OutputPanel from '@/components/OutputPanel.vue'
import StepCard from '@/components/StepCard/StepCard.vue'
import type { StepPart } from '@/components/StepCard/types'
import TransformationPicker from '@/components/TransformationPicker/TransformationPicker.vue'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useDragToReorder } from '@/composables/useDragToReorder'
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
  moveStepTo: [id: string, index: number]
  setValue: [id: string, name: string, value: ParameterValue]
  setEnabled: [id: string, enabled: boolean]
}>()

const { t } = useI18n()
const stepsHeadingId = useId()
const examplesLabelId = useId()

// Each component gets the focus target only when it owns that place; the object stays the same between renders, so
// only a new edit asks for the focus again.
function focusOfStep(stepId: string): FocusRequest<StepPart> | null {
  const target = props.focusTarget
  return target !== null && 'stepId' in target && target.stepId === stepId ? target : null
}

const searchFocus = computed(() => (props.focusTarget?.part === SEARCH ? props.focusTarget : null))

// The name of the notices' region, with the key that reaches it: "Notifications (F8)".
const noticesLabel = (hotkey: string) => t('notices.region', { hotkey })

// A step dragged by its handle to another place (D54); the list is in the same order as the steps.
const stepList = useTemplateRef<HTMLOListElement>('stepList')
useDragToReorder(
  () => stepList.value,
  (from, to) => {
    const step = props.steps[from]
    if (step !== undefined) {
      emit('moveStepTo', step.id, to)
    }
  },
)
</script>

<template>
  <div v-if="catalogState.status === CatalogStatus.loading" class="page-width py-6">
    <p class="flex items-center gap-2 text-sm text-muted-foreground">
      <LoaderCircleIcon class="size-4 animate-spin" />
      {{ t('editor.loading') }}
    </p>
  </div>

  <div v-else-if="catalogState.status === CatalogStatus.failed" class="page-width py-6">
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>{{ t('editor.catalogFailed') }}</AlertTitle>
      <AlertDescription>{{ catalogState.message }}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" @click="emit('retryCatalog')">{{
          t('editor.tryAgain')
        }}</Button>
      </AlertAction>
    </Alert>
  </div>

  <!-- The notices pop up at the bottom right (D55): the provider holds them, the viewport is where they show. -->
  <ToastProvider v-else :limit="3" :label="t('notices.label')">
    <div class="relative flex flex-1 flex-col shell:min-h-0">
      <!-- In a window with room for it, the only part of the page that scrolls; the search and the examples stay below
           it (D53). Relative, so that the texts kept for screen readers, positioned absolutely, scroll inside it too
           instead of sticking out below the window and making the whole page scroll. -->
      <div
        class="relative flex-1 shell:min-h-0 shell:[scrollbar-gutter:stable] shell:overflow-y-auto"
      >
        <div class="page-width flex flex-col gap-4 py-6">
          <InputPanel
            :model-value="input"
            :max-length="catalogState.catalog.limits.maxInputLength"
            :errors="inputErrors"
            @update:model-value="emit('setInput', $event)"
          />

          <!-- Two columns from lg up; the chain still reads from left to right, row by row (D53). -->
          <section v-if="steps.length > 0" :aria-labelledby="stepsHeadingId">
            <h2 :id="stepsHeadingId" class="sr-only">{{ t('editor.steps') }}</h2>
            <ol ref="stepList" class="grid gap-4 lg:grid-cols-2">
              <li v-for="(step, index) in steps" :key="step.id" class="min-w-0">
                <StepCard
                  class="h-full"
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

          <OutputPanel
            :result="result"
            :is-updating="isUpdating"
            :summary="summary"
            :link="shareLink"
          />
        </div>
      </div>

      <!-- Fixed to a phone's screen; in a window with room for the fixed header and footer, at the bottom right of the
           part that scrolls, so a notice never covers the search. -->
      <ToastViewport
        :label="noticesLabel"
        class="fixed right-4 bottom-4 left-4 z-50 outline-none sm:left-auto sm:w-96 shell:absolute"
      />
      <EditorNotices
        :run-alert="runAlert"
        :link-problem="linkProblem"
        @retry-run="emit('retryRun')"
      />
    </div>

    <!-- Below the part that scrolls, so the search is always at hand (D53). The input stays the first stop of the
         Tab key after the header. -->
    <div class="shrink-0 border-t bg-background">
      <div
        class="page-width grid items-end gap-x-6 gap-y-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      >
        <TransformationPicker
          :catalog="catalogState.catalog"
          :full="steps.length >= catalogState.catalog.limits.maxSteps"
          :focus-request="searchFocus"
          @add="emit('addStep', $event)"
        />

        <div
          v-if="examples.length > 0"
          class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm lg:pb-2"
        >
          <span :id="examplesLabelId" class="text-muted-foreground">{{
            t('editor.examples')
          }}</span>
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
      </div>
    </div>
  </ToastProvider>
</template>
