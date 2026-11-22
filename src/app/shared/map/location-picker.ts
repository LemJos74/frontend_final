import { Component, effect, input, output, signal } from '@angular/core';
import type { CircleMarker, Map as LeafletMap, LeafletMouseEvent } from 'leaflet';
import { huancayo, LeafletMapContext, LeafletMapHost } from './leaflet-map';

export interface MapPoint {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-location-picker',
  imports: [LeafletMapHost],
  template: `
    <app-leaflet-map label="Mapa de ubicación"
      unavailableText="El mapa no está disponible. Introduce las coordenadas manualmente."
      tilesErrorText="Algunas teselas no cargaron. Puedes introducir las coordenadas manualmente."
      (mapReady)="connect($event)" />
    <button type="button" class="btn btn-outline-secondary btn-sm mt-2" [disabled]="!ready()" (click)="selectCenter()">Usar centro del mapa</button>
  `,
})
export class LocationPicker {
  readonly point = input<MapPoint | null>(null);
  readonly pointChange = output<MapPoint>();
  private map?: LeafletMap;
  private marker?: CircleMarker;
  protected readonly ready = signal(false);

  constructor() {
    effect(() => {
      const point = this.point();
      const map = this.map;
      if (!this.ready() || !map) return;
      if (point) this.marker?.setLatLng(point).addTo(map);
      else this.marker?.remove();
    });
  }

  protected connect({ leaflet, map }: LeafletMapContext): void {
    this.map = map;
    this.marker = leaflet.circleMarker(huancayo, { radius: 9, color: '#123c30', fillColor: '#4ca36c', fillOpacity: 1, interactive: false });
    map.on('click', (event: LeafletMouseEvent) => this.select(event.latlng));
    this.ready.set(true);
  }

  protected selectCenter(): void {
    const center = this.map?.getCenter();
    if (center) this.select(center);
  }

  private select(point: MapPoint): void {
    const normalized = this.map?.wrapLatLng(point) ?? point;
    this.pointChange.emit({ lat: normalized.lat, lng: normalized.lng });
  }
}
