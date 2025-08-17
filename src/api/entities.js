// src/api/entities.js
import { client } from "./timesheetClient";

export const Project = client.entities.Project;
export const TimeEntry = client.entities.TimeEntry;
export const Hotel = client.entities.Hotel;

// auth facade:
export const User = client.auth;
