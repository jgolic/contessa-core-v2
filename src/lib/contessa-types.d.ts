export interface AttachmentRecord {
  name?: string;
  type?: string;
  dataUrl?: string;
}

export interface CertificateRecord {
  id: string;
  crewId?: string;
  crewName?: string;
  crewRank?: string;
  department?: string;
  name?: string;
  holderName?: string;
  certificateNumber?: string;
  issueDate?: string;
  issuingAuthority?: string;
  expiryDate?: string;
  notes?: string;
  status?: string;
  statusLabel?: string;
  confidenceScore?: number;
  needsManualReview?: boolean;
  reviewReasons?: string[];
  extractionProvider?: string;
  rawExtractedText?: string;
  extractedAt?: string;
  extractionReviewed?: boolean;
  daysUntilExpiration?: number | null;
  attachments?: AttachmentRecord[];
}

export interface CrewProfileRecord {
  id: string;
  fullName?: string;
  rank?: string;
  department?: string;
  nationality?: string;
  roleKey?: string;
  notes?: string;
  qrPlaceholder?: string;
  certificates?: CertificateRecord[];
}

export interface RouteWaypointRecord {
  id: string;
  name?: string;
  lng?: number;
  lat?: number;
}

export interface VesselProfileRecord {
  vesselName?: string;
  draft?: number;
  beam?: number;
  cruisingSpeedKnots?: number;
  fuelBurnPerHour?: number;
  fuelCapacity?: number;
  fuelReservePercentage?: number;
}

export interface RoutePlanningStateRecord {
  vesselProfile?: VesselProfileRecord;
  safetyMargin?: number;
  waypoints?: RouteWaypointRecord[];
}
