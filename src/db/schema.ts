import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// Table des employés (créés par le Super Admin)
export const employees = pgTable("employees", {
  id: text("id").primaryKey(), // Ex: "EMP001"
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'super_admin' | 'hr_admin' | 'chef_service' | 'employee'
  department: text("department").notNull(),
  avatar: text("avatar"),
  skills: text("skills"), // Stocké sous forme de chaîne sérialisée ou JSON
  availability: text("availability").default("available"), // 'available' | 'busy' | 'absent' | 'leave'
  performanceScore: integer("performance_score").default(85),
  workload: integer("workload").default(0),
  delayHistoryCount: integer("delay_history_count").default(0),
  absenceHistoryCount: integer("absence_history_count").default(0),
  phone: text("phone"),
  joinedDate: text("joined_date"),
  isActive: boolean("is_active").default(true),
  password: text("password").default("password123"),
  firebaseUid: text("firebase_uid"), // Rempli lors du premier login Google Auth réel
  pointsTotal: integer("points_total").default(0),
  serieActuelle: integer("serie_actuelle").default(0),
  derniereDatePointage: text("derniere_date_pointage"),
});

// Table des badges
export const badges = pgTable("badges", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  iconEmoji: text("icon_emoji"),
  pointsRequired: integer("points_required").default(0),
});

// Table de jointure badges_utilisateurs
export const badgesUtilisateurs = pgTable("badges_utilisateurs", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  badgeId: text("badge_id").notNull().references(() => badges.id),
  obtainedAt: text("obtained_at").notNull(),
});

// Table des tâches
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(), // Ex: "TASK001"
  title: text("title").notNull(),
  description: text("description").default(""),
  priority: text("priority").notNull(), // 'Faible' | 'Moyenne' | 'Haute' | 'Critique'
  dueDate: text("due_date").notNull(),
  department: text("department").notNull(),
  requiredSkills: text("required_skills"), // Liste sérialisée
  assignedTo: text("assigned_to").references(() => employees.id),
  assignedToName: text("assigned_to_name"),
  status: text("status").notNull(), // 'À faire' | 'En cours' | 'En attente' | 'Terminée' | 'En retard' | 'Annulée'
  history: jsonb("history").default([]),
  comments: jsonb("comments").default([]),
});

// Table des demandes de congés
export const leaveRequests = pgTable("leave_requests", {
  id: text("id").primaryKey(), // Ex: "LV001"
  employeeId: text("employee_id").notNull().references(() => employees.id),
  employeeName: text("employee_name").notNull(),
  employeeRole: text("employee_role").notNull(),
  employeeAvatar: text("employee_avatar"),
  type: text("type").notNull(), // 'Congés Annuels', 'Arrêt Maladie', etc.
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  durationDays: integer("duration_days").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull(), // 'En attente' | 'Approuvé' | 'Refusé'
  urgency: boolean("urgency").default(false),
  aiAnalysis: text("ai_analysis"),
});

// Table des pointages d'arrivée et de départ
export const attendances = pgTable("attendances", {
  id: text("id").primaryKey(), // Ex: "ATT001"
  employeeId: text("employee_id").notNull().references(() => employees.id),
  date: text("date").notNull(), // YYYY-MM-DD
  clockIn: text("clock_in"), // HH:MM
  clockOut: text("clock_out"), // HH:MM
  status: text("status").notNull(), // 'Présent' | 'Retard' | 'Absent' | 'Pause' | 'Non pointé'
  hoursWorked: integer("hours_worked").default(0), // Heures de travail
  delayMinutes: integer("delay_minutes").default(0),
  timeline: jsonb("timeline").default([]), // Enregistrement précis des entrées, pauses, sorties
});

// Table des alertes système
export const systemAlerts = pgTable("system_alerts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  severity: text("severity").notNull(), // 'critique' | 'warning' | 'info'
  description: text("description").notNull(),
  timestamp: text("timestamp").notNull(),
  resolved: boolean("resolved").default(false),
});

// Table des logs de décisions d'IA
export const aiDecisionLogs = pgTable("ai_decision_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  type: text("type").notNull(), // 'assignment' | 'reassignment' | 'surcharge' | 'risk_detected'
  title: text("title").notNull(),
  description: text("description").notNull(),
  details: text("details").notNull(),
});

// Table des bornes autorisées (tablettes physiques de l'entreprise)
export const bornesAutorisees = pgTable("bornes_autorisees", {
  id: text("id").primaryKey(), // Identifiant unique de l'appareil
  name: text("name").notNull(), // Nom de la borne
  activatedAt: text("activated_at").notNull(), // Date d'activation
  isActive: boolean("is_active").default(true).notNull(), // Statut actif/inactif
  sessionToken: text("session_token").notNull(), // Jeton de session longue sécurisé
});

// Table des jetons d'appairage temporaires
export const jetonsAppairage = pgTable("jetons_appairage", {
  code: text("code").primaryKey(), // Code secret unique éphémère (ex: "AUTH-749-X")
  expiresAt: text("expires_at").notNull(), // Date d'expiration (ISO string)
  status: text("status").default("valide").notNull(), // 'valide' | 'utilise'
});
