import type { ReportSummary } from '../../reports/models/report.model';

export interface AdminReport extends ReportSummary {
  usuario_id: number;
  usuario_nombre: string;
  updated_at: string;
}

export interface ReportFilters {
  distrito_id: string;
  tipo_id: string;
  estado_id: string;
  fecha_desde: string;
  fecha_hasta: string;
}

export interface DashboardGroup {
  id: number;
  nombre: string;
  total: number;
}

export interface AdminDashboard {
  total_reportes: number;
  por_estado: DashboardGroup[];
  por_distrito: DashboardGroup[];
  por_categoria: DashboardGroup[];
}

export interface ReportStateChange {
  estado_id: number;
  justificacion: string | null;
}

export interface UpdatedReportState {
  id: number;
  estado_id: number;
  estado_nombre: string;
  observacion_admin: string | null;
  updated_at: string;
}
