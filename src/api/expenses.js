const API_BASE = import.meta.env.VITE_API_BASE;

export async function listExpenses({ start, end } = {}) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const res = await fetch(`${API_BASE}/expenses?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Expenses list failed (${res.status})`);
  return res.json();
}

export async function dailyTotals(start, end) {
  const params = new URLSearchParams({ start, end });
  const res = await fetch(`${API_BASE}/expenses/daily?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Daily totals failed (${res.status})`);
  return res.json();
}

export async function summary(group_by = "month", start, end) {
  const params = new URLSearchParams({ group_by });
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const res = await fetch(`${API_BASE}/expenses/summary?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Summary failed (${res.status})`);
  return res.json();
}

export async function createExpense(expenseData) {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(expenseData),
  });
  if (!res.ok) throw new Error(`Failed to create expense (${res.status})`);
  return res.json();
}

export async function updateExpense(expenseId, expenseData) {
  const res = await fetch(`${API_BASE}/expenses/${expenseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(expenseData),
  });
  if (!res.ok) throw new Error(`Failed to update expense (${res.status})`);
  return res.json();
}
