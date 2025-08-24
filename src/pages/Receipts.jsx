import React, { useEffect, useState } from "react";
import { listReceipts, receiptFileUrl } from "@/api/receipts";
import { format } from "date-fns";

export default function Receipts() {
  const [items, setItems] = useState([]);
  const [blobs, setBlobs] = useState({}); // { [id]: objectUrl }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await listReceipts();
        if (!alive) return;
        setItems(rows);

        // Prefetch first 8 thumbnails (optional)
        const first = rows.slice(0, 8);
        const obj = {};
        for (const r of first) {
          try {
            obj[r.id] = await receiptFileUrl(r.id);
          } catch (e) {
            console.error("prefetch error", e);
          }
        }
        if (alive) setBlobs(obj);
      } catch (e) {
        console.error("Failed to load receipts", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Receipts</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/20 bg-white/5 p-2">
            <div className="text-xs text-gray-300 mb-2">
              {format(new Date(r.entry_date), "PPP")}
            </div>
            <img
              alt={r.original_filename || `receipt-${r.id}`}
              className="w-full h-40 object-cover rounded"
              src={blobs[r.id]}
              onMouseEnter={async () => {
                if (!blobs[r.id]) {
                  try {
                    const url = await receiptFileUrl(r.id);
                    setBlobs((b) => ({ ...b, [r.id]: url }));
                  } catch (e) {
                    console.error("hover fetch error", e);
                  }
                }
              }}
            />
            <div className="text-xs mt-2 truncate">
              {r.original_filename || "(image)"}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-gray-300">No receipts yet.</div>
        )}
      </div>
    </div>
  );
}
