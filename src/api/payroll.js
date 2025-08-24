const API_BASE = import.meta.env.VITE_API_BASE;

export async function calcPayroll({
  gross,
  period = "weekly",
  region,
  pension_employee_percent,
  use_profile = true,
}) {
  const body = { gross, period, use_profile };
  if (region) body.region = region;
  if (pension_employee_percent != null)
    body.pension_employee_percent = pension_employee_percent;
  const res = await fetch(`${API_BASE}/payroll/calc`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Payroll calc failed (${res.status})`);
  return res.json();
}
