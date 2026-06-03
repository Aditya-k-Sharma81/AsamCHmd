import { cookies } from 'next/headers';
import prisma from '../../../lib/db';
import { getSession } from '../../../lib/auth';
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

export default async function SellerDashboardPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    return (
      <div className="text-center py-20 text-neutral-400">
        <p>Session not found. Please log in.</p>
      </div>
    );
  }

  // Seller specific database queries
  const productCount = await prisma.product.count({
    where: { sellerId: session.userId },
  });

  // Fetch quotations containing this seller's products
  const sellerQuotations = await prisma.quotation.findMany({
    where: {
      items: {
        some: {
          product: {
            sellerId: session.userId,
          },
        },
      },
    },
    include: {
      items: {
        where: {
          product: {
            sellerId: session.userId,
          },
        },
        include: { product: true },
      },
    },
  });

  // Calculate stats
  const totalOrdersCount = sellerQuotations.length;
  const pendingOrdersCount = sellerQuotations.filter(q => q.status === 'PENDING').length;
  const approvedOrdersCount = sellerQuotations.filter(q => q.status === 'APPROVED' || q.status === 'COMPLETED').length;
  
  // Calculate total revenue for this seller's products
  let totalRevenue = 0;
  sellerQuotations.forEach(q => {
    if (q.status === 'APPROVED' || q.status === 'COMPLETED') {
      q.items.forEach(item => {
        totalRevenue += Number(item.calculatedPrice);
      });
    }
  });

  // Get catalog requests
  const recentRequests = await prisma.productRequest.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
    },
  });

  const stats = [
    { name: 'My Products Listed', value: productCount, icon: '🧪', color: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { name: 'Revenue Earned (INR)', value: formatCurrency(totalRevenue), icon: '💰', color: 'from-indigo-500/10 to-blue-500/5', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    { name: 'Total Quotations', value: totalOrdersCount, icon: '📄', color: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-500/20', text: 'text-violet-400' },
    { name: 'Pending Approvals', value: pendingOrdersCount, icon: '⏳', color: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/20', text: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Seller Dashboard</h2>
        <p className="text-xs text-neutral-400 mt-1">Review your chemical product sales metrics, listing status, and pending approvals.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className={`bg-gradient-to-br ${stat.color} border ${stat.border} p-6 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] duration-200`}>
            <div className="flex justify-between items-center">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-neutral-400">{stat.name}</h3>
              <p className={`text-2xl font-black mt-1 ${stat.text}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Monitor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Quotation Orders */}
        <div className="bg-neutral-900/30 border border-neutral-850 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-neutral-300">Quotations Involving My Products</h3>
            <Link href="/seller/orders" className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              View All &rarr;
            </Link>
          </div>

          {sellerQuotations.length === 0 ? (
            <p className="text-center py-10 text-neutral-500 text-xs">No customer orders have included your products yet.</p>
          ) : (
            <div className="divide-y divide-neutral-850 text-xs">
              {sellerQuotations.slice(0, 5).map((quote) => {
                let sellerTotal = 0;
                quote.items.forEach(item => {
                  sellerTotal += Number(item.calculatedPrice);
                });

                return (
                  <div key={quote.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <p className="font-bold text-neutral-200">
                        ID: <span className="font-mono text-neutral-400">{quote.id.substring(0, 8)}</span>
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Client: {quote.user.name} ({quote.items.length} items)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{formatCurrency(sellerTotal)}</p>
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
                );
              })}
            </div>
          )}
        </div>

        {/* Global Catalog Requests */}
        <div className="bg-neutral-900/30 border border-neutral-850 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-neutral-300">Requested Chemicals (Catalog Demand)</h3>
            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950 border border-indigo-800 px-2.5 py-0.5 rounded-full">
              User Requests
            </span>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-center py-10 text-neutral-500 text-xs">No catalog requests submitted by users.</p>
          ) : (
            <div className="divide-y divide-neutral-850 text-xs">
              {recentRequests.map((req) => (
                <div key={req.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                  <div>
                    <p className="font-bold text-neutral-200">{req.productName}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Requested: {req.requestedQuantity ? Number(req.requestedQuantity) : ''} {req.requestedUnit} ({req.dimension})
                    </p>
                  </div>
                  <div>
                    {req.status === 'PENDING' ? (
                      <Link 
                        href={`/seller/products/add?prefill=${encodeURIComponent(JSON.stringify({ name: req.productName, dimension: req.dimension, unit: req.requestedUnit, qty: req.requestedQuantity }))}`}
                        className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-2.5 py-1 rounded text-[10px] transition-colors"
                      >
                        Add Product
                      </Link>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border bg-emerald-950/20 border-emerald-800/60 text-emerald-300">
                        RESOLVED
                      </span>
                    )}
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
