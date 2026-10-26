<script lang="ts">
/** How long a notice stays, in milliseconds: time to read two sentences. */
export const NOTICE_DURATION = 8000
</script>

<script setup lang="ts">
/**
 * The editor's notices (D55): a run that failed as a whole, and a link that could not be opened. Each pops up as a
 * toast in the stack at the bottom right and closes by itself; hovering or focusing the stack pauses it. Reka UI's
 * toast store, under the view's `ToastProvider`, holds them, and the toasts land in the view's `ToastViewport`.
 *
 * Each kind has one toast. A different message updates it and starts its time again; the same message again changes
 * nothing, so a server that stays down neither keeps the toast on screen nor a screen reader talking. A run that
 * succeeds closes it, as an edit after a broken link closes that one.
 */
import { TriangleAlertIcon, XIcon } from '@lucide/vue'
import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRoot,
  ToastTitle,
  useToastManager,
  type ToastAddOptions,
} from 'reka-ui'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import type { RunAlert } from './PipelineEditor/types'

const props = defineProps<{
  runAlert: RunAlert | null
  linkProblem: string | null
}>()

const emit = defineEmits<{
  retryRun: []
}>()

const { t } = useI18n()
const { toasts, add, close } = useToastManager()

type Notice = Pick<ToastAddOptions, 'title' | 'description' | 'actionProps'>

function show(id: string, notice: Notice | null): void {
  if (notice === null) {
    close(id)
    return
  }
  const shown = toasts.value.find((toast) => toast.id === id && toast.open)
  if (
    shown !== undefined &&
    shown.title === notice.title &&
    shown.description === notice.description
  ) {
    return
  }
  // Foreground: a screen reader says it at once, as an error needs.
  add({ id, type: 'foreground', status: 'error', duration: NOTICE_DURATION, ...notice })
}

watch(
  () => props.runAlert,
  (alert) => {
    show(
      'run',
      alert === null
        ? null
        : {
            title: t('editor.runFailed'),
            description: alert.messages.join('\n'),
            ...(alert.canRetry && {
              actionProps: {
                label: t('editor.tryAgain'),
                altText: t('notices.retryElsewhere'),
                onClick: () => {
                  emit('retryRun')
                },
              },
            }),
          },
    )
  },
  { immediate: true },
)

watch(
  () => props.linkProblem,
  (problem) => {
    show('link', problem === null ? null : { title: t('editor.linkFailed'), description: problem })
  },
  { immediate: true },
)
</script>

<template>
  <!-- notice-toast places each toast in the stack (index.css). -->
  <ToastRoot
    v-for="toast in toasts"
    :key="toast.id"
    :toast="toast"
    class="notice-toast grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 rounded-xl border border-destructive/40 bg-card p-4 text-card-foreground shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    <TriangleAlertIcon class="mt-0.5 size-4 text-destructive" />
    <div class="grid gap-1">
      <ToastTitle class="text-sm font-medium text-destructive" />
      <ToastDescription class="text-sm whitespace-pre-line text-destructive" />
    </div>
    <ToastClose
      :aria-label="t('notices.close')"
      class="-mt-1 -mr-1 rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <XIcon class="size-4" />
    </ToastClose>
    <ToastAction v-if="toast.actionProps" as-child class="col-start-2 justify-self-start">
      <Button variant="outline" size="sm">{{ toast.actionProps.label }}</Button>
    </ToastAction>
  </ToastRoot>
</template>
