// src/api/entities.js
import { client } from "./timesheetClient.js";
import { uploadPayslip, manualEntry, getPayslipForWeek } from "../api/payslips.js"; // New import

export const Project   = client.entities.Project;
export const TimeEntry = client.entities.TimeEntry;
export const Hotel     = client.entities.Hotel;
export const Receipts  = client.entities.Receipts;
export const Trainings = client.entities.Trainings;
export const Payslips  = {
  uploadPayslip,
  manualEntry,
  forWeek: getPayslipForWeek,
};
export const Earnings = {
    recalculate: () => client.earnings.recalculate(),
    calculateWeek: (weekStart) => client.earnings.calculateWeek({ week_start: weekStart }),
    forWeek: (weekStart) => client.earnings.forWeek(weekStart),
    updateWeekWage: (weekStart, wage) => client.earnings.updateWeekWage({ week_start: weekStart, hourly_wage: wage }),
};

// auth facade
export const User = client.auth;
