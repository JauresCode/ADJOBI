export type UserRole = 'super_admin' | 'hr_admin' | 'chef_service' | 'employee';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
  skills: string[];
  availability: 'available' | 'busy' | 'absent' | 'leave';
  performanceScore: number; // 0 to 100
  workload: number; // 0 to 100
  delayHistoryCount: number;
  absenceHistoryCount: number;
  phone: string;
  joinedDate: string;
  isActive?: boolean;
  password?: string;
  firebaseUid?: string;
  pointsTotal?: number;
  serieActuelle?: number;
  derniereDatePointage?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconEmoji: string;
  pointsRequired: number;
}

export interface BadgeUtilisateur {
  id: string;
  employeeId: string;
  badgeId: string;
  obtainedAt: string;
}

export interface TaskHistoryEntry {
  timestamp: string;
  action: string;
  user: string;
}

export interface TaskComment {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
  dueDate: string;
  department: string;
  requiredSkills: string[];
  assignedTo: string | null; // Employee ID
  assignedToName: string | null;
  status: 'À faire' | 'En cours' | 'En attente' | 'Terminée' | 'En retard' | 'Annulée';
  history: TaskHistoryEntry[];
  comments: TaskComment[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeAvatar: string;
  type: string; // 'Congés Annuels', 'Arrêt Maladie', etc.
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: 'En attente' | 'Approuvé' | 'Refusé';
  urgency: boolean;
  aiAnalysis?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'Présent' | 'Retard' | 'Absent' | 'Pause' | 'Non pointé';
  hoursWorked: number;
  delayMinutes: number;
  timeline: { type: 'in' | 'pause_start' | 'pause_end' | 'out'; time: string }[];
}

export interface SystemAlert {
  id: string;
  title: string;
  severity: 'critique' | 'warning' | 'info';
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface AIDecisionLog {
  id: string;
  timestamp: string;
  type: 'assignment' | 'reassignment' | 'surcharge' | 'risk_detected';
  title: string;
  description: string;
  details: string;
}
