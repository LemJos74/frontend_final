import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../../shared/api-error';
import { ReportSummary } from '../models/report.model';
import { ReportsService } from '../services/reports.service';
import { CitizenReportMap } from './citizen-report-map';
import { ReportStatus, reportStates } from './report-status';

const pageSize = 20;

@Component({
  imports: [CitizenReportMap, DatePipe, RouterLink, ReportStatus],
  styleUrl: './report-list.scss',
  template: `
    <header class="reports-heading surface d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 class="mb-2">Mis reportes</h1>
        <p class="mb-0">Consulta el estado de tus reportes y las observaciones de la municipalidad.</p>
      </div>
      <a class="btn btn-light reports-create" routerLink="/ciudadano/reportes/nuevo">
        <span class="reports-create-icon" aria-hidden="true"></span>Nuevo reporte
      </a>
    </header>
    <div class="btn-group mb-3" role="group" aria-label="Vista de mis reportes">
      <button type="button" class="btn" [class.btn-primary]="view() === 'list'" [class.btn-outline-secondary]="view() !== 'list'"
        [attr.aria-pressed]="view() === 'list'" (click)="view.set('list')">Lista</button>
      <button type="button" class="btn" [class.btn-primary]="view() === 'map'" [class.btn-outline-secondary]="view() !== 'map'"
        [attr.aria-pressed]="view() === 'map'" (click)="view.set('map')">Mapa</button>
    </div>
    @if (!loading() && !error()) {
      <section class="mb-4" aria-labelledby="page-summary">
        <h2 id="page-summary" class="mb-2">Estados de esta página</h2>
        <ul class="row row-cols-2 row-cols-lg-4 g-2 g-md-3 list-unstyled mb-0" aria-label="Conteos por estado">
          @for (group of summary(); track group.name) {
            <li class="col">
              <div class="surface report-summary p-3 h-100">
                <app-report-status [name]="group.name" />
                <p class="report-count mb-0">{{ group.total }}</p>
              </div>
            </li>
          }
        </ul>
      </section>
    }
    @if (loading()) {
      <p class="surface" role="status">Cargando reportes…</p>
    } @else if (error()) {
      <p class="alert alert-danger" role="alert">{{ error() }}</p>
      <button type="button" class="btn btn-outline-secondary" (click)="load(page())">Reintentar</button>
    } @else if (reports().length === 0) {
      <div class="surface"><p class="mb-0">{{ page() === 0 ? 'Aún no tienes reportes registrados.' : 'No hay reportes en esta página.' }}</p></div>
    } @else if (view() === 'map') {
      <app-citizen-report-map [reports]="reports()" [page]="page() + 1" />
    } @else {
      <ul class="list-unstyled d-grid gap-2 mb-0" aria-label="Reportes propios">
        @for (report of reports(); track report.id) {
          <li class="surface report-link-card position-relative p-3 p-md-4">
            <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
              <div>
                <h2 class="mb-1"><a class="stretched-link link-offset-2" [routerLink]="['/ciudadano/reportes', report.id]">{{ report.tipo_nombre }} · Reporte #{{ report.id }}</a></h2>
                <p class="text-secondary mb-0">{{ report.distrito_nombre }} · {{ report.created_at | date:'dd/MM/yyyy' }}</p>
              </div>
              <app-report-status [name]="report.estado_nombre" />
            </div>
          </li>
        }
      </ul>
    }
    @if (!loading() && !error() && (page() || hasNext())) {
      <nav class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3" aria-label="Páginas de reportes">
        <button type="button" class="btn btn-outline-secondary" [disabled]="page() === 0" (click)="load(page() - 1)">Anterior</button>
        <span>Página {{ page() + 1 }}</span>
        <button type="button" class="btn btn-outline-secondary" [disabled]="!hasNext()" (click)="load(page() + 1)">Siguiente</button>
      </nav>
    }
  `,
})
export class ReportList {
  private readonly service = inject(ReportsService);
  protected readonly view = signal<'list' | 'map'>('list');
  protected readonly page = signal(0);
  protected readonly reports = signal<ReportSummary[]>([]);
  protected readonly summary = computed(() => {
    const counts = new Map<string, number>();
    for (const report of this.reports()) {
      counts.set(report.estado_nombre, (counts.get(report.estado_nombre) ?? 0) + 1);
    }
    return reportStates.map((name) => ({ name, total: counts.get(name) ?? 0 }));
  });
  protected readonly hasNext = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor() { void this.load(0); }

  protected async load(page: number): Promise<void> {
    if (this.loading() || page < 0) return;
    this.page.set(page);
    this.loading.set(true);
    this.error.set('');
    try {
      const reports = await firstValueFrom(this.service.mine(pageSize + 1, page * pageSize));
      this.reports.set(reports.slice(0, pageSize));
      this.hasNext.set(reports.length > pageSize);
    } catch (error) {
      this.error.set(apiError(error, 'No se pudieron consultar tus reportes.'));
    } finally {
      this.loading.set(false);
    }
  }
}
