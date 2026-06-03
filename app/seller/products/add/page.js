'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerAddProductPage(props) {
  const searchParams = use(props.searchParams);
  const router = useRouter();
  
  const productId = searchParams.id;
  const prefillStr = searchParams.prefill;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDimension, setFormDimension] = useState('WEIGHT');
  const [formBaseUnit, setFormBaseUnit] = useState('kg');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formStockQuantity, setFormStockQuantity] = useState('');

  // Handle prefill and edit product load
  useEffect(() => {
    const loadProductData = async () => {
      if (productId) {
        setLoading(true);
        try {
          const res = await fetch(`/api/products`);
          if (res.ok) {
            const data = await res.json();
            const product = data.find(p => p.id === productId);
            if (product) {
              setFormSku(product.sku);
              setFormName(product.name);
              setFormDescription(product.description || '');
              setFormCategory(product.category || '');
              setFormDimension(product.dimension);
              setFormBaseUnit(product.baseUnit);
              setFormBasePrice(product.basePrice.toString());
              
              // Converted quantity display in base unit
              const factor = product.baseUnit === 'kg' || product.baseUnit === 'L' ? 1000 : 1;
              const baseQty = Number(product.stockQuantity) / factor;
              setFormStockQuantity(baseQty.toString());
            } else {
              setError('Product not found or not owned by you');
            }
          }
        } catch (err) {
          console.error(err);
          setError('Failed to load product data');
        } finally {
          setLoading(false);
        }
      } else if (prefillStr) {
        try {
          let prefill;
          try {
            prefill = JSON.parse(prefillStr);
          } catch {
            prefill = JSON.parse(decodeURIComponent(prefillStr));
          }
          setFormName(prefill.name || '');
          setFormDimension(prefill.dimension || 'WEIGHT');
          setFormBaseUnit(prefill.unit || 'kg');
          setFormSku(`SKU-${(prefill.name || '').toUpperCase().replace(/\s+/g, '-')}`);
          if (prefill.qty) {
            setFormStockQuantity(prefill.qty.toString());
          }
        } catch (err) {
          console.error('Failed to parse prefill parameter:', err);
        }
      }
    };
    loadProductData();
  }, [productId, prefillStr]);

  // Handle Dimension change to set correct default base unit
  useEffect(() => {
    if (!productId) {
      if (formDimension === 'WEIGHT') setFormBaseUnit('kg');
      else if (formDimension === 'VOLUME') setFormBaseUnit('L');
      else if (formDimension === 'COUNT') setFormBaseUnit('items');
    }
  }, [formDimension, productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      sku: formSku,
      name: formName,
      description: formDescription,
      category: formCategory,
      dimension: formDimension,
      baseUnit: formBaseUnit,
      basePrice: parseFloat(formBasePrice),
      stockQuantity: parseFloat(formStockQuantity), // Stored as initialStock on POST, stockQuantity on PUT
      initialStock: parseFloat(formStockQuantity),
    };

    try {
      const url = productId ? `/api/products/${productId}` : '/api/products';
      const method = productId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      router.push('/seller/products');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {productId ? 'Edit Chemical Product' : 'Add Chemical Product'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">Configure SKU, description, unit conversion dimensions, pricing, and initial stock.</p>
        </div>
        <Link 
          href="/seller/products" 
          className="text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-800 px-3.5 py-1.5 rounded-xl bg-neutral-950 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-2xl text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-neutral-900/30 border border-neutral-850 p-6 rounded-3xl space-y-6 shadow-xl text-xs text-neutral-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">SKU Code</label>
              <input
                type="text"
                required
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-emerald-500/80 rounded-xl px-4 py-3 text-neutral-200 outline-none placeholder-neutral-700 transition-colors"
                placeholder="e.g. ASP-RAW-09"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Chemical / Product Name</label>
              <input
                type="text"
                required
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-emerald-500/80 rounded-xl px-4 py-3 text-neutral-200 outline-none placeholder-neutral-700 transition-colors"
                placeholder="e.g. Acetylsalicylic Acid"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              className="w-full bg-neutral-950 border border-neutral-850 focus:border-emerald-500/80 rounded-xl px-4 py-3 text-neutral-200 outline-none h-24 resize-none placeholder-neutral-700 transition-colors"
              placeholder="purity levels, physical properties, or packaging notes..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Category</label>
              <input
                type="text"
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-emerald-500/80 rounded-xl px-4 py-3 text-neutral-200 outline-none placeholder-neutral-700 transition-colors"
                placeholder="e.g. Analgesics, Reagents"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Conversion Dimension</label>
              <select
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-emerald-500/80 rounded-xl px-3 py-3 text-neutral-300 outline-none transition-colors"
                value={formDimension}
                onChange={(e) => setFormDimension(e.target.value)}
                disabled={!!productId}
              >
                <option value="WEIGHT">Weight</option>
                <option value="VOLUME">Volume</option>
                <option value="COUNT">Count</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Base Unit</label>
              <select
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-emerald-500/80 rounded-xl px-3 py-3 text-neutral-300 outline-none transition-colors"
                value={formBaseUnit}
                onChange={(e) => setFormBaseUnit(e.target.value)}
              >
                {formDimension === 'WEIGHT' && (
                  <>
                    <option value="kg">kilograms (kg)</option>
                    <option value="g">grams (g)</option>
                  </>
                )}
                {formDimension === 'VOLUME' && (
                  <>
                    <option value="L">liters (L)</option>
                    <option value="mL">milliliters (mL)</option>
                  </>
                )}
                {formDimension === 'COUNT' && (
                  <option value="items">items</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Base Price (INR)</label>
              <input
                type="number"
                step="any"
                required
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-emerald-500/80 rounded-xl px-4 py-3 text-neutral-200 outline-none placeholder-neutral-700 transition-colors"
                placeholder="Price"
                value={formBasePrice}
                onChange={(e) => setFormBasePrice(e.target.value)}
              />
              <span className="text-[9px] text-neutral-500 block mt-1">per selected base unit</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Stock Level</label>
              <input
                type="number"
                step="any"
                required
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-emerald-500/80 rounded-xl px-4 py-3 text-neutral-200 outline-none placeholder-neutral-700 transition-colors"
                placeholder="Qty"
                value={formStockQuantity}
                onChange={(e) => setFormStockQuantity(e.target.value)}
              />
              <span className="text-[9px] text-neutral-500 block mt-1">in selected base unit</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-800">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-neutral-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <span>Save Product</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
