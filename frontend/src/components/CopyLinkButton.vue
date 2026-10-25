<script setup lang="ts">
/**
 * Copies a link to the chain (D49). A live region confirms the copy, which a changed button label alone does not
 * announce (D15).
 */
import { CheckIcon, LinkIcon } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  /** The link to the chain as it is now; `null` while the chain is empty. */
  link: string | null
}>()

const { t } = useI18n()

// Falls back to the older copy command where the Clipboard API is missing, as on a page served over plain HTTP.
const { copy, copied } = useClipboard({ legacy: true })

function copyLink(): void {
  if (props.link !== null) {
    void copy(props.link)
  }
}
</script>

<template>
  <Button variant="outline" size="sm" :disabled="link === null" @click="copyLink">
    <CheckIcon v-if="copied" />
    <LinkIcon v-else />
    {{ copied ? t('output.copied') : t('output.copyLink') }}
  </Button>
  <span aria-live="polite" class="sr-only">{{ copied ? t('output.copiedLink') : '' }}</span>
</template>
