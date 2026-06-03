'use client';

import { useState, useEffect } from 'react';

export default function AdminOrdersPage() {
  const [loadingQuotations, setLoadingQuotations] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [expandedQuotationId, setExpandedQuotationId] = useState(null);

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

  const handleUpdateQuotationStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update quotation');
      } else {
        fetchQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const renderVerificationDetails = (item) => {
    const orderQty = Number(item.orderQuantity);
    const orderUnit = item.orderUnit;
    const internalQty = Number(item.internalQuantity);
    const basePrice = Number(item.product.basePrice);
    const baseUnit = item.product.baseUnit;
    const calculatedPrice = Number(item.calculatedPrice);

    const orderFactor = orderUnit === 'kg' || orderUnit === 'L' ? 1000 : 1;
    const baseFactor = baseUnit === 'kg' || baseUnit === 'L' ? 1000 : 1;

    const baseInternalUnit = item.product.dimension === 'WEIGHT' ? 'g' : item.product.dimension === 'VOLUME' ? 'mL' : 'items';

    return (
      <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-800 text-xs font-mono text-neutral-300 space-y-2.5">
        <div className="flex items-center text-emerald-400 font-bold border-b border-neutral-850 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Verification Audit Trail
        </div>
        <div>
          <span className="text-neutral-500">1. Unit Conversion (Order Unit to Internal base Unit):</span><br />
          &nbsp;&nbsp;Ordered: {orderQty} {orderUnit} <br />
          &nbsp;&nbsp;Conversion Factor: 1 {orderUnit} = {orderFactor} {baseInternalUnit}<br />
          &nbsp;&nbsp;Internal Stored Value: {orderQty} * {orderFactor} = <span className="text-white font-bold">{internalQty} {baseInternalUnit}</span>
        </div>
        <div>
          <span className="text-neutral-500">2. Pricing Unit Conversion (Base Config to Internal base Unit):</span><br />
          &nbsp;&nbsp;Configured Rate: {formatCurrency(basePrice)} / {baseUnit}<br />
          &nbsp;&nbsp;Conversion Factor: 1 {baseUnit} = {baseFactor} {baseInternalUnit}<br />
          &nbsp;&nbsp;Rate per internal unit: {formatCurrency(basePrice)} / {baseFactor} = <span className="text-white font-bold">{formatCurrency(basePrice / baseFactor)} / {baseInternalUnit}</span>
        </div>
        <div className="border-t border-neutral-800 pt-2 text-[11px] flex justify-between items-center text-emerald-300 font-semibold bg-emerald-950/20 px-2 py-1 rounded">
          <span>3. Total Price Calculation:</span>
          <span>
            {internalQty} {baseInternalUnit} * {formatCurrency(basePrice / baseFactor)}/{baseInternalUnit} = 
            <span className="text-emerald-400 font-bold ml-1">{formatCurrency(calculatedPrice)}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Orders & Quotations</h2>
        <p className="text-xs text-neutral-400 mt-1">Review quotation requests from customers, audit calculation conversions, and manage order approval status.</p>
      </div>

      {/* Quotations List */}
      {loadingQuotations ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
          <p className="text-neutral-400 text-sm">No quotations found in the system.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((quote) => {
            const isExpanded = expandedQuotationId === quote.id;
            const isPending = quote.status === 'PENDING';
            
            return (
              <div key={quote.id} className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 hover:border-neutral-700/80">
                {/* Summary Header */}
                <div 
                  onClick={() => setExpandedQuotationId(isExpanded ? null : quote.id)}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-neutral-900/20 select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-[10px] font-bold bg-neutral-950 px-2 py-0.5 border border-neutral-800 rounded">
                        ID: {quote.id.substring(0, 8)}
                      </span>
                      <span className="text-xs text-neutral-400 font-semibold">
                        {new Date(quote.createdAt).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-neutral-300">
                      Customer: <span className="text-neutral-100 font-bold">{quote.user.name}</span> ({quote.user.email})
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total Amount</p>
                      <p className="text-lg font-black text-emerald-400">{formatCurrency(quote.totalAmount)}</p>
                    </div>
                    
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase border ${
                      quote.status === 'PENDING' ? 'bg-amber-950/20 border-amber-800/60 text-amber-300' :
                      quote.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300' :
                      quote.status === 'REJECTED' ? 'bg-rose-950/20 border-rose-800/60 text-rose-300' :
                      'bg-indigo-950/20 border-indigo-800/60 text-indigo-300'
                    }`}>
                      {quote.status}
                    </span>
                    
                    <svg className={`w-5 h-5 text-neutral-500 transition-transform duration-250 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-5 border-t border-neutral-850 bg-neutral-950/30 space-y-5 animate-slideDown">
                    <div className="overflow-x-auto border border-neutral-850 rounded-xl bg-neutral-900/20">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-neutral-850 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/50">
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3">Seller / Owner</th>
                            <th className="px-4 py-3">Ordered Qty</th>
                            <th className="px-4 py-3">Config Rate</th>
                            <th className="px-4 py-3">Subtotal</th>
                            <th className="px-4 py-3">Internal Equivalent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850/60 text-xs">
                          {quote.items.map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-900/10">
                              <td className="px-4 py-3">
                                <p className="font-bold text-neutral-200">{item.product.name}</p>
                                <span className="font-mono text-[9px] bg-neutral-950 border border-neutral-800 text-neutral-400 px-1 py-0.5 rounded">
                                  {item.product.sku}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-neutral-300">{item.product.seller.name}</p>
                                <p className="text-[10px] text-neutral-400">{item.product.seller.email}</p>
                              </td>
                              <td className="px-4 py-3 font-semibold text-neutral-300">
                                {Number(item.orderQuantity).toFixed(4)} {item.orderUnit}
                              </td>
                              <td className="px-4 py-3 font-semibold text-neutral-400">
                                {formatCurrency(item.product.basePrice)} / {item.product.baseUnit}
                              </td>
                              <td className="px-4 py-3 font-bold text-emerald-400">
                                {formatCurrency(item.calculatedPrice)}
                              </td>
                              <td className="px-4 py-3 text-neutral-300 font-mono">
                                {Number(item.internalQuantity).toFixed(2)} {
                                  item.product.dimension === 'WEIGHT' ? 'g' :
                                  item.product.dimension === 'VOLUME' ? 'mL' : 'items'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Verification Block */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Audit Conversion Verification Formulas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quote.items.map((item) => (
                          <div key={item.id} className="space-y-1">
                            <p className="text-[10px] text-neutral-400 font-bold">{item.product.name} Calculation Math:</p>
                            {renderVerificationDetails(item)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Row */}
                    {isPending && (
                      <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-850">
                        <button
                          onClick={() => handleUpdateQuotationStatus(quote.id, 'REJECTED')}
                          className="bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                        >
                          Reject Quotation
                        </button>
                        <button
                          onClick={() => handleUpdateQuotationStatus(quote.id, 'APPROVED')}
                          className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 text-xs transition-all duration-200"
                        >
                          Approve & Deduct Stock
                        </button>
                      </div>
                    )}

                    {!isPending && quote.status === 'APPROVED' && (
                      <div className="flex justify-end pt-3 border-t border-neutral-850">
                        <button
                          onClick={() => handleUpdateQuotationStatus(quote.id, 'COMPLETED')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-indigo-600/10 transition-all duration-200"
                        >
                          Mark Order Completed
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
