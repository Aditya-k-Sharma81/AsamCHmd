'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// Simple unit configs duplicated for client calculations
const DIMENSIONS = {
  WEIGHT: 'WEIGHT',
  VOLUME: 'VOLUME',
  COUNT: 'COUNT',
};

export default function AdminProductsPage() {
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSellers, setLoadingSellers] = useState(true);
  
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  
  // Search / Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDimension, setFilterDimension] = useState('');
  const [filterSeller, setFilterSeller] = useState('');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Product Form states
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDimension, setFormDimension] = useState('WEIGHT');
  const [formBaseUnit, setFormBaseUnit] = useState('kg');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formStockQuantity, setFormStockQuantity] = useState('');
  const [formSellerId, setFormSellerId] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch functions
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const url = `/api/products?search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(filterCategory)}&dimension=${encodeURIComponent(filterDimension)}&sellerId=${encodeURIComponent(filterSeller)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      const res = await fetch('/api/admin/sellers');
      if (res.ok) {
        const data = await res.json();
        setSellers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSellers(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, filterCategory, filterDimension, filterSeller]);

  useEffect(() => {
    fetchSellers();
  }, []);

  // Handle Dimension change to set correct default base unit
  useEffect(() => {
    if (!editingProduct) {
      if (formDimension === 'WEIGHT') setFormBaseUnit('kg');
      else if (formDimension === 'VOLUME') setFormBaseUnit('L');
      else if (formDimension === 'COUNT') setFormBaseUnit('items');
    }
  }, [formDimension]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormSku('');
    setFormName('');
    setFormDescription('');
    setFormCategory('');
    setFormDimension('WEIGHT');
    setFormBaseUnit('kg');
    setFormBasePrice('');
    setFormStockQuantity('');
    setFormSellerId(sellers[0]?.id || '');
    setFormError('');
    setShowProductModal(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setFormSku(product.sku);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormCategory(product.category || '');
    setFormDimension(product.dimension);
    setFormBaseUnit(product.baseUnit);
    setFormBasePrice(product.basePrice.toString());
    setFormSellerId(product.sellerId);
    
    // Converted quantity display in base unit
    const factor = product.baseUnit === 'kg' || product.baseUnit === 'L' ? 1000 : 1;
    const baseQty = Number(product.stockQuantity) / factor;
    setFormStockQuantity(baseQty.toString());
    
    setFormError('');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const payload = {
      sku: formSku,
      name: formName,
      description: formDescription,
      category: formCategory,
      dimension: formDimension,
      baseUnit: formBaseUnit,
      basePrice: parseFloat(formBasePrice),
      stockQuantity: parseFloat(formStockQuantity),
      targetSellerId: formSellerId,
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this product? This action is permanent.',
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
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchProducts();
          Swal.fire({
            title: 'Deleted!',
            text: 'The product has been deleted.',
            icon: 'success',
            background: '#171717',
            color: '#f5f5f5',
            confirmButtonColor: '#10b981',
          });
        } else {
          const data = await res.json();
          Swal.fire({
            title: 'Error',
            text: data.error || 'Failed to delete product',
            icon: 'error',
            background: '#171717',
            color: '#f5f5f5',
            confirmButtonColor: '#10b981',
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Unit display helpers
  const getDisplayStock = (product) => {
    const stock = Number(product.stockQuantity);
    
    if (product.dimension === 'WEIGHT') {
      const kgVal = stock / 1000;
      return `${kgVal.toFixed(4)} kg (${stock.toFixed(2)} g)`;
    }
    
    if (product.dimension === 'VOLUME') {
      const lVal = stock / 1000;
      return `${lVal.toFixed(4)} L (${stock.toFixed(2)} mL)`;
    }
    
    return `${stock.toFixed(0)} items`;
  };

  // Helper to format currency
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Manage Inventory Products</h2>
          <p className="text-xs text-neutral-400 mt-1">Add, update, or remove chemical stock and pricing metrics across all sellers.</p>
        </div>
        <button
          onClick={openAddProductModal}
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 text-xs transition-all duration-200"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-neutral-900/40 p-4 border border-neutral-850 rounded-2xl">
        <div>
          <input
            type="text"
            placeholder="Search name, SKU, desc..."
            className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-4 py-2.5 text-xs text-neutral-200 outline-none placeholder-neutral-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-xs text-neutral-300 outline-none transition-colors"
            value={filterDimension}
            onChange={(e) => setFilterDimension(e.target.value)}
          >
            <option value="">All Dimensions</option>
            <option value="WEIGHT">Weight</option>
            <option value="VOLUME">Volume</option>
            <option value="COUNT">Count</option>
          </select>
        </div>
        <div>
          <select
            className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-xs text-neutral-300 outline-none transition-colors"
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
          >
            <option value="">All Sellers</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
        </div>
        <div>
          <input
            type="text"
            placeholder="Filter Category"
            className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-4 py-2.5 text-xs text-neutral-200 outline-none placeholder-neutral-500 transition-colors"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      {loadingProducts ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
          <p className="text-neutral-400 text-sm">No products found. Click "Add Product" to add the first catalog item.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-neutral-900/30 border border-neutral-850 rounded-2xl shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                <th className="px-6 py-4">SKU / Category</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Seller / Owner</th>
                <th className="px-6 py-4">Base Rate (INR)</th>
                <th className="px-6 py-4">Stock Available</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-xs">
              {products.map((product) => {
                const isOutOfStock = Number(product.stockQuantity) <= 0;
                return (
                  <tr key={product.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-neutral-300 font-bold bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded">
                        {product.sku}
                      </span>
                      {product.category && (
                        <span className="block text-[10px] text-neutral-400 font-semibold uppercase mt-1 tracking-wider">
                          {product.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-neutral-100">{product.name}</p>
                      {product.description && (
                        <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1 max-w-xs">{product.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-neutral-200">{product.seller.name}</p>
                      <p className="text-[10px] text-neutral-400">{product.seller.email}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {formatCurrency(product.basePrice)} / <span className="text-neutral-400 font-semibold">{product.baseUnit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOutOfStock 
                            ? 'bg-rose-950/40 border border-rose-800/40 text-rose-300' 
                            : 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOutOfStock ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                          {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                        </span>
                        <p className="font-mono text-neutral-200 font-semibold">
                          {getDisplayStock(product)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditProductModal(product)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD/EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-extrabold text-lg text-neutral-100">
                {editingProduct ? 'Edit Product Configuration' : 'Add New Chemical Product'}
              </h3>
              <button 
                onClick={() => setShowProductModal(false)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">SKU ID</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-200 outline-none"
                    placeholder="e.g. NaCl-005"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Product Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-200 outline-none"
                    placeholder="e.g. Sodium Chloride"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2 text-neutral-200 outline-none h-16 resize-none"
                  placeholder="Chemical purity levels, properties, etc."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Category</label>
                  <input
                    type="text"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-200 outline-none"
                    placeholder="e.g. Salts, Reagents"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Dimension</label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-350 outline-none"
                    value={formDimension}
                    onChange={(e) => setFormDimension(e.target.value)}
                    disabled={!!editingProduct}
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
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-350 outline-none"
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
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-200 outline-none"
                    placeholder="Rate in INR"
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Stock Level</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-200 outline-none"
                    placeholder="Stock Qty"
                    value={formStockQuantity}
                    onChange={(e) => setFormStockQuantity(e.target.value)}
                  />
                </div>
              </div>

              {/* Seller Select Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Seller / Owner</label>
                <select
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-350 outline-none"
                  value={formSellerId}
                  onChange={(e) => setFormSellerId(e.target.value)}
                >
                  <option value="" disabled>Select Seller</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-2"
                >
                  {formLoading ? (
                    <svg className="animate-spin h-4.5 w-4.5 text-neutral-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <span>Save Product</span>
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
