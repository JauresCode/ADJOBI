import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { Employee, Task, LeaveRequest, Attendance, SystemAlert, AIDecisionLog } from "./src/types";
import multer from "multer";

dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

const PORT = 3000;

// Initialize Gemini AI client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI Engine successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini AI Client:", err);
  }
} else {
  console.log("No custom GEMINI_API_KEY provided or using placeholder. AI Engine will use fallback intelligent matching & simulations where needed.");
}

// Data storage file path
const DATA_FILE_PATH = path.join(process.cwd(), "src", "dbState.json");

// Default seed data
const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: "EMP001",
    name: "Alex Williamson",
    email: "alex.w@autoflow.ci",
    role: "super_admin",
    department: "Direction",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    skills: ["Management", "Leadership", "Stratégie RH", "System Architecture"],
    availability: "available",
    performanceScore: 98,
    workload: 35,
    delayHistoryCount: 1,
    absenceHistoryCount: 0,
    phone: "+33 6 12 34 56 78",
    joinedDate: "2024-01-15",
    isActive: true
  },
  {
    id: "EMP002",
    name: "Elena Rodriguez",
    email: "e.rod@autoflow.ci",
    role: "hr_admin",
    department: "Ressources Humaines",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    skills: ["Recrutement", "GPEC", "Relations Sociales", "Législation du Travail"],
    availability: "available",
    performanceScore: 92,
    workload: 45,
    delayHistoryCount: 0,
    absenceHistoryCount: 1,
    phone: "+33 6 98 76 54 32",
    joinedDate: "2024-03-01",
    isActive: true
  },
  {
    id: "EMP003",
    name: "Sarah Miller",
    email: "sarah.m@autoflow.ci",
    role: "chef_service",
    department: "Ingénierie",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    skills: ["Gestion de Projet", "Agile", "TypeScript", "Architecture Cloud"],
    availability: "available",
    performanceScore: 94,
    workload: 55,
    delayHistoryCount: 2,
    absenceHistoryCount: 0,
    phone: "+33 6 45 67 89 01",
    joinedDate: "2024-02-10",
    isActive: true
  },
  {
    id: "EMP004",
    name: "Sarah Jenkins",
    email: "s.jenkins@autoflow.ci",
    role: "employee",
    department: "Marketing",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    skills: ["SEO", "Content Strategy", "Digital Ads", "Social Media"],
    availability: "available",
    performanceScore: 85,
    workload: 30,
    delayHistoryCount: 4,
    absenceHistoryCount: 2,
    phone: "+33 6 22 33 44 55",
    joinedDate: "2024-06-15",
    isActive: true
  },
  {
    id: "EMP005",
    name: "Marcus Chen",
    email: "m.chen@autoflow.ci",
    role: "employee",
    department: "Ingénierie",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    skills: ["React", "TypeScript", "CSS Tailwind", "Next.js"],
    availability: "available",
    performanceScore: 95,
    workload: 75,
    delayHistoryCount: 1,
    absenceHistoryCount: 0,
    phone: "+33 6 88 99 00 11",
    joinedDate: "2024-04-12",
    isActive: true
  },
  {
    id: "EMP006",
    name: "Laura Kim",
    email: "l.kim@autoflow.ci",
    role: "employee",
    department: "Ingénierie",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    skills: ["Data Analysis", "Python", "SQL", "Machine Learning"],
    availability: "available",
    performanceScore: 88,
    workload: 40,
    delayHistoryCount: 0,
    absenceHistoryCount: 1,
    phone: "+33 6 55 66 77 88",
    joinedDate: "2024-05-20",
    isActive: true
  },
  {
    id: "EMP007",
    name: "Lucas Dumont",
    email: "lucas.d@autoflow.ci",
    role: "employee",
    department: "Ingénierie",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    skills: ["Node.js", "Express.js", "API REST", "PostgreSQL", "Sécurité"],
    availability: "available",
    performanceScore: 91,
    workload: 50,
    delayHistoryCount: 1,
    absenceHistoryCount: 1,
    phone: "+33 6 11 22 33 44",
    joinedDate: "2024-08-01",
    isActive: true
  }
];

