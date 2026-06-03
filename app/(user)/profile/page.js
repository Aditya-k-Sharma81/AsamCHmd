'use client';

import { useState, useEffect } from 'react';

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // We fetch user details from route or simple inline data from session
  // Since we don't have a separate /api/users/profile, we can fetch all requests
  // and load profile details from a request body or write a simple profile fetch
  // Actually, we can get profile details from our requests since they include user
  // Or we can query requests and get user info. Let's do a simple call or load.
  
  useEffect(() => {
    const fetchRequestsAndProfile = async () => {
      setLoadingRequests(true);
      try {
        const res = await fetch('/api/requests');
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequestsAndProfile();
  }, []);

  // Simple load mock profile from session (via a request to check user details or read from cookies,
  // wait we can hit `/api/quotations` which also includes user details, or write a simple profile api.
  // Let's write a quick profile api or load it from a local storage/session cookie parser on the backend.
  // Wait, let's write a simple route `/api/auth/me` or just load it dynamically from quotations.
  // Actually, to make it extremely clean, let's make a quick `/api/auth/me` API endpoint!
  // It takes 5 lines of code and is extremely robust!)
  
  const [profileName, setProfileName] = useState('Chemical Buyer');
  const [profileEmail, setProfileEmail] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch('/api/quotations');
        if (res.ok) {
          const data = await res.json();
          // Extract user info from first quotation if available
          if (data.length > 0) {
            // Wait, user info is not included in user-side quotations list by default?
            // Actually, in route.js, user relation is NOT included for user, but we can get it or write `/api/auth/me`!
            // Let's write a small API at `/api/auth/me` to get the logged-in user profile details!
            // This is super clean and works perfectly. Let's write it in a moment.
          }
        }
        // Fetch from profile details endpoint
        const profileRes = await fetch('/api/auth/me');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfileName(profileData.name);
          setProfileEmail(profileData.email);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">My Profile</h2>
        <p className="text-xs text-neutral-400 mt-1">Manage your account details and track catalog expansion requests.</p>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900/30 border border-neutral-850 p-6 rounded-3xl space-y-4 shadow-xl md:col-span-1">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center text-emerald-400 text-3xl font-bold mb-4 shadow-inner">
              {profileName.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-extrabold text-neutral-100 text-lg">{profileName}</h3>
            <p className="text-xs text-neutral-400 font-mono mt-1">{profileEmail}</p>
            <span className="mt-4 px-3 py-1 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-bold rounded-full text-[10px] uppercase tracking-wider">
              Procurement Officer
            </span>
          </div>

          <div className="border-t border-neutral-800 pt-4 text-xs space-y-2.5 text-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-500 font-semibold">Account Type:</span>
              <span className="font-bold text-neutral-100">Customer / User</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 font-semibold">Product Requests:</span>
              <span className="font-bold text-neutral-100">{requests.length} Requests</span>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-neutral-900/30 border border-neutral-850 p-6 rounded-3xl shadow-xl md:col-span-2 space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-neutral-300 border-b border-neutral-800 pb-3">
            My Product Requests
          </h3>

          {loadingRequests ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center py-10 text-neutral-500 text-xs">You haven't requested any custom chemical items yet.</p>
          ) : (
            <div className="overflow-x-auto border border-neutral-850 rounded-2xl bg-neutral-950/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-850 text-[9px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                    <th className="px-4 py-3">Request Date</th>
                    <th className="px-4 py-3">Chemical Name</th>
                    <th className="px-4 py-3">Preferred Unit</th>
                    <th className="px-4 py-3">Target Qty</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850/60 text-xs text-neutral-200">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-neutral-900/10">
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-neutral-100">
                        {req.productName}
                      </td>
                      <td className="px-4 py-3 text-neutral-400 font-mono">
                        {req.requestedUnit}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {req.requestedQuantity ? Number(req.requestedQuantity).toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-extrabold border ${
                          req.status === 'PENDING'
                            ? 'bg-amber-950/20 border-amber-800/60 text-amber-300'
                            : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                        }`}>
                          {req.status === 'PENDING' ? 'PENDING' : 'ADDED / RESTOCKED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
