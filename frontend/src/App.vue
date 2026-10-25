<script setup lang="ts">
/**
 * Application shell: the header with the theme (D51), an error boundary, and the pipeline editor (R1.3).
 */
import { TriangleAlertIcon } from '@lucide/vue'
import { onErrorCaptured, ref } from 'vue'
import PipelineEditor from '@/components/PipelineEditor/PipelineEditor.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const crashed = ref(false)

// Like an error boundary in React: an error thrown inside the editor replaces it with a message, instead of leaving
// half a page that no longer reacts.
onErrorCaptured((error) => {
  console.error(error)
  crashed.value = true
  return false
})

function reload(): void {
  window.location.reload()
}
</script>

<template>
  <div class="min-h-dvh bg-muted/40">
    <header class="border-b bg-background">
      <div
        class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-5 sm:px-6"
      >
        <div>
          <h1 class="text-xl font-semibold tracking-tight">String Pipeline</h1>
          <p class="text-sm text-muted-foreground">
            Chain text transformations without writing code.
          </p>
        </div>
        <ThemeSwitcher />
      </div>
    </header>
    <main class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Alert v-if="crashed" variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          The editor stopped working. Reload the page to start again.
        </AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm" @click="reload">Reload</Button>
        </AlertAction>
      </Alert>
      <PipelineEditor v-else />
    </main>
  </div>
</template>