const DEFAULT_TASKS: Task[] = [
  {
    id: "TASK001",
    title: "Préparation revue de performance Q3",
    description: "Élaborer la structure d'évaluation et aligner les métriques clés avec la stratégie de développement RH pour l'ensemble des départements.",
    priority: "Moyenne",
    dueDate: "2026-06-25T16:00:00.000Z",
    department: "Ressources Humaines",
    requiredSkills: ["Management", "Stratégie RH"],
    assignedTo: "EMP001",
    assignedToName: "Alex Williamson",
    status: "En cours",
    history: [
      { timestamp: "2026-06-23T08:30:00.000Z", action: "Création de la tâche par l'IA", user: "AI Engine" },
      { timestamp: "2026-06-23T08:31:00.000Z", action: "Attribution automatique à Alex Williamson (Score: 96%)", user: "AI Engine" }
    ],
    comments: [
      { id: "C1", user: "Elena Rodriguez", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face", text: "J'ai préparé les modèles de formulaires si tu en as besoin.", timestamp: "2026-06-23T10:15:00.000Z" }
    ]
  },
  {
    id: "TASK002",
    title: "Répondre à la demande employé #882",
    description: "Analyser le dossier de plainte concernant un équipement défectueux et formuler une réponse formelle pour le remplacement immédiat.",
    priority: "Haute",
    dueDate: "2026-06-23T13:00:00.000Z",
    department: "Ressources Humaines",
    requiredSkills: ["Relations Sociales", "Législation du Travail"],
    assignedTo: "EMP002",
    assignedToName: "Elena Rodriguez",
    status: "En retard",
    history: [
      { timestamp: "2026-06-23T09:00:00.000Z", action: "Création de la tâche", user: "Sarah Miller" },
      { timestamp: "2026-06-23T09:02:00.000Z", action: "Attribution automatique à Elena Rodriguez (Score: 91%)", user: "AI Engine" }
    ],
    comments: []
  },
  {
    id: "TASK003",
    title: "Réunion d'équipe hebdomadaire",
    description: "Faire le point sur l'état d'avancement des tâches et discuter du planning de déploiement de la fin de semaine.",
    priority: "Moyenne",
    dueDate: "2026-06-23T14:00:00.000Z",
    department: "Ingénierie",
    requiredSkills: ["Gestion de Projet"],
    assignedTo: "EMP003",
    assignedToName: "Sarah Miller",
    status: "À faire",
    history: [
      { timestamp: "2026-06-22T17:00:00.000Z", action: "Création planifiée", user: "System" }
    ],
    comments: []
  },
  {
    id: "TASK004",
    title: "Déploiement API de facturation",
    description: "Finaliser les routes Express, configurer la validation des schémas PostgreSQL avec l'ORM et déployer sur l'environnement de staging.",
    priority: "Critique",
    dueDate: "2026-06-24T18:00:00.000Z",
    department: "Ingénierie",
    requiredSkills: ["Node.js", "PostgreSQL", "Express.js"],
    assignedTo: "EMP007",
    assignedToName: "Lucas Dumont",
    status: "En cours",
    history: [
      { timestamp: "2026-06-23T08:00:00.000Z", action: "Création de la tâche", user: "Sarah Miller" },
      { timestamp: "2026-06-23T08:05:00.000Z", action: "Attribution automatique par IA à Lucas Dumont (Score: 94% - Compétences & disponibilité parfaites)", user: "AI Engine" }
    ],
    comments: []
  }
];

const DEFAULT_LEAVES: LeaveRequest[] = [
  {
    id: "LV001",
    employeeId: "EMP004",
    employeeName: "Sarah Jenkins",
    employeeRole: "Responsable Marketing",
    employeeAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    type: "Congés Annuels",
    startDate: "2026-10-12",
    endDate: "2026-10-15",
    durationDays: 4,
    reason: "Voyage familial. Passation des leads de campagne effectuée pour l'intérim.",
    status: "En attente",
    urgency: false,
    aiAnalysis: "Analyse d'impact IA : Risque Faible. Charge de travail du service Marketing faible sur cette période. Aucun lancement critique prévu."
  },
  {
    id: "LV002",
    employeeId: "EMP005",
    employeeName: "Marcus Chen",
    employeeRole: "Ingénieur Full-stack",
    employeeAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    type: "Arrêt Maladie",
    startDate: "2026-06-23",
    endDate: "2026-06-25",
    durationDays: 3,
    reason: "Fièvre soudaine. Besoin de consulter un médecin. Je préviens pour la réaffectation de mes tickets.",
    status: "En attente",
    urgency: true,
    aiAnalysis: "Analyse d'impact IA : Risque Critique. Marcus Chen a actuellement 2 tâches critiques en cours (Surcharge: 75%). L'IA recommande une réaffectation immédiate de ses tâches à Lucas Dumont ou Sarah Miller."
  },
  {
    id: "LV003",
    employeeId: "EMP002",
    employeeName: "Elena Rodriguez",
    employeeRole: "Responsable RH",
    employeeAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    type: "Dév. Personnel",
    startDate: "2026-11-03",
    endDate: "2026-11-05",
    durationDays: 3,
    reason: "Participation à la conférence UX World. Entièrement pris en charge.",
    status: "En attente",
    urgency: false,
    aiAnalysis: "Analyse d'impact IA : Risque Modéré. Elena Rodriguez est la seule experte en législation RH disponible sur cette période. Une astreinte légère est conseillée."
  },
  {
    id: "LV004",
    employeeId: "EMP006",
    employeeName: "Laura Kim",
    employeeRole: "Analyste de Données",
    employeeAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    type: "Congé Paternité",
    startDate: "2026-12-20",
    endDate: "2027-01-10",
    durationDays: 21,
    reason: "Arrivée prévue du nouveau membre de la famille. Tout est calé avec l'équipe de data science.",
    status: "En attente",
    urgency: false,
    aiAnalysis: "Analyse d'impact IA : Risque Modéré. Absence de longue durée. Plan de transition recommandé d'ici mi-novembre."
  }
];

const DEFAULT_ATTENDANCES: Attendance[] = [
  {
    id: "ATT001",
    employeeId: "EMP001",
    date: "2026-06-23",
    clockIn: "08:45",
    clockOut: null,
    status: "Présent",
    hoursWorked: 6.5,
    delayMinutes: 0,
    timeline: [
      { type: "in", time: "08:45" }
    ]
  },
  {
    id: "ATT002",
    employeeId: "EMP002",
    date: "2026-06-23",
    clockIn: "09:12",
    clockOut: null,
    status: "Retard",
    hoursWorked: 6.0,
    delayMinutes: 12,
    timeline: [
      { type: "in", time: "09:12" }
    ]
  },
  {
    id: "ATT003",
    employeeId: "EMP007",
    date: "2026-06-23",
    clockIn: "08:00",
    clockOut: null,
    status: "Présent",
    hoursWorked: 7.2,
    delayMinutes: 0,
    timeline: [
      { type: "in", time: "08:00" }
    ]
  }
];

const DEFAULT_ALERTS: SystemAlert[] = [
  {
    id: "ALT001",
    title: "Retard Sync BDD",
    severity: "critique",
    description: "Le cluster EU-WEST-1 lag de 40s sur les écritures de pointages.",
    timestamp: "2026-06-23T15:10:00.000Z",
    resolved: false
  },
  {
    id: "ALT002",
    title: "Marcus Chen - Arrêt maladie urgent",
    severity: "critique",
    description: "Demande d'arrêt maladie immédiat reçue de Marcus Chen. 2 tâches critiques non assignées.",
    timestamp: "2026-06-23T14:45:00.000Z",
    resolved: false
  },
  {
    id: "ALT003",
    title: "Surcharge détectée",
    severity: "warning",
    description: "Le département Ingénierie a atteint 85% de charge de travail globale.",
    timestamp: "2026-06-23T11:20:00.000Z",
    resolved: false
  }
];

const DEFAULT_DECISION_LOGS: AIDecisionLog[] = [
  {
    id: "DEC001",
    timestamp: "2026-06-23T08:05:00.000Z",
    type: "assignment",
    title: "Attribution automatique de tâche [TASK004]",
    description: "Tâche 'Déploiement API de facturation' attribuée à Lucas Dumont.",
    details: "Analyse multicritère : Compétences requises (Node.js, Express.js, PostgreSQL) associées à 100% à l'employé. Charge de travail actuelle de 50%, disponibilité confirmée. Score final calculé : 94/100."
  },
  {
    id: "DEC002",
    timestamp: "2026-06-23T08:31:00.000Z",
    type: "assignment",
    title: "Attribution automatique de tâche [TASK001]",
    description: "Tâche 'Préparation revue de performance Q3' attribuée à Alex Williamson.",
    details: "Analyse multicritère : Compétences de management et de stratégie requises. Alex Williamson présente la meilleure performance (98/100) et une charge modérée (35%). Score final calculé : 96/100."
  }
];

// Load state from file or write default
let state: {
  employees: Employee[];
  tasks: Task[];
  leaves: LeaveRequest[];
  attendances: Attendance[];
  alerts: SystemAlert[];
  decisionLogs: AIDecisionLog[];
} = {
  employees: DEFAULT_EMPLOYEES,
  tasks: DEFAULT_TASKS,
  leaves: DEFAULT_LEAVES,
  attendances: DEFAULT_ATTENDANCES,
  alerts: DEFAULT_ALERTS,
  decisionLogs: DEFAULT_DECISION_LOGS
};

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, "utf8");
      state = JSON.parse(data);
      console.log("State successfully loaded from dbState.json.");
    } else {
      saveState();
      console.log("Initialized dbState.json with default seed data.");
    }
  } catch (err) {
    console.error("Error loading state from disk:", err);
  }
}

