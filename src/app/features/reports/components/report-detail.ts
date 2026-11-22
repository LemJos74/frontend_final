import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { apiError } from '../../../shared/api-error';
import { ReportDetail as Report } from '../models/report.model';
import { ReportsService } from '../services/reports.service';
import { ReportStateForm } from '../../admin/components/report-state-form';
import { ReportPhoto } from './report-photo';
import { ReportStatus } from './report-status';

type DetailState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; retry: boolean }
  | { kind: 'ready'; report: Report };

const loading: DetailState = { kind: 'loading' };
const notFound: DetailState = { kind: 'error', message: 'Reporte no encontrado.', retry: false };

@Component({
  imports: [DatePipe, ReportPhoto, ReportStateForm, ReportStatus, RouterLink],
  template: `
    <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
      <h1 class="mb-0">Detalle del reporte</h1>
      <a class="btn btn-outline-secondary" [routerLink]="isAdmin ? '/admin/reportes' : '/ciudadano/reportes'">{{ isAdmin ? 'Reportes ciudadanos' : 'Mis reportes' }}</a>
    </div>
    @if (updated()) { <p class="alert alert-success" role="status">Estado actualizado.</p> }
    @if (state(); as current) {
      @switch (current.kind) {
        @case ('loading') { <p role="status" class="surface">Cargando reporte…</p> }
        @case ('error') {
          <div class="alert alert-danger" role="alert">{{ current.message }}</div>
          @if (current.retry) {
            <button type="button" class="btn btn-outline-secondary" (click)="reload()">Reintentar</button>
          }
        }
        @case ('ready') {
          <div class="surface">
            <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
              <h2 class="mb-0">Reporte #{{ current.report.id }}</h2>
              <app-report-status [name]="current.report.estado_nombre" />
            </div>
            <dl class="row mb-0">
              <div class="col-sm-6"><dt>Categoría</dt><dd>{{ current.report.tipo_nombre }}</dd></div>
              <div class="col-sm-6"><dt>Distrito</dt><dd>{{ current.report.distrito_nombre }}</dd></div>
              <div class="col-12"><dt>Descripción</dt><dd class="report-text">{{ current.report.descripcion }}</dd></div>
              <div class="col-12"><dt>Dirección o referencia</dt><dd class="report-text">{{ current.report.ubicacion }}</dd></div>
              <div class="col-sm-6"><dt>Latitud</dt><dd>{{ current.report.latitud }}</dd></div>
              <div class="col-sm-6"><dt>Longitud</dt><dd>{{ current.report.longitud }}</dd></div>
              <div class="col-sm-6"><dt>Registro</dt><dd>{{ current.report.created_at | date:'dd/MM/yyyy HH:mm' }}</dd></div>
              <div class="col-sm-6"><dt>Última actualización</dt><dd>{{ current.report.updated_at | date:'dd/MM/yyyy HH:mm' }}</dd></div>
            </dl>
            @if (current.report.tiene_fotografia && current.report.fotografia_url) {
              <app-report-photo [reportId]="current.report.id" />
            }
            @if (current.report.observacion_admin; as observation) {
              <section class="border-top pt-3" aria-labelledby="report-observation">
                <h2 id="report-observation">Observación administrativa</h2>
                <p class="report-text mb-0">{{ observation }}</p>
              </section>
            }
          </div>
          @if (isAdmin) {
            <app-report-state-form [reportId]="current.report.id" [status]="current.report.estado_nombre"
              (changed)="showUpdated()" (refresh)="reload()" />
          }
        }
      }
    }
  `,
  styles: ['.report-text { white-space: pre-wrap; overflow-wrap: anywhere; }'],
})
export class ReportDetail {
  private readonly route = inject(ActivatedRoute);
  protected readonly isAdmin = this.route.snapshot.data['admin'] === true;
  protected readonly updated = signal(false);
  private readonly reports = inject(ReportsService);
  private readonly retry = new Subject<void>();
  protected readonly state = toSignal(
    combineLatest([this.route.paramMap, this.retry.pipe(startWith(undefined))]).pipe(
      switchMap(([params]) => {
        const id = Number(params.get('id'));
        if (!Number.isSafeInteger(id) || id < 1) return of(notFound);
        return this.reports.detail(id).pipe(
          map((report): DetailState => ({ kind: 'ready', report })),
          startWith(loading),
          catchError((error: unknown) => of<DetailState>(
            error instanceof HttpErrorResponse && error.status === 404
              ? notFound
              : { kind: 'error', message: apiError(error, 'No se pudo consultar el reporte.'), retry: true },
          )),
        );
      }),
    ),
    { initialValue: loading },
  );

  protected showUpdated(): void {
    this.updated.set(true);
    this.retry.next();
  }

  protected reload(): void {
    this.updated.set(false);
    this.retry.next();
  }
}
