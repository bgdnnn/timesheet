const API_BASE = import.meta.env.VITE_API_BASE;

export async function uploadReceipts({ entry_date, time_entry_id, files }) {
  const fd = new FormData();
  fd.append("entry_date", entry_date);
  if (time_entry_id) fd.append("time_entry_id", time_entry_id);
  for (const f of files) fd.append("files", f);
  const res = await fetch(`${API_BASE}/receipts/upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) throw new Error(`Receipts upload failed (${res.status})`);
  return res.json();
}

export async function listReceipts(params = {}) {
  const sp = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/receipts?${sp}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Receipts list failed (${res.status})`);
  return res.json();
}

export async function receiptFileUrl(id) {
  const res = await fetch(`${API_BASE}/receipts/${id}/file`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`File fetch failed (${res.status})`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function deleteReceipt(id) {
  const res = await fetch(`${API_BASE}/receipts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  return true;
}

export async function listAllReceipts() {
  const res = await fetch(`${API_BASE}/receipts/all`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to list all receipts (${res.status})`);
  return res.json();
}
