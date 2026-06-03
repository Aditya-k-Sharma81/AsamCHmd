'use client';

import { useState, useEffect } from 'react';

export default function UserOrdersHistoryPage() {
  const [loadingQuotations, setLoadingQuotations] = useState(true);
  const [quotations, setQuotations] = useState([]);

  const fetchQuotations = async () => {
    setLoadingQuotations(true);
    try {
      const res = await fetch('/api/quotations');
      if (res.ok) {
        const data = await res.json();
        setQuotations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuotations(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">My Quotation History</h2>
        <p className="text-xs text-neutral-400 mt-1">Review previously submitted quotations, pricing structures, and approval status.</p>
      </div>

      {loadingQuotations ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
          <p className="text-neutral-400 text-sm">You haven't submitted any quotations yet. Go to Browse Catalog to place one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map(quote => (
            <div key={quote.id} className="bg-neutral-900/30 border border-neutral-800/80 p-5 rounded-2xl space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-800 pb-3">
                <div>
                  <span className="font-mono text-[9px] bg-neutral-950 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                    ID: {quote.id.substring(0, 8)}
                  </span>
                  <span className="text-neutral-500 font-semibold text-[10px] ml-2">
                    {new Date(quote.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-neutral-400">Total: {formatCurrency(quote.totalAmount)}</span>
                  <span className={`px-2 py-1 rounded text-[9px] font-extrabold border uppercase tracking-wider ${
                    quote.status === 'PENDING' ? 'bg-amber-950/20 border-amber-800/60 text-amber-300' :
                    quote.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300' :
                    quote.status === 'SHIPPED' ? 'bg-blue-950/20 border-blue-800/60 text-blue-300' :
                    quote.status === 'DELIVERED' ? 'bg-indigo-950/20 border-indigo-800/60 text-indigo-300' :
                    quote.status === 'COMPLETED' ? 'bg-neutral-800 border-neutral-700 text-neutral-300' :
                    'bg-rose-950/20 border-rose-800/60 text-rose-300'
                  }`}>
                    {quote.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 pb-3 border-b border-neutral-850/50">
                {quote.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs text-neutral-200">
                    <div>
                      <p className="font-bold text-neutral-100">{item.product.name}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {Number(item.orderQuantity).toFixed(2)} {item.orderUnit} @ {formatCurrency(item.product.basePrice)} / {item.product.baseUnit}
                      </p>
                      <span className="text-[9px] text-neutral-500">Seller: {item.product.seller?.name || 'Chemical Seller'}</span>
                    </div>
                    <span className="font-bold text-emerald-400">{formatCurrency(item.calculatedPrice)}</span>
                  </div>
                ))}
              </div>

              {/* Visual Tracker */}
              {quote.status !== 'REJECTED' && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-3">
                    <span>Order Tracking Status</span>
                    <span className="text-emerald-400">
                      {quote.status === 'PENDING' && 'Pending Seller Confirmation'}
                      {quote.status === 'APPROVED' && 'Order Approved & Processing'}
                      {quote.status === 'SHIPPED' && 'In Transit / Shipped'}
                      {quote.status === 'DELIVERED' && 'Delivered'}
                      {quote.status === 'COMPLETED' && 'Delivered & Completed'}
                    </span>
                  </div>
                  <div className="relative flex items-center justify-between w-full mt-2 mb-4 px-2">
                    {/* Background Progress Bar Line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-neutral-800 -translate-y-1/2 top-1/2 z-0" />
                    
                    {/* Active Progress Bar Line */}
                    <div 
                      className="absolute left-0 h-0.5 bg-emerald-500 -translate-y-1/2 top-1/2 z-0 transition-all duration-500"
                      style={{
                        width: 
                          quote.status === 'PENDING' ? '0%' :
                          quote.status === 'APPROVED' ? '33.33%' :
                          quote.status === 'SHIPPED' ? '66.66%' :
                          '100%'
                      }}
                    />

                    {/* Step dots */}
                    {[
                      { label: 'Placed', active: true },
                      { label: 'Approved', active: quote.status !== 'PENDING' },
                      { label: 'Shipped', active: quote.status === 'SHIPPED' || quote.status === 'DELIVERED' || quote.status === 'COMPLETED' },
                      { label: 'Delivered', active: quote.status === 'DELIVERED' || quote.status === 'COMPLETED' }
                    ].map((step, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          step.active 
                            ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/20' 
                            : 'bg-neutral-900 border-neutral-700'
                        }`}>
                          {step.active && (
                            <svg className="w-1.5 h-1.5 text-neutral-950" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[9px] mt-1 font-bold ${step.active ? 'text-neutral-200' : 'text-neutral-500'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
