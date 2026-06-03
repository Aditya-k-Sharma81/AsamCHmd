'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function AdminRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApproveRequest = async (id) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED_BY_ADMIN' }),
      });

      if (res.ok) {
        fetchRequests();
        Swal.fire({
          title: 'Approved!',
          text: 'Request has been passed to sellers.',
          icon: 'success',
          background: '#171717',
          color: '#f5f5f5',
          confirmButtonColor: '#10b981',
        });
      } else {
        const data = await res.json();
        Swal.fire({
          title: 'Error',
          text: data.error || 'Failed to approve request',
          icon: 'error',
          background: '#171717',
          color: '#f5f5f5',
          confirmButtonColor: '#10b981',
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'Error updating request status',
        icon: 'error',
        background: '#171717',
        color: '#f5f5f5',
        confirmButtonColor: '#10b981',
      });
    }
  };

  const handleDeleteRequest = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Request?',
      text: 'Are you sure you want to delete this request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      background: '#171717',
      color: '#f5f5f5',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/requests/${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          fetchRequests();
          Swal.fire({
            title: 'Deleted!',
            text: 'Request has been deleted.',
            icon: 'success',
            background: '#171717',
            color: '#f5f5f5',
            confirmButtonColor: '#10b981',
          });
        } else {
          const data = await res.json();
          Swal.fire({
            title: 'Error',
            text: data.error || 'Failed to delete request',
            icon: 'error',
            background: '#171717',
            color: '#f5f5f5',
            confirmButtonColor: '#10b981',
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: 'Error deleting request',
          icon: 'error',
          background: '#171717',
          color: '#f5f5f5',
          confirmButtonColor: '#10b981',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Catalog Demand & Requests</h2>
        <p className="text-xs text-neutral-400 mt-1">Review chemical product catalog requests submitted by customers, and approve them to pass to sellers.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
          <p className="text-neutral-400 text-sm">No catalog requests submitted by users yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-neutral-900/30 border border-neutral-850 rounded-2xl shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Chemical Name</th>
                <th className="px-6 py-4">Type / Dimension</th>
                <th className="px-6 py-4">Requested Qty & Unit</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-xs text-neutral-200">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-neutral-100">{req.user.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{req.user.email}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{req.productName}</td>
                  <td className="px-6 py-4 text-neutral-300 font-semibold">{req.dimension}</td>
                  <td className="px-6 py-4 text-neutral-300 font-medium">
                    {req.requestedQuantity ? Number(req.requestedQuantity) : 'Any'} {req.requestedUnit}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-neutral-400" title={req.notes}>
                    {req.notes || '-'}
                  </td>
                  <td className="px-6 py-4 text-neutral-400">
                    {new Date(req.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-[9px] font-extrabold uppercase border ${
                      req.status === 'PENDING_ADMIN' ? 'bg-amber-950/20 border-amber-800/60 text-amber-300' :
                      req.status === 'APPROVED_BY_ADMIN' ? 'bg-indigo-950/20 border-indigo-800/60 text-indigo-300' :
                      'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                    }`}>
                      {req.status === 'PENDING_ADMIN' && 'Pending Review'}
                      {req.status === 'APPROVED_BY_ADMIN' && 'Passed to Sellers'}
                      {req.status === 'ADDED' && 'Resolved'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {req.status === 'PENDING_ADMIN' && (
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] transition-colors"
                      >
                        Pass to Sellers
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      className="bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 px-3 py-1.5 rounded-xl text-[10px] transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
