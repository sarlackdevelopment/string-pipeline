<script setup lang="ts">
/**
 * The pipeline editor (R1.2, R1.3, D26): the container that hands the controller's data and handlers to the view,
 * one prop at a time, so that vue-tsc checks every name.
 */
import PipelineEditorView from './PipelineEditorView.vue'
import { usePipelineEditorController } from './usePipelineEditorController'

const {
  catalogState,
  input,
  inputErrors,
  steps,
  result,
  isUpdating,
  runAlert,
  summary,
  focusTarget,
  shareLink,
  linkProblem,
  retryCatalog,
  retryRun,
  setInput,
  addStep,
  removeStep,
  moveStep,
  setValue,
  setEnabled,
} = usePipelineEditorController()
</script>

<template>
  <PipelineEditorView
    :catalog-state="catalogState"
    :input="input"
    :input-errors="inputErrors"
    :steps="steps"
    :result="result"
    :is-updating="isUpdating"
    :run-alert="runAlert"
    :summary="summary"
    :focus-target="focusTarget"
    :share-link="shareLink"
    :link-problem="linkProblem"
    @retry-catalog="retryCatalog"
    @retry-run="retryRun"
    @set-input="setInput"
    @add-step="addStep"
    @remove-step="removeStep"
    @move-step="moveStep"
    @set-value="setValue"
    @set-enabled="setEnabled"
  />
</template>
