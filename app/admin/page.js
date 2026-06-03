'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'quotations', 'requests'
  
  // Loading states
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingQuotations, setLoadingQuotations] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  
  // Data states
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // Search / Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDimension, setFilterDimension] = useState('');
  
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
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Expanded quotation details
  const [expandedQuotationId, setExpandedQuotationId] = useState(null);

  // Fetch functions
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const url = `/api/products?search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(filterCategory)}&dimension=${encodeURIComponent(filterDimension)}`;
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

  const fetchRequests = async () => {
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

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, filterCategory, filterDimension]);

  useEffect(() => {
    if (activeTab === 'quotations') {
      fetchQuotations();
    } else if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  // Handle Dimension change to set correct default base unit
  useEffect(() => {
    if (!editingProduct) {
      if (formDimension === 'WEIGHT') setFormBaseUnit('kg');
      else if (formDimension === 'VOLUME') setFormBaseUnit('L');
      else if (formDimension === 'COUNT') setFormBaseUnit('items');
    }
  }, [formDimension]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

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
      // If we are restocking a product requested, let's refresh requests too
      if (activeTab === 'requests') {
        fetchRequests();
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product? This action is permanent.')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  // Convert Product Request to new product prefill
  const handlePrefillFromRequest = (request) => {
    setEditingProduct(null);
    setFormSku(`SKU-${request.productName.toUpperCase().replace(/\s+/g, '-')}`);
    setFormName(request.productName);
    setFormDescription(request.notes || '');
    setFormCategory('');
    setFormDimension(request.dimension);
    setFormBaseUnit(request.requestedUnit);
    setFormBasePrice('');
    setFormStockQuantity(request.requestedQuantity ? request.requestedQuantity.toString() : '0');
    setFormError('');
    setActiveTab('inventory');
    setShowProductModal(true);
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

  // Detailed mathematical conversion breakdown for Admin Verification
  const renderVerificationDetails = (item) => {
    const orderQty = Number(item.orderQuantity);
    const orderUnit = item.orderUnit;
    const internalQty = Number(item.internalQuantity);
    const basePrice = Number(item.product.basePrice);
    const baseUnit = item.product.baseUnit;
    const calculatedPrice = Number(item.calculatedPrice);

    // Factors relative to internal base unit (g, mL, items)
    const orderFactor = orderUnit === 'kg' || orderUnit === 'L' ? 1000 : 1;
    const baseFactor = baseUnit === 'kg' || baseUnit === 'L' ? 1000 : 1;

    const baseInternalUnit = item.product.dimension === 'WEIGHT' ? 'g' : item.product.dimension === 'VOLUME' ? 'mL' : 'items';

    return (
      <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-800 text-xs font-mono text-neutral-300 space-y-2.5">
        <div className="flex items-center text-emerald-400 font-bold border-b border-neutral-800 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
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
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-sans">
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 py-4 px-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-500 bg-clip-text text-transparent">
              AasaMedChem Admin
            </h1>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold mt-0.5">Control Center</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-neutral-300">Administrator</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <span>Sign Out</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-r border-neutral-800 bg-neutral-950/40 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'inventory'
                ? 'bg-neutral-800/70 text-emerald-400 border border-neutral-700 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Inventory Levels</span>
          </button>
          
          <button
            onClick={() => setActiveTab('quotations')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'quotations'
                ? 'bg-neutral-800/70 text-emerald-400 border border-neutral-700 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Quotation Orders</span>
            {quotations.filter(q => q.status === 'PENDING').length > 0 && (
              <span className="ml-auto bg-amber-500 text-neutral-950 font-extrabold text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                {quotations.filter(q => q.status === 'PENDING').length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'requests'
                ? 'bg-neutral-800/70 text-emerald-400 border border-neutral-700 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Product Requests</span>
            {requests.filter(r => r.status === 'PENDING').length > 0 && (
              <span className="ml-auto bg-indigo-500 text-white font-extrabold text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                {requests.filter(r => r.status === 'PENDING').length}
              </span>
            )}
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 space-y-6">
          
          {/* TAB 1: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Chemicals & Products Inventory</h2>
                  <p className="text-xs text-neutral-400 mt-1">Configure base units, base rates, SKU tracking, and update stocks.</p>
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
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Search by name, SKU, description..."
                    className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-4 py-2 text-xs text-neutral-200 outline-none placeholder-neutral-500 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2 text-xs text-neutral-300 outline-none transition-colors"
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
                  <input
                    type="text"
                    placeholder="Filter Category"
                    className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-4 py-2 text-xs text-neutral-200 outline-none placeholder-neutral-500 transition-colors"
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
                  <p className="text-neutral-400 text-sm">No products found. Click "Add Product" to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-neutral-900/30 border border-neutral-850 rounded-2xl shadow-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                        <th className="px-6 py-4">SKU / Category</th>
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4">Dimension</th>
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
                            <td className="px-6 py-4 font-semibold text-neutral-300">
                              {product.dimension}
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
            </div>
          )}

          {/* TAB 2: QUOTATIONS */}
          {activeTab === 'quotations' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-2xl font-extrabold tracking-tight">Quotation Orders</h2>
                <p className="text-xs text-neutral-400 mt-1">Review incoming quotation requests, verify unit conversions, and manage order fulfillment.</p>
              </div>

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
                              Client: <span className="text-neutral-100 font-bold">{quote.user.name}</span> ({quote.user.email})
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
                                    <th className="px-4 py-3">Product details</th>
                                    <th className="px-4 py-3">Ordered Qty & Unit</th>
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
          )}

          {/* TAB 3: PRODUCT REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-2xl font-extrabold tracking-tight">Client Product Requests</h2>
                <p className="text-xs text-neutral-400 mt-1">Review requests sent by sellers/users for chemical catalog expansions or out-of-stock restocks.</p>
              </div>

              {loadingRequests ? (
                <div className="flex justify-center items-center py-20">
                  <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
                  <p className="text-neutral-400 text-sm">No product requests submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-neutral-900/30 border border-neutral-850 rounded-2xl shadow-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                        <th className="px-6 py-4">Request Date</th>
                        <th className="px-6 py-4">Requested By</th>
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4">Dimension / Unit</th>
                        <th className="px-6 py-4">Quantity Requested</th>
                        <th className="px-6 py-4">Notes</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80 text-xs">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="px-6 py-4 text-neutral-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-neutral-200">{req.user.name}</p>
                            <span className="text-[10px] text-neutral-400 block">{req.user.email}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-neutral-100">
                            {req.productName}
                          </td>
                          <td className="px-6 py-4 font-semibold text-neutral-300">
                            {req.dimension} / <span className="text-neutral-400 font-normal">{req.requestedUnit}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-neutral-200">
                            {req.requestedQuantity ? Number(req.requestedQuantity).toFixed(2) : '-'}
                          </td>
                          <td className="px-6 py-4 text-neutral-400 max-w-xs truncate">
                            {req.notes || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[9px] font-extrabold border ${
                              req.status === 'PENDING'
                                ? 'bg-amber-950/20 border-amber-800/60 text-amber-300'
                                : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                            }`}>
                              {req.status === 'PENDING' ? 'PENDING' : 'ADDED / RESTOCKED'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {req.status === 'PENDING' && (
                              <button
                                onClick={() => handlePrefillFromRequest(req)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors"
                              >
                                Add / Restock
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

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
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-300 outline-none"
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
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-300 outline-none"
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
                  <span className="text-[9px] text-neutral-500 block mt-1">per selected base unit</span>
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
                  <span className="text-[9px] text-neutral-500 block mt-1">in selected base unit</span>
                </div>
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
