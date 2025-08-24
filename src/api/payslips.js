const API_BASE = import.meta.env.VITE_API_BASE;

async function warmUpSession() {
  try {
    await fetch(`${API_BASE}/me`, { credentials: "include" });
  } catch {}
}

export async function uploadPayslip({ week_start, file }) {
  const fd = new FormData();
  fd.append("week_start", week_start);
  fd.append("file", file);

  let res = await fetch(`${API_BASE}/payslips/upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  if (res.status === 401) {
    await warmUpSession();
    res = await fetch(`${API_BASE}/payslips/upload`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
  }

  if (!res.ok) throw new Error(`Payslip upload failed (${res.status})`);
  return res.json();
}

export async function getPayslipForWeek(week_start) {
  let res = await fetch(
    `${API_BASE}/payslips/for-week?week_start=${week_start}`,
    {
      credentials: "include",
    }
  );

  if (res.status === 401) {
    await warmUpSession();
    res = await fetch(
      `${API_BASE}/payslips/for-week?week_start=${week_start}`,
      {
        credentials: "include",
      }
    );
  }

  if (!res.ok) throw new Error(`Payslip fetch failed (${res.status})`);
  return res.json(); // may be null
}
