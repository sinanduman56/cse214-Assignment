export interface AuditLog {
  id: number;
  action: string;
  entityType?: string;
  entityId?: number;
  performedBy?: string;
  timestamp?: string;
}

export interface AuditLogPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
