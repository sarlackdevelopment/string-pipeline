<script setup lang="ts">
/**
 * The editor's view (D2, D26): the input, the steps, the picker that adds a step, and the output. Props in, events
 * out; the controller decides everything.
 */
import { LoaderCircleIcon, TriangleAlertIcon } from '@lucide/vue'
import { useId } from 'vue'
import InputPanel from '@/components/InputPanel.vue'
import OutputPanel from '@/components/OutputPanel.vue'
import StepCard from '@/components/StepCard/StepCard.vue'
import TransformationPicker from '@/components/TransformationPicker/TransformationPicker.vue'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { Direction, ParameterValue } from '@/model/chain'
import type { RunResult } from '@/model/run'
import { CatalogStatus, type CatalogState, type RunAlert, type StepItem } from './types'

defineProps<{
  catalogState: CatalogState
  input: string
  inputErrors: readonly string[]
  steps: readonly StepItem[]
  result: RunResult | undefined
  isUpdating: boolean
  runAlert: RunAlert | null
}>()

const emit = defineEmits<{
  retryCatalog: []
  retryRun: []
  setInput: [input: string]
  addStep: [transformationId: string]
  removeStep: [id: string]
  moveStep: [id: string, direction: Direction]
  setValue: [id: string, name: string, value: ParameterValue]
}>()

const stepsHeadingId = useId()
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
            :result="step.result"
            :errors="step.errors"
            :is-updating="isUpdating"
            :can-move-up="index > 0"
            :can-move-down="index < steps.length - 1"
            @move="emit('moveStep', step.id, $event)"
            @remove="emit('removeStep', step.id)"
            @change="(name, value) => emit('setValue', step.id, name, value)"
          />
        </li>
      </ol>
    </section>

    <TransformationPicker
      :catalog="catalogState.catalog"
      :full="steps.length >= catalogState.catalog.limits.maxSteps"
      @add="emit('addStep', $event)"
    />

    <OutputPanel :result="result" :is-updating="isUpdating" />
  </div>
</template>
