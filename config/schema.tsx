import { integer, json, pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer(),
  isPremium: boolean().default(false),
  premiumExpiresAt: varchar(),
  isAdmin: boolean().default(false),
  monthlyConsultations: integer().default(0),
  consultationsResetDate: varchar(),
});

export const SessionChatTable=pgTable('sessionChatTable',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar().notNull(),
  notes:text(),
  selectedDoctor:json(),
  conversation:json(),
  report:json(),
  uploadedReports:json(), // Stores uploaded lab reports with AI analysis, risk levels
  createdBy:varchar().references(()=>usersTable.email),
  createdOn:varchar(),
})

export const PaymentTable = pgTable('paymentTable', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  transactionId: varchar({ length: 255 }).notNull().unique(),
  userEmail: varchar().notNull().references(() => usersTable.email),
  amount: varchar().notNull(),
  status: varchar().default('pending'), // pending, approved, rejected
  createdAt: varchar().notNull(),
  approvedAt: varchar(),
  approvedBy: varchar(),
  rejectionReason: text(),
})

export const EmergencyQueueTable = pgTable('emergency_queue', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  patientId: varchar().notNull().unique(),
  patientName: varchar().notNull(),
  age: integer(),
  symptoms: json().notNull(),
  emergencyDescription: text(),
  priority: integer().notNull(), // 1: Critical, 2: Serious, 3: Normal
  aiAnalysis: json(), // Stores AI triage result with reason and severity score
  aiReason: text(), // AI analysis explanation
  imageUrl: varchar(), // URL to uploaded patient image
  arrivalTime: varchar().notNull(),
  serveStartTime: varchar(), // When the patient started being served
  status: varchar().notNull().default('pending_approval'), // pending_approval, waiting, serving, completed
  assignedDoctor: varchar(),
  createdBy: varchar().references(() => usersTable.email),
  approvedBy: varchar(), // Receptionist who approved
  approvedAt: varchar(),
  completedAt: varchar(),
  updatedAt: varchar(),
})