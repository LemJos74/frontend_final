import { Component, computed, input } from '@angular/core';

export const reportStates = ['Pendiente', 'En atención', 'Resuelto', 'Rechazado'] as const;
const appearances = {
  Pendiente: { tone: 'text-bg-warning', icon: '◷' },
  'En atención': { tone: 'text-bg-info', icon: '↻' },
  Resuelto: { tone: 'text-bg-success', icon: '✓' },
  Rechazado: { tone: 'text-bg-danger', icon: '×' },
} as const;

export function statusAppearance(name: string) {
  return Object.hasOwn(appearances, name)
    ? appearances[name as keyof typeof appearances]
    : { tone: 'text-bg-secondary', icon: '?' };
}

@Component({
  selector: 'app-report-status',
  template: '<span class="badge rounded-pill" [class]="tone()">{{ name() }}</span>',
})
export class ReportStatus {
  readonly name = input.required<string>();
  protected readonly tone = computed(() => statusAppearance(this.name()).tone);
}
