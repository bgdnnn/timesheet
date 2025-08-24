import React, { useEffect, useState } from "react";
import { listExpenses, summary } from "@/api/expenses";
import { format } from "date-fns";

function Money({ value }) {
  if (value == null) return <span className="text-gray-400">—</span>;
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return <span>£{num.toFixed(2)}</span>;
}

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [sumWeek, setSumWeek] = useState(null);
  const [sumMonth, setSumMonth] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await listExpenses();
      const monthly = await summary("month");
      if (!alive) return;
      setItems(rows);
      const thisMonthKey = format(new Date(), "yyyy-MM");
      const monthRow = monthly.find((r) => r.bucket === thisMonthKey);
      setSumMonth(monthRow?.total ?? null);
      const weekly = await summary("week");
      const yearWeek = format(new Date(), "RRRR-ww");
      const weekRow = weekly.find((r) => r.bucket === yearWeek);
      setSumWeek(weekRow?.total ?? null);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Expenses</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-white/20 bg-white/5 p-4"><div className="text-sm text-gray-300">This week</div><div className="text-xl font-semibold"><Money value={sumWeek} /></div></div>
        <div className="rounded-xl border border-white/20 bg-white/5 p-4"><div className="text-sm text-gray-300">This month</div><div className="text-xl font-semibold"><Money value={sumMonth} /></div></div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/20">
        <table className="min-w-full text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Vendor</th>
              <th className="text-right px-4 py-2">Total</th>
              <th className="text-left px-4 py-2">Currency</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t border-white/10">
                <td className="px-4 py-2">{format(new Date(e.entry_date), "PPP")}</td>
                <td className="px-4 py-2">{e.vendor_name || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-2 text-right"><Money value={e.total_amount} /></td>
                <td className="px-4 py-2">{e.currency || "GBP"}</td>
                <td className="px-4 py-2">{e.status}</td>
              </tr>
            ))}
            {items.length === 0 && (<tr><td className="px-4 py-4 text-gray-300" colSpan={5}>No expenses yet.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
