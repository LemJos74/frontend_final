export interface ReportLocation {
  latitud: number;
  longitud: number;
}

export interface ReportRequest extends ReportLocation {
  distrito_id: number;
  tipo_id: number;
  descripcion: string;
  ubicacion: string;
}

export interface ReportSummary extends ReportRequest {
  id: number;
  distrito_nombre: string;
  tipo_nombre: string;
  estado_id: number;
  estado_nombre: string;
  created_at: string;
}

export interface ReportDetail extends ReportSummary {
  updated_at: string;
  observacion_admin: string | null;
  tiene_fotografia: boolean;
  fotografia_url: string | null;
}

export interface CatalogOption {
  id: number;
  nombre: string;
}

export interface ReportType extends CatalogOption {
  descripcion: string | null;
}
