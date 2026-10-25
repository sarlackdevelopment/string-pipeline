/**
 * Which component edits which kind of field (R2.1, D27). A new parameter kind is one component and one entry here;
 * the `Record` type fails the build when a kind has no entry.
 *
 * Every field component takes `field`, `issue` and `modelValue`. `<component :is>` cannot match a field with the
 * props of its own component, so the map holds plain components.
 */
import type { Component } from 'vue'
import { FieldKind } from '@/model/fields'
import BooleanField from './fields/BooleanField.vue'
import ChoiceField from './fields/ChoiceField.vue'
import IntegerField from './fields/IntegerField.vue'
import TextField from './fields/TextField.vue'
import UnsupportedField from './fields/UnsupportedField.vue'

export const fieldComponents: Readonly<Record<FieldKind, Component>> = {
  [FieldKind.text]: TextField,
  [FieldKind.integer]: IntegerField,
  [FieldKind.boolean]: BooleanField,
  [FieldKind.choice]: ChoiceField,
  [FieldKind.unsupported]: UnsupportedField,
}
