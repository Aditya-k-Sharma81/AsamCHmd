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
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch('/api/quotations');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            // Placeholder logic
          }
        }
        // Fetch from profile details endpoint
        const profileRes = await fetch('/api/auth/me');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfileName(profileData.name);
          setProfileEmail(profileData.email);
          setProfilePhone(profileData.phone || 'Not provided');
          setProfileAddress(profileData.address || 'Not provided');
          setEditName(profileData.name);
          setEditPhone(profileData.phone || '');
          setEditAddress(profileData.address || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, phone: editPhone, address: editAddress }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      setProfileName(data.name);
      setProfilePhone(data.phone || 'Not provided');
      setProfileAddress(data.address || 'Not provided');
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

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
              <span className="text-neutral-500 font-semibold">Phone:</span>
              <span className="font-bold text-neutral-100">{profilePhone}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-neutral-500 font-semibold">Delivery Address:</span>
              <span className="font-medium text-neutral-200 bg-neutral-950/40 p-2 border border-neutral-850 rounded-lg">{profileAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 font-semibold">Product Requests:</span>
              <span className="font-bold text-neutral-100">{requests.length} Requests</span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              Edit Contact Details
            </button>
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
                          req.status === 'PENDING_ADMIN' ? 'bg-amber-950/20 border-amber-800/60 text-amber-300' :
                          req.status === 'APPROVED_BY_ADMIN' ? 'bg-indigo-950/20 border-indigo-800/60 text-indigo-300' :
                          'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                        }`}>
                          {req.status === 'PENDING_ADMIN' && 'PENDING ADMIN'}
                          {req.status === 'APPROVED_BY_ADMIN' && 'PASSED TO SELLERS'}
                          {req.status === 'ADDED' && 'ADDED / RESTOCKED'}
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

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-neutral-100">
                Edit Contact Details
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/50 text-rose-300 rounded-xl text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-200 outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-200 outline-none"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Delivery Address</label>
                <textarea
                  placeholder="e.g. 123 Science Lab Lane, Mumbai"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2 text-neutral-200 outline-none h-20 resize-none"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-2"
                >
                  {editLoading ? (
                    <svg className="animate-spin h-4 w-4 text-neutral-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <circle className="opacity-75" fill="currentColor" cx="12" cy="12" r="10" />
                    </svg>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
