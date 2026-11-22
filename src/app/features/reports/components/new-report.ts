import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormField, form, maxLength, pattern, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../../shared/api-error';
import { FieldErrors } from '../../../shared/field-errors';
import { LocationPicker, MapPoint } from '../../../shared/map/location-picker';
import { maxPhotoBytes, validateReportPhoto } from '../models/report-photo';
import { CatalogOption, ReportType } from '../models/report.model';
import { ReportsService } from '../services/reports.service';

const decimal = /^-?\d+(?:\.\d{1,8})?$/;
const initial = { distrito_id: '', tipo_id: '', descripcion: '', ubicacion: '', latitud: '', longitud: '', fotografia: null as File | null };

function coordinate(value: string, max: number): number | null {
  const number = Number(value);
  return decimal.test(value) && Math.abs(number) <= max ? number : null;
}

@Component({
  imports: [FormField, FieldErrors, LocationPicker, RouterLink],
  templateUrl: './new-report.html',
})
export class NewReport {
  private readonly reports = inject(ReportsService);
  private readonly router = inject(Router);
  private readonly model = signal(initial);
  private previewUrl = '';
  protected readonly photoFile = computed(() => this.model().fotografia);
  private readonly photoResult = signal<{ file: File; url?: string; error?: string } | null>(null);
  protected readonly photoPending = computed(() => {
    const file = this.photoFile();
    return !!file && file.size > 0 && file.size <= maxPhotoBytes && this.photoResult()?.file !== file;
  });
  protected readonly photoPreview = computed(() => this.photoResult()?.file === this.photoFile() ? this.photoResult()?.url : undefined);
  protected readonly fields = form(this.model, (path) => {
    required(path.distrito_id, { message: 'Selecciona un distrito.' });
    required(path.tipo_id, { message: 'Selecciona una categoría.' });
    required(path.descripcion, { message: 'Describe la incidencia.' });
    pattern(path.descripcion, /\S/, { message: 'Describe la incidencia.' });
    maxLength(path.descripcion, 2000, { message: 'La descripción admite hasta 2000 caracteres.' });
    required(path.ubicacion, { message: 'Indica una dirección o referencia.' });
    pattern(path.ubicacion, /\S/, { message: 'Indica una dirección o referencia.' });
    maxLength(path.ubicacion, 250, { message: 'La referencia admite hasta 250 caracteres.' });
    validate(path.fotografia, ({ value }) => {
      const file = value();
      if (!file) return null;
      if (!file.size) return { kind: 'photo', message: 'El archivo está vacío.' };
      if (file.size > maxPhotoBytes) return { kind: 'photo', message: 'La fotografía puede pesar hasta 5 MiB.' };
      const result = this.photoResult();
      return result?.file === file && result.error ? { kind: 'photo', message: result.error } : null;
    });
    validate(path.latitud, ({ value }) => coordinate(value(), 90) === null
      ? { kind: 'coordinate', message: 'Ingresa una latitud entre −90 y 90 con hasta 8 decimales.' } : null);
    validate(path.longitud, ({ value }) => coordinate(value(), 180) === null
      ? { kind: 'coordinate', message: 'Ingresa una longitud entre −180 y 180 con hasta 8 decimales.' } : null);
  });
  protected readonly districts = signal<CatalogOption[]>([]);
  protected readonly types = signal<ReportType[]>([]);
  protected readonly catalogLoading = signal(false);
  protected readonly catalogError = signal('');
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly attempted = signal(false);
  protected readonly selected = computed(() => {
    const lat = coordinate(this.model().latitud, 90);
    const lng = coordinate(this.model().longitud, 180);
    return lat === null || lng === null ? null : { lat, lng };
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.releasePreview());
    void this.loadCatalogs();
  }

  protected changePhoto(input: HTMLInputElement): void {
    this.selectPhoto(input.files?.item(0) ?? null);
  }

  protected removePhoto(input: HTMLInputElement): void {
    input.value = '';
    this.selectPhoto(null);
  }

  private selectPhoto(file: File | null): void {
    this.releasePreview();
    this.photoResult.set(null);
    this.fields.fotografia().value.set(file);
    if (!file || !file.size || file.size > maxPhotoBytes) return;

    const url = URL.createObjectURL(file);
    this.previewUrl = url;
    void validateReportPhoto(file, url)
      .then((error) => {
        if (this.previewUrl === url) this.photoResult.set(error ? { file, error } : { file, url });
      })
      .catch(() => {
        if (this.previewUrl === url) this.photoResult.set({ file, error: 'No se pudo leer la fotografía.' });
      });
  }

  private releasePreview(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = '';
  }

  protected async loadCatalogs(): Promise<void> {
    this.catalogLoading.set(true);
    this.catalogError.set('');
    try {
      const { districts, types } = await firstValueFrom(this.reports.catalogs());
      this.districts.set(districts);
      this.types.set(types);
    } catch (error) {
      this.catalogError.set(apiError(error, 'No se pudieron cargar los catálogos.'));
    } finally {
      this.catalogLoading.set(false);
    }
  }

  protected selectLocation(point: MapPoint): void {
    this.model.update((data) => ({ ...data, latitud: point.lat.toFixed(8), longitud: point.lng.toFixed(8) }));
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    this.attempted.set(true);
    const point = this.selected();
    if (this.fields().invalid() || !point || this.busy() || this.photoPending() || this.catalogLoading() || this.catalogError()) return;
    this.busy.set(true);
    this.error.set('');
    const { distrito_id, tipo_id, descripcion, ubicacion, fotografia } = this.model();
    try {
      const created = await firstValueFrom(this.reports.create({
        distrito_id: Number(distrito_id),
        tipo_id: Number(tipo_id),
        descripcion: descripcion.trim(),
        ubicacion: ubicacion.trim(),
        latitud: point.lat,
        longitud: point.lng,
      }, fotografia));
      await this.router.navigate(['/ciudadano/reportes', created.id], { replaceUrl: true });
    } catch (error) {
      this.error.set(apiError(error, fotografia ? 'No se pudo registrar el reporte con fotografía.' : 'No se pudo registrar el reporte.'));
    } finally {
      this.busy.set(false);
    }
  }
}
