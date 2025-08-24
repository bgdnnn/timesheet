// src/api/entities.js
import { client } from "./timesheetClient.js";

export const Project   = client.entities.Project;
export const TimeEntry = client.entities.TimeEntry;
export const Hotel     = client.entities.Hotel;
export const Receipts  = client.entities.Receipts;   // <-- ADDED
export const Payslips  = client.Payslips;
export const WeeklyEarnings = client.WeeklyEarnings;

// auth facade
export const User = client.auth;
