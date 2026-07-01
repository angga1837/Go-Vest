// Tipe data sama dengan skema tabel Supabase dan field JSON firmware 

export type Worker = {
  id: string;
  worker_code: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  location_label: string | null;
  phone_number: string | null;
  created_at: string;
};

export type Telemetry = {
  id: number;
  worker_id: string;
  recorded_at: string;
  bpm: number | null;
  spo2: number | null;
  gas_value: number | null;
  total_g: number | null;
  roll: number | null;
  pitch: number | null;
  lat: number | null;
  lon: number | null;
  gps_fix_valid: boolean;
  is_danger: boolean;
  alert_message: string | null;
  fall_confirmed: boolean;
};

export type TelemetryHourlyAgg = {
  id: number;
  worker_id: string;
  hour_bucket: string;
  avg_bpm: number | null;
  avg_spo2: number | null;
  avg_gas_value: number | null;
  max_gas_value: number | null;
  danger_event_count: number;
};

export type Alert = {
  id: number;
  worker_id: string;
  triggered_at: string;
  severity: 'danger' | 'warning';
  cause: string | null;
  location_label: string | null;
  source: 'rule_based' | 'decision_tree' | 'manual';
  acknowledged: boolean;
};

export type WorkerWithLatestTelemetry = Worker & {
  latest_telemetry: Telemetry | null;
};

export type AlertWithWorkerName = Alert & {
  worker_name: string;
};
