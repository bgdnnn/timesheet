import React, { useEffect, useState } from "react";
import { client } from "@/api/timesheetClient";

export default function Earnings() {
  const [ytd, setYtd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await client.fetchJson("/earnings/ytd");
        setYtd(data);
      } catch (error) {
        console.error("Error fetching YTD earnings:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!ytd || ytd.gross_pay == 0) {
    return <div>No data available. Please upload a payslip first.</div>;
  }

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Year-to-Date Earnings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/10 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Gross Pay</h2>
          <p className="text-2xl">£{ytd.gross_pay}</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">PAYE Tax</h2>
          <p className="text-2xl">£{ytd.paye_tax}</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">National Insurance</h2>
          <p className="text-2xl">£{ytd.national_insurance}</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Pension</h2>
          <p className="text-2xl">£{ytd.pension}</p>
        </div>
      </div>
    </div>
  );
}
