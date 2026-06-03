import prisma from '../../../lib/db';
import Link from 'next/link';

// Helper to format currency
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Direct Server Database Queries
  const userCount = await prisma.user.count({ where: { role: 'USER' } });
  const sellerCount = await prisma.user.count({ where: { role: 'SELLER' } });
  const productCount = await prisma.product.count();
  const orderCount = await prisma.quotation.count();
  const pendingRequestsCount = await prisma.productRequest.count({ where: { status: 'PENDING' } });
  const pendingOrdersCount = await prisma.quotation.count({ where: { status: 'PENDING' } });

  // Get recent quotations
  const recentQuotations = await prisma.quotation.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  // Get recent requests
  const recentRequests = await prisma.productRequest.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
    },
  });

  const stats = [
    { name: 'Total Customers', value: userCount, icon: '👥', color: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { name: 'Total Sellers', value: sellerCount, icon: '💼', color: 'from-indigo-500/10 to-blue-500/5', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    { name: 'Total Products', value: productCount, icon: '🧪', color: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-500/20', text: 'text-violet-400' },
    { name: 'Total Quotations', value: orderCount, icon: '📄', color: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/20', text: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">System Overview</h2>
        <p className="text-xs text-neutral-400 mt-1">Real-time indicators of user registrations, product listings, and incoming quotation requests.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className={`bg-gradient-to-br ${stat.color} border ${stat.border} p-6 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] duration-200`}>
            <div className="flex justify-between items-center">
              <span className="text-2xl">{stat.icon}</span>
              {stat.name === 'Total Quotations' && pendingOrdersCount > 0 && (
                <span className="bg-amber-500 text-neutral-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  {pendingOrdersCount} Pending
                </span>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-neutral-400">{stat.name}</h3>
              <p className={`text-3xl font-black mt-1 ${stat.text}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Monitor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Quotation Orders */}
        <div className="bg-neutral-900/30 border border-neutral-850 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-neutral-300">Recent Quotations</h3>
            <Link href="/admin/orders" className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              Manage Orders &rarr;
            </Link>
          </div>

          {recentQuotations.length === 0 ? (
            <p className="text-center py-10 text-neutral-500 text-xs">No orders placed yet.</p>
          ) : (
            <div className="divide-y divide-neutral-850 text-xs">
              {recentQuotations.map((quote) => (
                <div key={quote.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                  <div>
                    <p className="font-bold text-neutral-200">
                      ID: <span className="font-mono text-neutral-400">{quote.id.substring(0, 8)}</span>
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      By: {quote.user.name} ({quote.user.email})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{formatCurrency(quote.totalAmount)}</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase mt-1 border ${
                      quote.status === 'PENDING' ? 'bg-amber-950/20 border-amber-800/60 text-amber-300' :
                      quote.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300' :
                      quote.status === 'REJECTED' ? 'bg-rose-950/20 border-rose-800/60 text-rose-300' :
                      'bg-indigo-950/20 border-indigo-800/60 text-indigo-300'
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Product Requests */}
        <div className="bg-neutral-900/30 border border-neutral-850 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-neutral-300">Catalog Requests</h3>
            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950 border border-indigo-800 px-2.5 py-0.5 rounded-full">
              {pendingRequestsCount} Pending
            </span>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-center py-10 text-neutral-500 text-xs">No catalog requests submitted.</p>
          ) : (
            <div className="divide-y divide-neutral-850 text-xs">
              {recentRequests.map((req) => (
                <div key={req.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                  <div>
                    <p className="font-bold text-neutral-200">{req.productName}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Requested by: {req.user.name} ({req.dimension} - {req.requestedUnit})
                    </p>
                  </div>
                  <div>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                      req.status === 'PENDING'
                        ? 'bg-amber-950/20 border-amber-800/60 text-amber-300'
                        : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
