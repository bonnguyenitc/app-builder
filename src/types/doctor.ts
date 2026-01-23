export type CheckStatus = 'Success' | 'Warning' | 'Error' | 'Loading';

export interface DoctorCheck {
  id: string;
  name: string;
  status: CheckStatus;
  message: string;
  fix_command?: string;
}

export interface DoctorResult {
  checks: DoctorCheck[];
}
