<script setup lang="ts">
/**
 * The chain's final output (D13, D32), with a button that copies it. While the next run is on its way, the previous
 * output stays and is marked as updating.
 */
import { CheckIcon, CopyIcon, LoaderCircleIcon } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { computed, useId } from 'vue'
import { Button } from '@/components/ui/button'
import type { RunResult } from '@/model/run'

const props = defineProps<{
  result: RunResult | undefined
  isUpdating: boolean
}>()

const headingId = useId()
const output = computed(() => props.result?.output ?? null)

// Falls back to the older copy command where the Clipboard API is missing, as on a page served over plain HTTP.
const { copy, copied } = useClipboard({ legacy: true })

function copyOutput(): void {
  if (output.value) {
    void copy(output.value)
  }
}
</script>

<template>
  <section
    :aria-labelledby="headingId"
    class="grid gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow-xs"
  >
    <div class="flex min-h-7 items-center justify-between gap-2">
      <h2 :id="headingId" class="text-sm font-semibold">Output</h2>
      <div class="flex items-center gap-3">
        <span
          v-if="isUpdating"
          class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <LoaderCircleIcon class="size-3.5 animate-spin" />
          Updating
        </span>
        <Button variant="outline" size="sm" :disabled="!output" @click="copyOutput">
          <CheckIcon v-if="copied" />
          <CopyIcon v-else />
          {{ copied ? 'Copied' : 'Copy' }}
        </Button>
      </div>
    </div>
    <pre
      v-if="output !== null"
      class="max-h-96 overflow-auto rounded-lg bg-muted px-3 py-2 font-mono text-sm break-words whitespace-pre-wrap"
    ><template v-if="output !== ''">{{ output }}</template><span v-else class="font-sans text-foreground/60 italic">Empty text</span></pre>
    <p v-else class="text-sm text-muted-foreground">
      {{ result === undefined ? 'No output yet.' : 'The output appears once every step has run.' }}
    </p>
  </section>
</template>
