// src/components/ImportData.jsx
import React from "react";
import { Upload } from "lucide-react";
import { Project, Hotel, TimeEntry } from "@/api/entities";

// Small helper: read file as JSON
async function readJSON(file) {
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON in ${file.name}`);
  }
}

// Decide which array a JSON belongs to (projects/hotels/timeEntries)
function bucketData(json, filename = "") {
  const name = filename.toLowerCase();
  const out = { projects: [], hotels: [], timeEntries: [] };

  if (Array.isArray(json) && name.includes("project")) out.projects = json;
  else if (Array.isArray(json) && name.includes("hotel")) out.hotels = json;
  else if (Array.isArray(json) && (name.includes("timeentry") || name.includes("time-entry") || name.includes("entries"))) out.timeEntries = json;
  else if (!Array.isArray(json) && json && (json.projects || json.hotels || json.timeEntries)) {
    out.projects = json.projects || [];
    out.hotels = json.hotels || [];
    out.timeEntries = json.timeEntries || [];
  } else if (Array.isArray(json) && json[0]) {
    const keys = Object.keys(json[0]);
    if (keys.includes("project_name") || keys.includes("hours_worked")) out.timeEntries = json;
    else if (keys.includes("address") || keys.includes("hotel_name")) out.hotels = json;
    else if (keys.includes("client") || keys.includes("default_hours_worked")) out.projects = json;
  }

  return out;
}

async function upsertProjects(importProjects) {
  const current = await Project.filter({}, "-created_date");
  const byName = new Map(current.map(p => [p.name.trim().toLowerCase(), p]));
  for (const p of importProjects) {
    const name = (p.project_name || p.name || "").trim();
    if (!name) continue;
    const body = {
      name,
      client: (p.client || "").trim(),
      contract: (p.contract || "").trim(),
      default_hours_worked: Number(p.default_hours_worked || 0),
      default_travel_time: Number(p.default_travel_time || 0),
    };
    const found = byName.get(name.toLowerCase());
    if (found) {
      await Project.update(found.id, body);
    } else {
      const created = await Project.create(body);
      byName.set(name.toLowerCase(), created);
    }
  }
  const refreshed = await Project.filter({}, "-created_date");
  return new Map(refreshed.map(p => [p.name, p.id]));
}

async function upsertHotels(importHotels) {
  const current = await Hotel.filter({}, "name");
  const byName = new Map(current.map(h => [h.name.trim().toLowerCase(), h]));
  for (const h of importHotels) {
    const name = (h.hotel_name || h.name || "").trim();
    if (!name) continue;
    const body = { name, address: (h.address || "").trim() };
    const found = byName.get(name.toLowerCase());
    if (found) {
      await Hotel.update(found.id, body);
    } else {
      const created = await Hotel.create(body);
      byName.set(name.toLowerCase(), created);
    }
  }
  const refreshed = await Hotel.filter({}, "name");
  return new Map(refreshed.map(h => [h.name, h.id]));
}

function getDateRange(entries) {
  const ds = entries.map(e => e.date).filter(Boolean);
  if (!ds.length) return [null, null];
  return [ds.reduce((a,b)=>a<b?a:b), ds.reduce((a,b)=>a>b?a:b)];
}

export default function ImportData({ className = "" }) {
  const inputRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);

  async function importTimeEntries(importEntries, projectMap, hotelMap) {
    if (!importEntries.length) return 0;
    const [from, to] = getDateRange(importEntries);
    const existing = (from && to) ? await TimeEntry.filter({ from, to }) : [];
    const seen = new Set(existing.map(e => `${e.date}|${e.project_id}|${e.hours_worked}|${e.travel_time}|${e.hotel_id||0}`));

    let created = 0;
    for (const e of importEntries) {
      const date = e.date;
      const pname = (e.project_name || "").trim();
      const hname = (e.hotel_name || "").trim();
      const hours = Number(e.hours_worked || 0);
      const travel = Number(e.travel_time || 0);
      if (!date || !pname) continue;

      let pid = projectMap.get(pname);
      if (!pid) {
        const createdProj = await Project.create({ name: pname, client: "", contract: "", default_hours_worked: 0, default_travel_time: 0 });
        pid = createdProj.id;
        projectMap.set(pname, pid);
      }
      const hid = hname ? (hotelMap.get(hname) || null) : null;

      const key = `${date}|${pid}|${hours}|${travel}|${hid||0}`;
      if (seen.has(key)) continue;

      await TimeEntry.create({
        date,
        project_id: pid,
        project_name: pname,
        hours_worked: hours,
        travel_time: travel,
        hotel_id: hid,
        hotel_name: hname || null,
        notes: e.notes || null,
      });
      seen.add(key);
      created++;
    }
    return created;
  }

  async function onFilesChosen(ev) {
    const files = Array.from(ev.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      let projects = [], hotels = [], timeEntries = [];
      for (const f of files) {
        const json = await readJSON(f);
        const b = bucketData(json, f.name);
        projects = projects.concat(b.projects);
        hotels = hotels.concat(b.hotels);
        timeEntries = timeEntries.concat(b.timeEntries);
      }
      const projectMap = await upsertProjects(projects);
      const hotelMap = await upsertHotels(hotels);
      const created = await importTimeEntries(timeEntries, projectMap, hotelMap);
      alert(`Import complete:\n• Projects processed: ${projects.length}\n• Hotels processed: ${hotels.length}\n• Time entries created: ${created}`);
    } catch (err) {
      console.error(err);
      alert(`Import failed: ${err.message || err}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <button
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${busy ? 'opacity-60 cursor-not-allowed' : 'text-gray-300 hover:bg-white/10'} transition-all duration-200 ${className}`}
        onClick={() => !busy && inputRef.current?.click()}
        disabled={busy}
        title="Import projects/hotels/time entries (.json)"
      >
        <Upload className="h-5 w-5" />
        <span>{busy ? "Importing…" : "Import Data"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        multiple
        onChange={onFilesChosen}
        className="hidden"
      />
    </>
  );
}