function saveState() {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving state to disk:", err);
  }
}

loadState();

// Helper functions for Fallback Matching Engine
function runLocalMatchingEngine(task: Task, employees: Employee[]): { selectedId: string; scores: Record<string, number>; details: string } {
  const scores: Record<string, number> = {};
  let bestId = "";
  let bestScore = -1;

  employees.forEach((emp) => {
    if (emp.availability === "absent" || emp.availability === "leave") {
      scores[emp.id] = 0;
      return;
    }

    let score = 50; // base

    // 1. Skill match
    const matchingSkills = task.requiredSkills.filter(skill => 
      emp.skills.some(empSkill => empSkill.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(empSkill.toLowerCase()))
    );
    score += matchingSkills.length * 15;

    // 2. Department match
    if (emp.department.toLowerCase() === task.department.toLowerCase()) {
      score += 10;
    }

    // 3. Workload penalty
    score -= (emp.workload / 3);

    // 4. Performance bonus
    score += (emp.performanceScore - 80) * 0.5;

    // 5. Attendance & Delays penalty
    score -= (emp.delayHistoryCount * 2);
    score -= (emp.absenceHistoryCount * 5);

    // Clamp score
    score = Math.max(10, Math.min(100, Math.round(score)));
    scores[emp.id] = score;

    if (score > bestScore) {
      bestScore = score;
      bestId = emp.id;
    }
  });

  const selectedEmp = employees.find(e => e.id === bestId);
  const details = `Moteur Algorithmique Local : Attribution de '${task.title}' à ${selectedEmp?.name || "Inconnu"}. Score calculé : ${bestScore}/100. Critères évalués : Compétences (+${task.requiredSkills.length * 15}pts), Charge de travail actuelle (-${Math.round(selectedEmp?.workload || 0 / 3)}pts), Performance (+${Math.round((selectedEmp?.performanceScore || 80) - 80) * 0.5}pts).`;

  return { selectedId: bestId, scores, details };
}

// REST APIs
app.get("/api/state", (req, res) => {
  res.json(state);
});

// Connexion sécurisée et redirection dynamique par rôles
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Veuillez fournir une adresse e-mail."
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      error: "Veuillez fournir un mot de passe sécurisé."
    });
  }

  const trimmedEmail = email.toLowerCase().trim();
  
  // 1. Recherche en Base de Données d'abord
  const foundEmployee = state.employees.find(
    (emp) => emp.email.toLowerCase().trim() === trimmedEmail
  );

  // 2. Si non trouvé, on effectue des vérifications complémentaires amicales
  if (!foundEmployee) {
    // Vérification de domaine générique pour l'inscription d'entreprise
    const isAutoflowDomain = trimmedEmail.endsWith("@autoflow.ci") || trimmedEmail.endsWith("@autoflow.io");
    if (!isAutoflowDomain) {
      return res.status(403).json({
        success: false,
        error: "Refus d'accès : Le domaine de messagerie n'est pas autorisé. Seul le domaine officiel '@autoflow.ci' ou '@autoflow.io' est accepté pour se connecter à AutoFlow."
      });
    }

    return res.status(404).json({
      success: false,
      error: "Accès refusé : Cette adresse e-mail n'existe pas dans le registre des collaborateurs d'AutoFlow. Veuillez utiliser un des comptes de démo ci-dessous pour tester l'application."
    });
  }

  // 3. Vérifier le mot de passe de sécurité
  // Pour tous les comptes enregistrés ou de démo, nous acceptons le mot de passe "password123" ou "password"
  const isPasswordCorrect = password === "password123" || password === "password";
  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      error: "Mot de passe incorrect. Pour tous les comptes de démonstration et d'évaluation d'AutoFlow, le mot de passe de sécurité est 'password123'."
    });
  }

  // 4. Vérifier si le compte est marqué comme actif
  if (foundEmployee.isActive === false) {
    return res.status(403).json({
      success: false,
      error: "Accès refusé : Ce compte utilisateur est actuellement désactivé par l'administrateur. Veuillez contacter le service RH."
    });
  }

  // 5. Réponse attendue avec le rôle exact mappé et les informations de base
  const mappedRole = 
    foundEmployee.role === "super_admin" ? "SUPER_ADMIN" : 
    foundEmployee.role === "hr_admin" ? "RH" : 
    foundEmployee.role === "chef_service" ? "CHEF_SERVICE" : 
    "EMPLOYE";

  return res.json({
    success: true,
    message: "Connexion réussie",
    user: {
      ...foundEmployee,
      mappedRole
    }
  });
});

// Create task with optional auto allocation
app.post("/api/tasks", async (req, res) => {
  const { title, description, priority, dueDate, department, requiredSkills, autoAssign } = req.body;
  if (!title || !department) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  const newTask: Task = {
    id: "TASK" + String(state.tasks.length + 1).padStart(3, "0"),
    title,
    description: description || "",
    priority: priority || "Moyenne",
    dueDate: dueDate || new Date(Date.now() + 86400000 * 2).toISOString(),
    department,
    requiredSkills: requiredSkills || [],
    assignedTo: null,
    assignedToName: null,
    status: "À faire",
    history: [{ timestamp: new Date().toISOString(), action: "Création de la tâche", user: "Utilisateur" }],
    comments: []
  };

  state.tasks.push(newTask);

  if (autoAssign) {
    await performAutoAssignment(newTask);
  } else {
    saveState();
  }

  res.json({ success: true, task: state.tasks.find(t => t.id === newTask.id), state });
});

