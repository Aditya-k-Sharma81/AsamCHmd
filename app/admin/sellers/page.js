'use client';

import { useState, useEffect } from 'react';

export default function AdminSellersPage() {
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    const fetchSellers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/sellers');
        if (res.ok) {
          const data = await res.json();
          setSellers(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Sellers Management</h2>
        <p className="text-xs text-neutral-400 mt-1">Monitor registered Sellers and catalog count contributions.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
          <p className="text-neutral-400 text-sm">No sellers registered in the system yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-neutral-900/30 border border-neutral-850 rounded-2xl shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                <th className="px-6 py-4">Seller Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Registered Date</th>
                <th className="px-6 py-4">Products Listed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-xs text-neutral-200">
              {sellers.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-neutral-100">{s.name}</td>
                  <td className="px-6 py-4 font-mono">{s.email}</td>
                  <td className="px-6 py-4 text-neutral-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{s._count.products}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
