<script setup lang="ts">
/**
 * Application shell: the header with the language (D52) and the theme (D51), an error boundary, and the pipeline
 * editor (R1.3).
 */
import { TriangleAlertIcon } from '@lucide/vue'
import { onErrorCaptured, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import PipelineEditor from '@/components/PipelineEditor/PipelineEditor.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const { t, locale } = useI18n()

// The page's language follows the interface's, so a screen reader reads it in the right voice.
watchEffect(() => {
  document.documentElement.lang = locale.value
})

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
  <!-- In a window with room for it (`shell`), the page fills the window and only the editor's middle part scrolls; in a
       smaller one, the page scrolls as a whole (D53). -->
  <div class="flex min-h-dvh flex-col bg-muted/40 shell:h-dvh">
    <header class="shrink-0 border-b bg-background">
      <!-- Two columns whatever the language: a longer tagline wraps in its own column instead of pushing the settings
           onto a row of their own. -->
      <div
        class="page-width grid items-center gap-x-6 gap-y-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div class="min-w-0">
          <h1 class="text-xl font-semibold tracking-tight">String Pipeline</h1>
          <p class="text-sm text-muted-foreground">{{ t('app.tagline') }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
    <main class="flex min-h-0 flex-1 flex-col">
      <div v-if="crashed" class="page-width py-6">
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>{{ t('app.crashed') }}</AlertTitle>
          <AlertDescription>{{ t('app.crashedDetail') }}</AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" @click="reload">{{ t('app.reload') }}</Button>
          </AlertAction>
        </Alert>
      </div>
      <PipelineEditor v-else />
    </main>
  </div>
</template>