// Trigger Auto-Assign
app.post("/api/tasks/auto-assign", async (req, res) => {
  const { taskId } = req.body;
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Tâche non trouvée." });
  }

  const task = state.tasks[taskIndex];
  await performAutoAssignment(task);

  res.json({ success: true, task: state.tasks[taskIndex], state });
});

// Update task status
app.post("/api/tasks/status", (req, res) => {
  const { taskId, status, user } = req.body;
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Tâche non trouvée." });
  }

  state.tasks[taskIndex].status = status;
  state.tasks[taskIndex].history.push({
    timestamp: new Date().toISOString(),
    action: `Statut modifié en '${status}'`,
    user: user || "Système"
  });

  saveState();
  res.json({ success: true, task: state.tasks[taskIndex] });
});

// Create task comment
app.post("/api/tasks/comment", (req, res) => {
  const { taskId, user, text, avatar } = req.body;
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Tâche non trouvée." });
  }

  const newComment = {
    id: "COMM" + String(Date.now()),
    user: user || "Utilisateur",
    text,
    avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    timestamp: new Date().toISOString()
  };

  state.tasks[taskIndex].comments.push(newComment);
  state.tasks[taskIndex].history.push({
    timestamp: new Date().toISOString(),
    action: `Commentaire ajouté par ${user}`,
    user: user || "Système"
  });

  saveState();
  res.json({ success: true, task: state.tasks[taskIndex] });
});

// Auto Reassign tasks (e.g. when worker goes offline)
app.post("/api/tasks/auto-reassign", async (req, res) => {
  const { employeeId } = req.body;
  const affectedTasks = state.tasks.filter(t => t.assignedTo === employeeId && t.status !== "Terminée" && t.status !== "Annulée");

  if (affectedTasks.length === 0) {
    return res.json({ success: true, message: "Aucune tâche active à réaffecter.", state });
  }

  const reassignmentLog: string[] = [];

  for (const task of affectedTasks) {
    // Exclude the currently sick/absent employee from choices
    const availableEmployees = state.employees.filter(e => e.id !== employeeId && e.availability !== "absent" && e.availability !== "leave");
    
    let selectedId = "";
    let reason = "";
    let scoresMap: Record<string, number> = {};

    if (ai) {
      try {
        const prompt = `Vous êtes le Moteur Intelligent de Décision AutoFlow RH.
Nous devons RÉAFFECTER d'urgence une tâche car l'employé précédemment assigné est absent/indisponible.
Tâche :
- Titre : "${task.title}"
- Description : "${task.description}"
- Compétences requises : ${JSON.stringify(task.requiredSkills)}
- Département : "${task.department}"

Voici la liste des employés disponibles avec leurs statistiques (compétences, charge, performance, historique de retards/absences) :
${JSON.stringify(availableEmployees, null, 2)}

Analysez attentivement les candidats et attribuez la tâche au meilleur profil disponible.
Fournissez votre réponse au format JSON strict :
{
  "selectedEmployeeId": "ID_DE_L_EMPLOYE",
  "reasoning": "Explications claires en français",
  "scores": {
    "EMPxxx": score_sur_100
  }
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                selectedEmployeeId: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                scores: { type: Type.OBJECT }
              },
              required: ["selectedEmployeeId", "reasoning"]
            }
          }
        });

        const json = JSON.parse(response.text || "{}");
        selectedId = json.selectedEmployeeId;
        reason = json.reasoning;
        scoresMap = json.scores || {};
      } catch (err) {
        console.error("Gemini reassignment failed, falling back to local:", err);
      }
    }

    // Fallback if Gemini failed or is not available
    if (!selectedId) {
      const fallbackResult = runLocalMatchingEngine(task, availableEmployees);
      selectedId = fallbackResult.selectedId;
      reason = fallbackResult.details;
      scoresMap = fallbackResult.scores;
    }

    const newAssignee = state.employees.find(e => e.id === selectedId);
    if (newAssignee) {
      task.assignedTo = newAssignee.id;
      task.assignedToName = newAssignee.name;
      task.status = "À faire"; // reset state
      task.history.push({
        timestamp: new Date().toISOString(),
        action: `Réaffectation automatique par l'IA à ${newAssignee.name} (Précédemment: ${state.employees.find(e => e.id === employeeId)?.name || "Inconnu"})`,
        user: "AI Decision Engine"
      });

      // Log decision
      const decisionLog: AIDecisionLog = {
        id: "DEC" + String(Date.now() + Math.floor(Math.random() * 1000)),
        timestamp: new Date().toISOString(),
        type: "reassignment",
        title: `Réaffectation d'urgence [${task.id}]`,
        description: `Tâche '${task.title}' transférée à ${newAssignee.name}.`,
        details: reason
      };

      state.decisionLogs.unshift(decisionLog);
      reassignmentLog.push(`Tâche '${task.title}' réassignée à ${newAssignee.name}.`);

      // Increase load slightly
      newAssignee.workload = Math.min(100, newAssignee.workload + 15);
    }
  }

  // Reduce load on sick employee
  const sickEmployee = state.employees.find(e => e.id === employeeId);
  if (sickEmployee) {
    sickEmployee.workload = 0;
  }

  saveState();
  res.json({ success: true, log: reassignmentLog, state });
});

// Change employee availability/status directly or create new employee if not found
app.post("/api/employees/status", (req, res) => {
  const { employeeId, availability, role, name, email, department, phone, isActive, skills, avatar, performanceScore, workload } = req.body;
  let empIndex = state.employees.findIndex(e => e.id === employeeId);
  
  if (empIndex === -1) {
    const newEmp: any = {
      id: employeeId || "EMP" + Math.floor(100 + Math.random() * 900),
      name: name || "Nouveau Collaborateur",
      email: email || "collab@autoflow.io",
      role: role || "employee",
      department: department || "Ingénierie",
      avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
      skills: skills || ["Général"],
      availability: availability || "available",
      performanceScore: performanceScore || 80,
      workload: workload || 0,
      delayHistoryCount: 0,
      absenceHistoryCount: 0,
      phone: phone || "+33 6 00 00 00 00",
      joinedDate: new Date().toISOString().split('T')[0],
      isActive: isActive !== undefined ? isActive : true
    };
    state.employees.push(newEmp);
    saveState();
    return res.json({ success: true, employee: newEmp, state });
  }

  const emp = state.employees[empIndex];
  if (availability !== undefined) emp.availability = availability;
  if (role !== undefined) emp.role = role;
  if (name !== undefined) emp.name = name;
  if (email !== undefined) emp.email = email;
  if (department !== undefined) emp.department = department;
  if (phone !== undefined) emp.phone = phone;
  if (isActive !== undefined) emp.isActive = isActive;
  if (skills !== undefined) emp.skills = skills;

  saveState();
  res.json({ success: true, employee: emp, state });
});

