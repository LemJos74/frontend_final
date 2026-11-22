import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormField, form, maxLength, required, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../../shared/api-error';
import { FieldErrors } from '../../../shared/field-errors';
import type { CatalogOption } from '../../reports/models/report.model';
import { ReportsService } from '../../reports/services/reports.service';
import { AdminReportsService } from '../services/admin-reports.service';

const transitions: Readonly<Partial<Record<string, readonly string[]>>> = {
  Pendiente: ['En atención', 'Rechazado'],
  'En atención': ['Resuelto', 'Rechazado'],
};

@Component({
  selector: 'app-report-state-form',
  imports: [FieldErrors, FormField],
  template: `
    <section class="surface mt-3" aria-labelledby="report-state-title">
      <h2 id="report-state-title">Cambiar estado</h2>
      @if (!allowedNames().length) {
        <p class="mb-0">El estado actual no admite más cambios.</p>
      } @else if (loading()) {
        <p class="mb-0" role="status">Cargando estados…</p>
      } @else if (catalogError()) {
        <p class="alert alert-warning" role="alert">{{ catalogError() }}</p>
        <button type="button" class="btn btn-outline-secondary" (click)="load()">Reintentar</button>
      } @else if (options().length) {
        @if (error()) { <p class="alert alert-danger" role="alert">{{ error() }}</p> }
        @if (stale()) {
          <button type="button" class="btn btn-outline-secondary" (click)="refresh.emit()">Actualizar detalle</button>
        } @else {
          <form class="d-grid gap-3" novalidate (submit)="save($event)">
            <div>
              <label for="report-next-state" class="form-label">Nuevo estado</label>
              <select id="report-next-state" class="form-select" [formField]="fields.estado_id" aria-describedby="next-state-error">
                <option value="">Selecciona un estado</option>
                @for (option of options(); track option.id) {
                  <option [value]="option.id.toString()">{{ option.nombre }}</option>
                }
              </select>
              <app-field-errors errorId="next-state-error" [errors]="fields.estado_id().errors()" [visible]="attempted() || fields.estado_id().touched()" />
            </div>
            <div>
              <label for="report-justification" class="form-label">{{ rejecting() ? 'Justificación obligatoria' : 'Observación opcional' }}</label>
              <textarea id="report-justification" class="form-control" rows="4" [formField]="fields.justificacion" aria-describedby="justification-error"></textarea>
              <app-field-errors errorId="justification-error" [errors]="fields.justificacion().errors()" [visible]="attempted() || fields.justificacion().touched()" />
            </div>
            <div class="d-grid d-sm-flex">
              <button type="submit" class="btn btn-primary" [disabled]="busy()">{{ busy() ? 'Guardando…' : 'Guardar estado' }}</button>
            </div>
          </form>
        }
      } @else {
        <p class="alert alert-warning mb-0" role="status">El catálogo no ofrece un estado válido para este reporte.</p>
      }
    </section>
  `,
})
export class ReportStateForm {
  readonly reportId = input.required<number>();
  readonly status = input.required<string>();
  readonly changed = output<void>();
  readonly refresh = output<void>();

  private readonly catalog = inject(ReportsService);
  private readonly admin = inject(AdminReportsService);
  private readonly states = signal<CatalogOption[]>([]);
  private readonly model = signal({ estado_id: '', justificacion: '' });
  protected readonly allowedNames = computed(() => transitions[this.status()] ?? []);
  protected readonly options = computed(() => this.states().filter((state) => this.allowedNames().includes(state.nombre)));
  private readonly selected = computed(() => this.options().find((state) => String(state.id) === this.model().estado_id));
  protected readonly rejecting = computed(() => this.selected()?.nombre === 'Rechazado');
  protected readonly fields = form(this.model, (path) => {
    required(path.estado_id, { message: 'Selecciona un estado permitido.' });
    maxLength(path.justificacion, 2000, { message: 'La observación admite hasta 2000 caracteres.' });
    validate(path.justificacion, ({ value }) => this.rejecting() && !value().trim()
      ? { kind: 'justification', message: 'Indica el motivo del rechazo.' } : null);
  });
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly attempted = signal(false);
  protected readonly stale = signal(false);
  protected readonly error = signal('');
  protected readonly catalogError = signal('');

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.catalogError.set('');
    try {
      this.states.set(await firstValueFrom(this.catalog.states()));
    } catch (error) {
      this.catalogError.set(apiError(error, 'No se pudieron cargar los estados.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    this.attempted.set(true);
    const target = this.selected();
    if (!target || this.fields().invalid() || this.busy() || this.stale()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.admin.updateState(this.reportId(), {
        estado_id: target.id,
        justificacion: this.model().justificacion.trim() || null,
      }));
      this.changed.emit();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.stale.set(true);
        this.error.set('La transición ya no está disponible. Actualiza el detalle para ver el estado actual.');
      } else {
        this.error.set(apiError(error, 'No se pudo cambiar el estado.'));
      }
    } finally {
      this.busy.set(false);
    }
  }
}
