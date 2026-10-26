<script lang="ts">
/** How long a notice stays, in milliseconds: time to read two sentences. */
export const NOTICE_DURATION = 8000
</script>

<script setup lang="ts">
/**
 * The editor's notices (D55): a run that failed as a whole, a link that could not be opened, and a run that waits for
 * the network (D57). Each pops up as a toast in the stack at the bottom right and closes by itself; hovering or
 * focusing the stack pauses it. Reka UI's toast store, under the view's `ToastProvider`, holds them, and the toasts
 * land in the view's `ToastViewport`.
 *
 * Each kind has one toast. A different message updates it and starts its time again; the same message again changes
 * nothing, so a server that stays down neither keeps the toast on screen nor a screen reader talking. A run that
 * succeeds closes it, as an edit after a broken link closes that one, and the network coming back closes its own.
 */
import { TriangleAlertIcon, WifiOffIcon, XIcon } from '@lucide/vue'
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
  waitsForNetwork: boolean
}>()

const emit = defineEmits<{
  retryRun: []
}>()

const { t } = useI18n()
const { toasts, add, close } = useToastManager()

type Notice = Pick<ToastAddOptions, 'title' | 'description' | 'actionProps'>
type Kind = Pick<ToastAddOptions, 'type' | 'status'>

// An error is red, and a screen reader says it at once. That the network is gone is news, not an error: it is grey,
// and a screen reader waits for a pause in what it is saying.
const ERROR: Kind = { type: 'foreground', status: 'error' }
const NEWS: Kind = { type: 'background', status: 'info' }

function show(id: string, notice: Notice | null, kind = ERROR): void {
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
  add({ id, ...kind, duration: NOTICE_DURATION, ...notice })
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

watch(
  () => props.waitsForNetwork,
  (waits) => {
    show(
      'offline',
      waits ? { title: t('notices.offline'), description: t('notices.offlineDetail') } : null,
      NEWS,
    )
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
    class="notice-toast group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 rounded-xl border bg-card p-4 text-card-foreground shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[status=error]:border-destructive/40"
  >
    <TriangleAlertIcon v-if="toast.status === 'error'" class="mt-0.5 size-4 text-destructive" />
    <WifiOffIcon v-else class="mt-0.5 size-4 text-muted-foreground" />
    <div class="grid gap-1">
      <ToastTitle class="text-sm font-medium group-data-[status=error]:text-destructive" />
      <ToastDescription
        class="text-sm whitespace-pre-line text-muted-foreground group-data-[status=error]:text-destructive"
      />
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