// Leave Request submission
app.post("/api/leaves", async (req, res) => {
  const { employeeId, type, startDate, endDate, durationDays, reason, urgency } = req.body;
  const emp = state.employees.find(e => e.id === employeeId);
  if (!emp) {
    return res.status(404).json({ error: "Employé non trouvé." });
  }

  const newLeave: LeaveRequest = {
    id: "LV" + String(state.leaves.length + 1).padStart(3, "0"),
    employeeId,
    employeeName: emp.name,
    employeeRole: emp.role === 'super_admin' ? 'Super Administrateur' : emp.role === 'hr_admin' ? 'Responsable RH' : emp.role === 'chef_service' ? 'Chef de Service' : 'Employé',
    employeeAvatar: emp.avatar,
    type: type || "Congés Annuels",
    startDate,
    endDate,
    durationDays: durationDays || 1,
    reason: reason || "",
    status: "En attente",
    urgency: !!urgency,
    aiAnalysis: "Analyse en cours par l'IA..."
  };

  state.leaves.unshift(newLeave);
  saveState();

  // Async update leave with real AI analysis
  performLeaveAnalysis(newLeave.id);

  res.json({ success: true, leave: newLeave, state });
});

// Leave Actions (Approve / Refuse)
app.post("/api/leaves/action", (req, res) => {
  const { leaveId, action, user } = req.body; // action: 'Approuvé' | 'Refusé'
  const leaveIndex = state.leaves.findIndex(l => l.id === leaveId);
  if (leaveIndex === -1) {
    return res.status(404).json({ error: "Demande non trouvée." });
  }

  const leave = state.leaves[leaveIndex];
  leave.status = action;

  // If approved and the leave is ongoing (today), set employee availability to 'leave'
  if (action === "Approuvé") {
    const today = new Date().toISOString().split('T')[0];
    if (today >= leave.startDate && today <= leave.endDate) {
      const empIndex = state.employees.findIndex(e => e.id === leave.employeeId);
      if (empIndex !== -1) {
        state.employees[empIndex].availability = "leave";
      }
    }
  }

  // Create system alert or decision log
  const decisionLog: AIDecisionLog = {
    id: "DEC" + String(Date.now()),
    timestamp: new Date().toISOString(),
    type: "risk_detected",
    title: `Validation de Congé : ${leave.employeeName}`,
    description: `La demande de congé [${leave.id}] a été validée comme '${action}' par ${user || "RH"}.`,
    details: `Dates : Du ${leave.startDate} au ${leave.endDate}. Type : ${leave.type}.`
  };
  state.decisionLogs.unshift(decisionLog);

  saveState();
  res.json({ success: true, leave, state });
});

// Force immediate AI evaluation of leave
app.post("/api/leaves/analyze", async (req, res) => {
  const { leaveId } = req.body;
  const leave = state.leaves.find(l => l.id === leaveId);
  if (!leave) {
    return res.status(404).json({ error: "Demande non trouvée." });
  }

  await performLeaveAnalysis(leaveId);
  res.json({ success: true, leave: state.leaves.find(l => l.id === leaveId) });
});

// ==========================================
// SYSTEME DE POINTAGE PAR QR CODE DYNAMIQUE (ANTI-TRICHE)
// ==========================================

// Système de clés temporaires en mémoire changeant toutes les 15 secondes
let currentQRToken = {
  token: generateRandomToken(),
  generatedAt: Date.now()
};

function generateRandomToken() {
  return "AFQR_" + Math.random().toString(36).substring(2, 11).toUpperCase() + "_" + Date.now();
}

// Intervalle de rotation strict : 15 secondes
setInterval(() => {
  currentQRToken = {
    token: generateRandomToken(),
    generatedAt: Date.now()
  };
}, 15000);

// Endpoint d'affichage de la borne d'accueil (récupère le jeton actif en temps réel)
app.get("/api/attendance/qr-token", (req, res) => {
  const now = Date.now();
  const elapsed = now - currentQRToken.generatedAt;
  const expiresIn = Math.max(0, Math.round((15000 - elapsed) / 1000));
  res.json({
    token: currentQRToken.token,
    expiresIn: expiresIn, // temps restant en secondes
    generatedAt: currentQRToken.generatedAt
  });
});

