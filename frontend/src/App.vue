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
  <div class="min-h-dvh bg-muted/40">
    <header class="border-b bg-background">
      <div
        class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-5 sm:px-6"
      >
        <div>
          <h1 class="text-xl font-semibold tracking-tight">String Pipeline</h1>
          <p class="text-sm text-muted-foreground">{{ t('app.tagline') }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Alert v-if="crashed" variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>{{ t('app.crashed') }}</AlertTitle>
        <AlertDescription>{{ t('app.crashedDetail') }}</AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm" @click="reload">{{ t('app.reload') }}</Button>
        </AlertAction>
      </Alert>
      <PipelineEditor v-else />
    </main>
  </div>
</template>
