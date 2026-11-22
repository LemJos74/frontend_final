import { DOCUMENT } from '@angular/common';
import { Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LeafletMapContext, LeafletMapHost } from '../../../shared/map/leaflet-map';
import type { ReportSummary } from '../models/report.model';
import { reportStates, statusAppearance } from './report-status';

function hasPosition(report: ReportSummary): boolean {
  return Number.isSafeInteger(report.id) && report.id > 0
    && Number.isFinite(report.latitud) && Math.abs(report.latitud) <= 90
    && Number.isFinite(report.longitud) && Math.abs(report.longitud) <= 180;
}

@Component({
  selector: 'app-citizen-report-map',
  imports: [LeafletMapHost],
  encapsulation: ViewEncapsulation.None,
  styleUrl: './citizen-report-map.scss',
  template: `
    <p class="mb-3 text-secondary">El mapa muestra únicamente los reportes de la página {{ page() }}.</p>
    @if (mapped().length) {
      <div class="surface p-3">
        <ul class="list-unstyled d-flex flex-wrap gap-3 mb-3" aria-label="Leyenda de estados">
          @for (entry of legend; track entry.name) {
            <li class="d-inline-flex align-items-center gap-2">
              <span class="citizen-map-symbol" [class]="entry.tone" aria-hidden="true">{{ entry.icon }}</span>
              <span>{{ entry.name }}</span>
            </li>
          }
        </ul>
        <p class="text-secondary small mb-2">Usa Tab para recorrer los marcadores y Enter para abrir su información.</p>
        <app-leaflet-map label="Mapa de mis reportes" (mapReady)="renderMarkers($event)" />
        @if (mapped().length < reports().length) {
          <p class="mb-0 mt-2 text-secondary" role="status">
            {{ mapped().length }} de {{ reports().length }} reportes de esta página tienen coordenadas válidas.
          </p>
        }
      </div>
    } @else {
      <p class="surface mb-0" role="status">Esta página no tiene reportes con coordenadas válidas.</p>
    }
  `,
})
export class CitizenReportMap {
  readonly reports = input.required<ReportSummary[]>();
  readonly page = input.required<number>();
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  protected readonly mapped = computed(() => this.reports().filter(hasPosition));
  protected readonly legend = reportStates.map((name) => ({ name, ...statusAppearance(name) }));

  protected renderMarkers({ leaflet, map }: LeafletMapContext): void {
    const group = leaflet.featureGroup().addTo(map);
    for (const report of this.mapped()) {
      const style = statusAppearance(report.estado_nombre);
      const symbol = this.document.createElement('span');
      symbol.className = 'citizen-map-symbol ' + style.tone;
      symbol.textContent = style.icon;
      symbol.setAttribute('aria-hidden', 'true');
      const icon = leaflet.divIcon({
        className: 'citizen-report-pin',
        html: symbol,
        iconSize: [32, 32],
      });

      const marker = leaflet.marker([report.latitud, report.longitud], { icon }).addTo(group);
      const trigger = marker.getElement();
      trigger?.setAttribute('aria-label', report.tipo_nombre + ' · ' + report.estado_nombre + ' · Reporte #' + report.id);
      trigger?.setAttribute('aria-expanded', 'false');
      const { content, link } = this.popup(report);
      marker.bindPopup(content, { maxWidth: 260, minWidth: 150 });
      marker.on('popupopen', () => {
        trigger?.setAttribute('aria-expanded', 'true');
        if (this.document.activeElement === trigger) link.focus();
      });
      marker.on('popupclose', () => trigger?.setAttribute('aria-expanded', 'false'));
      content.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        marker.closePopup();
        trigger?.focus();
      });
    }

    const bounds = group.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16, animate: false });
  }

  private popup(report: ReportSummary): { content: HTMLElement; link: HTMLAnchorElement } {
    const content = this.document.createElement('div');
    content.className = 'citizen-map-popup';
    const heading = this.document.createElement('h3');
    heading.className = 'fs-6 mb-2';
    heading.textContent = report.tipo_nombre;
    const status = this.document.createElement('p');
    status.className = 'mb-1';
    status.textContent = 'Estado: ' + report.estado_nombre;
    const location = this.document.createElement('p');
    location.className = 'mb-2';
    location.textContent = 'Dirección: ' + report.ubicacion;
    const link = this.document.createElement('a');
    const target = this.router.createUrlTree(['/ciudadano/reportes', report.id]);
    link.href = this.router.serializeUrl(target);
    link.textContent = 'Ver detalle del reporte #' + report.id;
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      void this.router.navigateByUrl(target);
    });
    content.append(heading, status, location, link);
    return { content, link };
  }
}
