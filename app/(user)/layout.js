'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function UserLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Browse Chemicals', path: '/products' },
    { name: 'Order History', path: '/orders/history' },
    { name: 'My Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-sans">
      {/* Shared User Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 py-4 px-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-8">
          <Link href="/products" className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-500 bg-clip-text text-transparent">
                AasaMedChem
              </h1>
              <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold mt-0.5">Procurement Portal</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 text-xs">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-neutral-850/80 text-emerald-400 border border-neutral-800'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          
          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) {
                  handleMarkNotificationsRead();
                }
              }}
              className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-emerald-500 text-neutral-950 font-black text-[8px] w-4.5 h-4.5 flex items-center justify-center rounded-full border border-neutral-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/45">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300">Notifications</h4>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkNotificationsRead}
                      className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-850 text-xs">
                  {notifications.length === 0 ? (
                    <p className="text-center py-8 text-neutral-500">No alerts or notifications.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 transition-colors hover:bg-neutral-850/30 ${!n.isRead ? 'bg-emerald-950/10' : ''}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-neutral-200">{n.title}</span>
                          <span className="text-[9px] text-neutral-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-neutral-400 mt-1 leading-normal text-[11px]">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <span>Sign Out</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
