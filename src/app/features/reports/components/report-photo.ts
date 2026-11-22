import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { apiError } from '../../../shared/api-error';
import { ReportsService } from '../services/reports.service';

@Component({
  selector: 'app-report-photo',
  template: `
    <section class="border-top mt-3 pt-3" aria-labelledby="report-photo-title">
      <h2 id="report-photo-title">Fotografía del reporte</h2>
      @if (url(); as image) {
        <img class="img-fluid rounded border" [src]="image" alt="Fotografía adjunta al reporte" (error)="showImageError()">
      } @else if (error()) {
        <p class="alert alert-warning mb-2" role="alert">{{ error() }}</p>
        <button type="button" class="btn btn-outline-secondary" (click)="retry.update(n => n + 1)">Reintentar</button>
      } @else {
        <p class="mb-0" role="status">Cargando fotografía…</p>
      }
    </section>
  `,
  styles: ['img { max-height: 32rem; object-fit: contain; }'],
})
export class ReportPhoto {
  readonly reportId = input.required<number>();
  private readonly reports = inject(ReportsService);
  protected readonly url = signal('');
  protected readonly error = signal('');
  protected readonly retry = signal(0);

  constructor() {
    effect((cleanup) => {
      const id = this.reportId();
      this.retry();
      this.url.set('');
      this.error.set('');
      let objectUrl = '';
      const subscription = this.reports.photo(id).subscribe({
        next: (image) => {
          if (image.type !== 'image/jpeg' || !image.size) {
            this.showImageError();
            return;
          }
          objectUrl = URL.createObjectURL(image);
          this.url.set(objectUrl);
        },
        error: (error: unknown) => this.error.set(
          error instanceof HttpErrorResponse && error.status === 404
            ? 'La fotografía no está disponible.'
            : apiError(error, 'No se pudo cargar la fotografía.'),
        ),
      });
      cleanup(() => {
        subscription.unsubscribe();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });
    });
  }

  protected showImageError(): void {
    this.url.set('');
    this.error.set('No se pudo mostrar la fotografía.');
  }
}