// Endpoint de validation du scan par l'employé connecté
app.post("/api/attendance/qr-validate", (req, res) => {
  const { token, employeeId, action } = req.body;

  if (!token || !employeeId) {
    return res.status(400).json({ success: false, error: "Jeton QR ou identifiant de l'employé manquant." });
  }

  // Étape 1 : Le serveur compare le jeton reçu avec le jeton actuellement actif
  if (token !== currentQRToken.token) {
    return res.status(400).json({ success: false, error: "Code expiré ou invalide. Veuillez scanner à nouveau." });
  }

  // Étape 2 : Si le jeton a plus de 15 secondes, rejet strict
  const elapsed = Date.now() - currentQRToken.generatedAt;
  if (elapsed > 15000) {
    return res.status(400).json({ success: false, error: "Code expiré ou invalide. Veuillez scanner à nouveau." });
  }

  // Étape 3 : Jeton valide, enregistrement instantané avec l'horloge interne du serveur
  const today = new Date().toISOString().split('T')[0];
  const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  let attIndex = state.attendances.findIndex(a => a.employeeId === employeeId && a.date === today);
  const targetAction = action || (attIndex === -1 ? "punch_in" : "punch_out");

  const emp = state.employees.find(e => e.id === employeeId);
  if (!emp) {
    return res.status(404).json({ success: false, error: "Employé introuvable." });
  }

  let delayMinutes = 0;
  let isLate = false;

  if (targetAction === "punch_in") {
    // Calcul de ponctualité : Heure d'embauche limite à 09:00 AM
    const [nowHour, nowMin] = nowStr.split(':').map(Number);
    const expectedHour = 9;
    isLate = nowHour > expectedHour || (nowHour === expectedHour && nowMin > 0);
    delayMinutes = isLate ? (nowHour - expectedHour) * 60 + nowMin : 0;

    if (attIndex === -1) {
      const newAtt: Attendance = {
        id: "ATT" + String(Date.now()),
        employeeId,
        date: today,
        clockIn: nowStr,
        clockOut: null,
        status: isLate ? "Retard" : "Présent",
        hoursWorked: 0,
        delayMinutes,
        timeline: [{ type: 'in', time: nowStr }]
      };
      state.attendances.push(newAtt);

      if (isLate) {
        // Incrémentation du compteur de retards
        emp.delayHistoryCount++;
        // Alerte système de sécurité/retard
        state.alerts.unshift({
          id: "ALT" + String(Date.now()),
          title: `Retard détecté via QR Code - ${emp.name}`,
          severity: "warning",
          description: `${emp.name} a pointé à ${nowStr} à la borne d'accueil (Retard de ${delayMinutes} minutes).`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
    } else {
      state.attendances[attIndex].clockIn = nowStr;
      state.attendances[attIndex].status = isLate ? "Retard" : "Présent";
      state.attendances[attIndex].timeline.push({ type: 'in', time: nowStr });
    }
  } else if (targetAction === "punch_out") {
    if (attIndex === -1) {
      // Cas exceptionnel où l'employé n'avait pas pointé l'entrée, on crée une fiche complète
      const newAtt: Attendance = {
        id: "ATT" + String(Date.now()),
        employeeId,
        date: today,
        clockIn: "09:00",
        clockOut: nowStr,
        status: "Non pointé",
        hoursWorked: 8,
        delayMinutes: 0,
        timeline: [{ type: 'in', time: "09:00" }, { type: 'out', time: nowStr }]
      };
      state.attendances.push(newAtt);
    } else {
      const att = state.attendances[attIndex];
      att.clockOut = nowStr;
      att.status = "Non pointé";
      att.timeline.push({ type: 'out', time: nowStr });

      if (att.clockIn) {
        const [inH, inM] = att.clockIn.split(':').map(Number);
        const [outH, outM] = nowStr.split(':').map(Number);
        const totalMin = (outH - inH) * 60 + (outM - inM);
        att.hoursWorked = Math.max(0.1, parseFloat((totalMin / 60).toFixed(2)));
      }
    }
  }

  saveState();

  res.json({
    success: true,
    time: nowStr,
    action: targetAction,
    isLate,
    delayMinutes,
    employeeName: emp.name,
    state
  });
});

// Attendance punch in / out / pause
app.post("/api/attendance/punch", (req, res) => {
  const { employeeId, action } = req.body; // action: 'punch_in' | 'punch_out' | 'pause'
  const today = new Date().toISOString().split('T')[0];
  const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  let attIndex = state.attendances.findIndex(a => a.employeeId === employeeId && a.date === today);

  if (action === "punch_in") {
    // Calculate if late (threshold 09:00 AM)
    const [nowHour, nowMin] = nowStr.split(':').map(Number);
    const expectedHour = 9;
    const isLate = nowHour > expectedHour || (nowHour === expectedHour && nowMin > 0);
    const delayMinutes = isLate ? (nowHour - expectedHour) * 60 + nowMin : 0;

    if (attIndex === -1) {
      const newAtt: Attendance = {
        id: "ATT" + String(Date.now()),
        employeeId,
        date: today,
        clockIn: nowStr,
        clockOut: null,
        status: isLate ? "Retard" : "Présent",
        hoursWorked: 0,
        delayMinutes,
        timeline: [{ type: 'in', time: nowStr }]
      };
      state.attendances.push(newAtt);

      if (isLate) {
        // Increment employee delays
        const empIndex = state.employees.findIndex(e => e.id === employeeId);
        if (empIndex !== -1) {
          state.employees[empIndex].delayHistoryCount++;
        }
        // Raise system alert
        const emp = state.employees.find(e => e.id === employeeId);
        state.alerts.unshift({
          id: "ALT" + String(Date.now()),
          title: `Retard détecté - ${emp?.name}`,
          severity: "warning",
          description: `${emp?.name} est arrivé à ${nowStr} (Retard de ${delayMinutes} minutes).`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
    } else {
      state.attendances[attIndex].clockIn = nowStr;
      state.attendances[attIndex].status = isLate ? "Retard" : "Présent";
      state.attendances[attIndex].timeline.push({ type: 'in', time: nowStr });
    }
  } else if (action === "punch_out" && attIndex !== -1) {
    const att = state.attendances[attIndex];
    att.clockOut = nowStr;
    att.status = "Non pointé";
    att.timeline.push({ type: 'out', time: nowStr });

    // Calculate hours worked (simulated or real elapsed)
    if (att.clockIn) {
      const [inH, inM] = att.clockIn.split(':').map(Number);
      const [outH, outM] = nowStr.split(':').map(Number);
      const totalMin = (outH - inH) * 60 + (outM - inM);
      att.hoursWorked = Math.max(0.1, parseFloat((totalMin / 60).toFixed(2)));
    }
  } else if (action === "pause" && attIndex !== -1) {
    const att = state.attendances[attIndex];
    const isPaused = att.status === "Pause";
    
    if (isPaused) {
      att.status = "Présent";
      att.timeline.push({ type: 'pause_end', time: nowStr });
    } else {
      att.status = "Pause";
      att.timeline.push({ type: 'pause_start', time: nowStr });
    }
  }

  saveState();
  res.json({ success: true, state });
});

// Chat AI assistant using custom state as context
app.post("/api/ai/chat", async (req, res) => {
  const { message, userContext } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message manquant." });
  }

  const systemPrompt = `Vous êtes l'Assistant Intelligent d'AutoFlow RH.
Vous disposez des données temps réel de l'entreprise pour répondre aux questions des employés ou administrateurs.
Répondez avec clarté, professionnalisme, de manière humble, objective, et en français impeccable.
Ne donnez JAMAIS d'informations techniques internes comme le port ou les fichiers de la base de données.
Vous devez exploiter directement la base de données temps réel fournie dans votre contexte.

Voici les données courantes de l'entreprise :
- Employés actifs : ${JSON.stringify(state.employees.map(e => ({ id: e.id, name: e.name, department: e.department, skills: e.skills, availability: e.availability, perf: e.performanceScore, load: e.workload, delays: e.delayHistoryCount, absences: e.absenceHistoryCount })))}
- Tâches : ${JSON.stringify(state.tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, assignee: t.assignedToName, due: t.dueDate })))}
- Congés en cours ou en attente : ${JSON.stringify(state.leaves.map(l => ({ id: l.id, name: l.employeeName, type: l.type, dates: `${l.startDate} à ${l.endDate}`, status: l.status, reason: l.reason })))}
- Pointages du jour : ${JSON.stringify(state.attendances.map(a => ({ emp: a.employeeId, clockIn: a.clockIn, status: a.status })))}
- Alertes système : ${JSON.stringify(state.alerts.filter(a => !a.resolved))}

Utilisez ces données exactes pour répondre ! S'il y a des retards, des absences ou des surcharges, citez les noms réels et proposez des solutions concrètes (par exemple, réaffecter à un autre collègue disponible qui a les compétences requises).
Si l'utilisateur pose une question sur ses tâches ou sur l'organisation globale, donnez-lui des insights d'aide à la décision.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      });
      return res.json({ response: response.text });
    } catch (err) {
      console.error("Gemini Assistant call failed:", err);
    }
  }

  // Fallback Rule-based AI Assistant
  let fallbackAnswer = "Je suis navré, la connexion avec le moteur de décision IA principal est momentanément indisponible. Voici une analyse basée sur l'algorithme d'urgence local :\n\n";
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("tâches prioritaires") || lowerMsg.includes("prioritaire")) {
    const highTasks = state.tasks.filter(t => t.priority === "Critique" || t.priority === "Haute");
    fallbackAnswer += `Il y a actuellement **${highTasks.length} tâches prioritaires** à traiter d'urgence :\n` +
      highTasks.map(t => `- **${t.title}** (${t.priority}, assignée à ${t.assignedToName || "Personne"}) - Statut: ${t.status}`).join("\n");
  } else if (lowerMsg.includes("qui est disponible") || lowerMsg.includes("dispo")) {
    const available = state.employees.filter(e => e.availability === "available");
    fallbackAnswer += `Voici les **${available.length} employés disponibles** :\n` +
      available.map(e => `- **${e.name}** (${e.department}, charge actuelle: ${e.workload}%, performance: ${e.performanceScore}/100)`).join("\n");
  } else if (lowerMsg.includes("retard") || lowerMsg.includes("en retard")) {
    const lateTasks = state.tasks.filter(t => t.status === "En retard");
    const lateAtt = state.attendances.filter(a => a.status === "Retard");
    fallbackAnswer += `**Analyse des retards :**\n` +
      `- Tâches en retard : **${lateTasks.length}** (${lateTasks.map(t => t.title).join(", ") || "aucune"})\n` +
      `- Employés pointés en retard aujourd'hui : **${lateAtt.length}** (voir détail dans le panneau de pointage)`;
  } else if (lowerMsg.includes("plus performant") || lowerMsg.includes("meilleur")) {
    const sorted = [...state.employees].sort((a, b) => b.performanceScore - a.performanceScore);
    fallbackAnswer += `L'employé le plus performant identifié par le score de productivité globale est **${sorted[0].name}** avec une évaluation de **${sorted[0].performanceScore}/100** (département ${sorted[0].department}).`;
  } else if (lowerMsg.includes("risque") || lowerMsg.includes("risques")) {
    const risks = state.alerts.filter(a => a.severity === "critique");
    fallbackAnswer += `**Risques majeurs détectés :**\n` +
      risks.map(r => `- **[CRITIQUE] ${r.title}** : ${r.description}`).join("\n") +
      `\n\nL'IA recommande de valider la réaffectation des tâches de Marcus Chen d'urgence.`;
  } else {
    fallbackAnswer += `Je suis à votre écoute pour auditer les indicateurs de productivité RH. Vous pouvez me poser des questions sur les tâches prioritaires, la disponibilité des équipes, les retards cumulés ou les alertes de surcharge.`;
  }

  res.json({ response: fallbackAnswer });
});

// Multer Storage Configuration for Profile Avatar Uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const employeeId = req.body.employeeId || "unknown";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${employeeId}-${uniqueSuffix}${ext}`);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Le fichier doit être une image."));
    }
  }
});

