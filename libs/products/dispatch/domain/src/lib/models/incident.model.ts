export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface OpsIncident {
  id: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  driverId?: string;
  plantId?: string;
  affectedOrderIds: string[];
  actionTaken?: string;
  resolved: boolean;
  loggedAt: string;
}
