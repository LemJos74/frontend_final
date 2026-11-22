import { Component, DestroyRef, ElementRef, afterNextRender, inject, input, output, signal, viewChild } from '@angular/core';
import type { Map as LeafletMap } from 'leaflet';

export const huancayo: [number, number] = [-12.0684, -75.2103];

export interface LeafletMapContext {
  leaflet: typeof import('leaflet');
  map: LeafletMap;
}

@Component({
  selector: 'app-leaflet-map',
  styleUrl: './location-picker.scss',
  template: `
    <div #canvas class="location-picker-map border rounded-3" role="region" [attr.aria-label]="label()"></div>
    @if (loading()) {
      <p class="form-text mb-0" role="status">Cargando mapa…</p>
    } @else if (warning()) {
      <p class="form-text mb-0" role="status">{{ warning() }}</p>
    }
  `,
})
export class LeafletMapHost {
  readonly label = input.required<string>();
  readonly unavailableText = input('El mapa no está disponible. Puedes consultar los reportes en la lista.');
  readonly tilesErrorText = input('Algunas teselas no cargaron. Los marcadores siguen disponibles.');
  readonly mapReady = output<LeafletMapContext>();
  private readonly canvas = viewChild.required<ElementRef<HTMLDivElement>>('canvas');
  private readonly destruction = inject(DestroyRef);
  private map?: LeafletMap;
  protected readonly loading = signal(true);
  protected readonly warning = signal('');

  constructor() {
    afterNextRender(() => void this.initialize());
    this.destruction.onDestroy(() => this.map?.remove());
  }

  private async initialize(): Promise<void> {
    try {
      const leaflet = await import('leaflet');
      if (this.destruction.destroyed) return;
      const map = leaflet.map(this.canvas().nativeElement, { scrollWheelZoom: false }).setView(huancayo, 14);
      this.map = map;
      leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on('tileerror', () => this.warning.set(this.tilesErrorText())).addTo(map);
      this.mapReady.emit({ leaflet, map });
    } catch {
      if (!this.destruction.destroyed) this.warning.set(this.unavailableText());
    } finally {
      if (!this.destruction.destroyed) this.loading.set(false);
    }
  }
}