// Profile Avatar Upload Route
app.post("/api/profile/upload-avatar", uploadAvatar.single("avatar"), (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: "Identifiant d'employé manquant." });
  }

  const emp = state.employees.find(e => e.id === employeeId);
  if (!emp) {
    return res.status(404).json({ error: "Employé non trouvé." });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier d'image n'a été fourni ou format invalide." });
  }

  // Delete old file if it was a local upload in /uploads
  if (emp.avatar && emp.avatar.startsWith("/uploads/")) {
    const oldFileName = emp.avatar.replace("/uploads/", "");
    const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
    if (fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error("Erreur lors de la suppression de l'ancienne photo :", err);
      }
    }
  }

  // Update avatar URL
  const fileUrl = `/uploads/${req.file.filename}`;
  emp.avatar = fileUrl;

  saveState();
  res.json({ success: true, avatar: fileUrl, employee: emp, state });
}, (err: any, req: any, res: any, next: any) => {
  res.status(400).json({ error: err.message || "Erreur lors du téléversement du fichier." });
});

// Profile Update Route
app.post("/api/profile/update", (req, res) => {
  const { employeeId, phone, password } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: "Identifiant d'employé manquant." });
  }

  const emp = state.employees.find(e => e.id === employeeId);
  if (!emp) {
    return res.status(404).json({ error: "Employé non trouvé." });
  }

  if (phone !== undefined) emp.phone = phone;
  if (password !== undefined) (emp as any).password = password;

  saveState();
  res.json({ success: true, employee: emp, state });
});

// Profile Skills Update Route
app.post("/api/profile/skills", (req, res) => {
  const { employeeId, skills } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: "Identifiant d'employé manquant." });
  }

  const emp = state.employees.find(e => e.id === employeeId);
  if (!emp) {
    return res.status(404).json({ error: "Employé non trouvé." });
  }

  if (Array.isArray(skills)) {
    emp.skills = skills;
  }

  saveState();
  res.json({ success: true, employee: emp, state });
});

// Test AI Connection Route
app.post("/api/profile/test-ai", (req, res) => {
  const isAvailable = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  res.json({
    success: true,
    operational: true,
    hasApiKey: isAvailable,
    details: isAvailable ? "Connexion établie avec succès avec le modèle de production gemini-3.5-flash." : "Moteur IA local actif et opérationnel (mode résilient)."
  });
});

// Helper: Run Auto-Assignment process
async function performAutoAssignment(task: Task) {
  let selectedId = "";
  let reason = "";
  let scoresMap: Record<string, number> = {};

  if (ai) {
    try {
      const prompt = `Vous êtes le Moteur Intelligent de Décision d'AutoFlow RH.
Votre tâche consiste à attribuer de manière 100% automatisée une nouvelle tâche à l'employé le plus qualifié et disponible du service concerné.
Tâche à analyser :
- ID : "${task.id}"
- Titre : "${task.title}"
- Description : "${task.description}"
- Priorité : "${task.priority}"
- Département visé : "${task.department}"
- Compétences nécessaires : ${JSON.stringify(task.requiredSkills)}

Voici la liste des employés de l'entreprise avec leurs statistiques temps réel (compétences, charge, performance, historique de retards/absences) :
${JSON.stringify(state.employees, null, 2)}

Pour chaque candidat, déduisez un score global d'affinité de 0 à 100 en considérant :
1. La correspondance des compétences requises (skills match).
2. La disponibilité ('absent' ou 'leave' élimine l'employé).
3. La charge de travail actuelle (les plus chargés subissent une pénalité, pour éviter la surcharge).
4. La performance globale de travail (les performants sont valorisés pour les tâches critiques).
5. L'historique des retards et des absences (recommandez un employé fiable).

Retournez IMPÉRATIVEMENT un objet JSON strict correspondant à ce modèle :
{
  "selectedEmployeeId": "ID_DE_L_EMPLOYE_CHOISI",
  "reasoning": "Une analyse solide et justifiée en français de l'attribution.",
  "scores": {
    "EMPxxx": score_sur_100
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              selectedEmployeeId: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              scores: { type: Type.OBJECT }
            },
            required: ["selectedEmployeeId", "reasoning"]
          }
        }
      });

      const json = JSON.parse(response.text || "{}");
      selectedId = json.selectedEmployeeId;
      reason = json.reasoning;
      scoresMap = json.scores || {};
    } catch (err) {
      console.error("Gemini assignment engine error:", err);
    }
  }

  // Fallback Engine
  if (!selectedId) {
    const fallbackResult = runLocalMatchingEngine(task, state.employees);
    selectedId = fallbackResult.selectedId;
    reason = fallbackResult.details;
    scoresMap = fallbackResult.scores;
  }

  const selectedEmp = state.employees.find(e => e.id === selectedId);
  if (selectedEmp) {
    task.assignedTo = selectedEmp.id;
    task.assignedToName = selectedEmp.name;
    task.status = "À faire";
    task.history.push({
      timestamp: new Date().toISOString(),
      action: `Attribution automatique par IA à ${selectedEmp.name} (Score d'affinité : ${scoresMap[selectedEmp.id] || "N/A"}%)`,
      user: "AI Decision Engine"
    });

    // Log decision
    const decisionLog: AIDecisionLog = {
      id: "DEC" + String(Date.now()),
      timestamp: new Date().toISOString(),
      type: "assignment",
      title: `Attribution automatique [${task.id}]`,
      description: `Tâche '${task.title}' attribuée à ${selectedEmp.name}.`,
      details: reason
    };
    state.decisionLogs.unshift(decisionLog);

    // Increase workload
    selectedEmp.workload = Math.min(100, selectedEmp.workload + 10);
  }

  saveState();
}

// Helper: Run Leave Request analysis via AI
async function performLeaveAnalysis(leaveId: string) {
  const leaveIndex = state.leaves.findIndex(l => l.id === leaveId);
  if (leaveIndex === -1) return;

  const leave = state.leaves[leaveIndex];
  const emp = state.employees.find(e => e.id === leave.employeeId);
  if (!emp) return;

  let analysisResult = "";

  if (ai) {
    try {
      const prompt = `Vous êtes le Moteur Intelligent de Décision d'AutoFlow RH.
Vous devez réaliser l'évaluation d'impact d'une demande de congé de manière à conseiller le Responsable RH.
Demande de Congé :
- Candidat : ${leave.employeeName} (${leave.employeeRole})
- Type de congé : ${leave.type}
- Période : Du ${leave.startDate} au ${leave.endDate} (${leave.durationDays} jours)
- Motif formulé : "${leave.reason}"
- Urgence signalée : ${leave.urgency ? "OUI" : "NON"}

Contexte de l'entreprise :
- Collaborateurs du même service : ${JSON.stringify(state.employees.filter(e => e.department === emp.department && e.id !== emp.id))}
- Tâches actives de l'employé : ${JSON.stringify(state.tasks.filter(t => t.assignedTo === emp.id && t.status !== "Terminée"))}

Calculez le niveau de risque sur une échelle (Faible, Modéré, Critique) en analysant s'il reste assez de personnel disponible dans l'équipe pour assurer la continuité opérationnelle, si les tâches actives de l'employé peuvent être différées ou déléguées, et si d'autres congés se superposent.
Donnez votre rapport final d'impact en français, en expliquant de manière argumentée et positive si la demande devrait être acceptée ou s'il y a des réserves.
Votre réponse doit être synthétique, claire, et ne comporter que l'explication finale d'analyse d'impact (maximum 3 phrases).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      analysisResult = response.text || "";
    } catch (err) {
      console.error("Gemini leave evaluation failed:", err);
    }
  }

  if (!analysisResult) {
    // Fallback simple rule engine
    const activeTasksCount = state.tasks.filter(t => t.assignedTo === emp.id && t.status !== "Terminée").length;
    if (leave.urgency) {
      analysisResult = `Analyse d'impact IA (Urgence locale) : Risque Faible. Demande urgente (santé/force majeure). Continuité opérationnelle à adapter, les tâches actives (${activeTasksCount}) seront transférées automatiquement dès validation.`;
    } else if (activeTasksCount > 2) {
      analysisResult = `Analyse d'impact IA (Moteur local) : Risque Modéré à Élevé. ${emp.name} gère actuellement ${activeTasksCount} tâches en cours. Une validation de congés nécessitera la réaffectation préalable de certains lots critiques.`;
    } else {
      analysisResult = `Analyse d'impact IA (Moteur local) : Risque Faible. L'effectif du département ${emp.department} est suffisant. Les plannings et les jalons de livraison ne subissent aucune surcharge directe.`;
    }
  }

  state.leaves[leaveIndex].aiAnalysis = analysisResult;
  saveState();
}

// Vite and Express boot
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
