'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Simple unit config duplicated for client side live calculations
const DIMENSIONS = {
  WEIGHT: 'WEIGHT',
  VOLUME: 'VOLUME',
  COUNT: 'COUNT',
};

const UNITS = {
  g: { symbol: 'g', dimension: DIMENSIONS.WEIGHT, factor: 1 },
  kg: { symbol: 'kg', dimension: DIMENSIONS.WEIGHT, factor: 1000 },
  mL: { symbol: 'mL', dimension: DIMENSIONS.VOLUME, factor: 1 },
  L: { symbol: 'L', dimension: DIMENSIONS.VOLUME, factor: 1000 },
  items: { symbol: 'items', dimension: DIMENSIONS.COUNT, factor: 1 },
};

export default function UserDashboard() {
  const router = useRouter();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'quotations', 'requests'
  
  // Data states
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Loading states
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingQuotations, setLoadingQuotations] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDimension, setFilterDimension] = useState('');
  
  // Cart state
  const [cart, setCart] = useState([]);
  
  // Order Drawer / Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('1');
  const [orderUnit, setOrderUnit] = useState('g');
  
  // Request Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqProductName, setReqProductName] = useState('');
  const [reqDimension, setReqDimension] = useState('WEIGHT');
  const [reqUnit, setReqUnit] = useState('kg');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState('');

  // Notifications state
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Load functions
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
    fetchProducts();
    fetchNotifications();
  }, [searchTerm, filterCategory, filterDimension]);

  useEffect(() => {
    if (activeTab === 'quotations') {
      fetchQuotations();
    } else if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  // Set default unit when opening order modal
  useEffect(() => {
    if (selectedProduct) {
      setOrderUnit(selectedProduct.baseUnit);
      setOrderQuantity('1');
    }
  }, [selectedProduct]);

  // Set default unit when selecting dimension in Request form
  useEffect(() => {
    if (reqDimension === 'WEIGHT') setReqUnit('kg');
    else if (reqDimension === 'VOLUME') setReqUnit('L');
    else if (reqDimension === 'COUNT') setReqUnit('items');
  }, [reqDimension]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

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

  // Live Price Calculation logic matching the backend formula
  const getLiveCalculation = () => {
    if (!selectedProduct) return { valid: false };
    
    const qty = parseFloat(orderQuantity);
    if (isNaN(qty) || qty <= 0) {
      return { valid: false, message: 'Please enter a valid positive quantity' };
    }

    const orderUnitConfig = UNITS[orderUnit];
    const baseUnitConfig = UNITS[selectedProduct.baseUnit];
    const basePrice = Number(selectedProduct.basePrice);

    if (!orderUnitConfig || !baseUnitConfig) return { valid: false };

    // Calculate internal quantities
    const qtyInternal = qty * orderUnitConfig.factor;
    const priceInternal = basePrice / baseUnitConfig.factor;
    const totalCost = qtyInternal * priceInternal;

    // Converted quantity display in base unit
    const qtyInBaseUnit = qtyInternal / baseUnitConfig.factor;

    // Check stock availability
    const stockAvailable = Number(selectedProduct.stockQuantity);
    const exceedsStock = qtyInternal > stockAvailable;

    return {
      valid: true,
      qtyInternal,
      qtyInBaseUnit,
      totalCost,
      exceedsStock,
      stockAvailable,
      baseInternalUnit: selectedProduct.dimension === 'WEIGHT' ? 'g' : selectedProduct.dimension === 'VOLUME' ? 'mL' : 'items',
    };
  };

  const handleAddToBag = () => {
    const calc = getLiveCalculation();
    if (!calc.valid || calc.exceedsStock) return;

    // Check if product is already in cart, if so replace/update
    const updatedCart = cart.filter(item => item.product.id !== selectedProduct.id);
    
    updatedCart.push({
      product: selectedProduct,
      orderQuantity: parseFloat(orderQuantity),
      orderUnit: orderUnit,
      calculatedPrice: calc.totalCost,
    });

    setCart(updatedCart);
    setSelectedProduct(null);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handleSubmitQuotation = async () => {
    if (cart.length === 0) return;

    const items = cart.map(item => ({
      productId: item.product.id,
      orderQuantity: item.orderQuantity,
      orderUnit: item.orderUnit,
    }));

    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to submit quotation');
      } else {
        setCart([]);
        alert('Quotation submitted successfully! It is pending approval by the Admin.');
        setActiveTab('quotations');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to place quotation');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setReqError('');
    setReqSuccess('');
    setReqLoading(true);

    const payload = {
      productName: reqProductName,
      dimension: reqDimension,
      requestedUnit: reqUnit,
      requestedQuantity: reqQuantity ? parseFloat(reqQuantity) : null,
      notes: reqNotes,
    };

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setReqSuccess('Request submitted successfully! Admin will review this shortly.');
      setReqProductName('');
      setReqQuantity('');
      setReqNotes('');
      
      // Reload requests
      fetchRequests();
      setTimeout(() => {
        setShowRequestModal(false);
        setReqSuccess('');
      }, 1500);
    } catch (err) {
      setReqError(err.message);
    } finally {
      setReqLoading(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getDisplayStock = (product) => {
    const stock = Number(product.stockQuantity);
    
    if (product.dimension === 'WEIGHT') {
      const kgVal = stock / 1000;
      return `${kgVal.toFixed(2)} kg`;
    }
    
    if (product.dimension === 'VOLUME') {
      const lVal = stock / 1000;
      return `${lVal.toFixed(2)} L`;
    }
    
    return `${stock.toFixed(0)} items`;
  };

  const getDisplayStockDetailed = (product) => {
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

  const calcResult = getLiveCalculation();
  const cartTotal = cart.reduce((sum, item) => sum + item.calculatedPrice, 0);

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
              AasaMedChem Catalog
            </h1>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold mt-0.5">Seller Dashboard</p>
          </div>
        </div>

        {/* Notifications & User Menu */}
        <div className="flex items-center space-x-4">
          
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) {
                  handleMarkNotificationsRead();
                }
              }}
              className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-emerald-500 text-neutral-950 font-black text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full border border-neutral-950 animate-pulse">
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

      {/* Main Container */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 border-r border-neutral-800 bg-neutral-950/40 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'browse'
                ? 'bg-neutral-800/70 text-emerald-400 border border-neutral-700 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            <span>Browse Catalog</span>
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
            <span>My Quotations</span>
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
            <span>Catalog Requests</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
          
          {/* TAB 1: BROWSE CATALOG */}
          {activeTab === 'browse' && (
            <>
              {/* Product List and filters */}
              <div className="flex-1 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Chemicals Catalog</h2>
                    <p className="text-xs text-neutral-400 mt-1">Browse, search and place high-precision order quotations.</p>
                  </div>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-850 text-emerald-400 border border-neutral-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
                  >
                    <span>Request Unlisted Chemical</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-900/40 p-4 border border-neutral-850 rounded-2xl">
                  <div>
                    <input
                      type="text"
                      placeholder="Search by name, SKU, description..."
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
                    <input
                      type="text"
                      placeholder="Filter Category"
                      className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-4 py-2.5 text-xs text-neutral-200 outline-none placeholder-neutral-500 transition-colors"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    />
                  </div>
                </div>

                {/* Catalog Grid */}
                {loadingProducts ? (
                  <div className="flex justify-center items-center py-20">
                    <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
                    <p className="text-neutral-400 text-sm">No products found. Adjust your filters or request a product.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => {
                      const isOutOfStock = Number(product.stockQuantity) <= 0;
                      return (
                        <div key={product.id} className="bg-neutral-900/30 border border-neutral-800/80 hover:border-neutral-700/80 p-5 rounded-2xl flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className="font-mono text-[9px] bg-neutral-950 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded uppercase">
                                {product.sku}
                              </span>
                              {product.category && (
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                  {product.category}
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-neutral-100 text-base">{product.name}</h3>
                            {product.description && (
                              <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                            )}
                          </div>

                          <div className="mt-5 pt-4 border-t border-neutral-850/60 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Configure Price</p>
                              <p className="font-black text-emerald-400 text-lg">
                                {formatCurrency(product.basePrice)} <span className="text-xs text-neutral-500 font-bold">/ {product.baseUnit}</span>
                              </p>
                              <span className="text-[10px] text-neutral-400 block mt-0.5">
                                Stock: {getDisplayStock(product)}
                              </span>
                            </div>

                            <button
                              disabled={isOutOfStock}
                              onClick={() => setSelectedProduct(product)}
                              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                                isOutOfStock
                                  ? 'bg-neutral-950 border border-neutral-900 text-neutral-600 cursor-not-allowed'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/5'
                              }`}
                            >
                              {isOutOfStock ? 'Out of Stock' : 'Order / Quote'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quotation Cart Sidebar */}
              <div className="w-full lg:w-80 bg-neutral-900/40 border border-neutral-850 p-5 rounded-2xl flex flex-col h-[calc(100vh-140px)] sticky top-24 shadow-xl">
                <div className="border-b border-neutral-800 pb-3 mb-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-neutral-300 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Quotation Cart
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {cart.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                      <p>Your cart is empty.</p>
                      <p className="text-[10px] mt-1 text-neutral-600">Select a product and enter order quantity to begin.</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.product.id} className="bg-neutral-950/80 border border-neutral-800/80 p-3.5 rounded-xl space-y-2 relative group hover:border-neutral-700 transition-colors">
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="absolute top-2 right-2 text-neutral-500 hover:text-rose-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <h4 className="font-bold text-neutral-200 pr-5 truncate">{item.product.name}</h4>
                        <div className="flex justify-between items-center text-[10px] text-neutral-400">
                          <span>Ordered Qty:</span>
                          <span className="font-bold text-neutral-200">{item.orderQuantity} {item.orderUnit}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-neutral-850 pt-2 text-emerald-400 font-bold text-xs">
                          <span>Cost (Est.):</span>
                          <span>{formatCurrency(item.calculatedPrice)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-neutral-800 pt-4 mt-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-400">Total Price:</span>
                      <span className="font-black text-emerald-400 text-base">{formatCurrency(cartTotal)}</span>
                    </div>
                    <button
                      onClick={handleSubmitQuotation}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/10 text-xs transition-colors"
                    >
                      Submit Quotation Order
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: MY QUOTATIONS */}
          {activeTab === 'quotations' && (
            <div className="flex-1 space-y-6">
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
                    <div key={quote.id} className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-2xl space-y-4 shadow-md">
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
                          <span className={`px-2 py-1 rounded text-[9px] font-extrabold border ${
                            quote.status === 'PENDING' ? 'bg-amber-950/20 border-amber-800/60 text-amber-300' :
                            quote.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300' :
                            quote.status === 'REJECTED' ? 'bg-rose-950/20 border-rose-800/60 text-rose-300' :
                            'bg-indigo-950/20 border-indigo-800/60 text-indigo-300'
                          }`}>
                            {quote.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {quote.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-neutral-200">{item.product.name}</p>
                              <p className="text-[10px] text-neutral-400 mt-0.5">
                                {Number(item.orderQuantity).toFixed(2)} {item.orderUnit} @ {formatCurrency(item.product.basePrice)} / {item.product.baseUnit}
                              </p>
                            </div>
                            <span className="font-bold text-emerald-400">{formatCurrency(item.calculatedPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCT REQUESTS */}
          {activeTab === 'requests' && (
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Catalog Requests</h2>
                  <p className="text-xs text-neutral-400 mt-1">Submit restock requests or chemical catalog expansions and check their resolution status.</p>
                </div>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition-colors"
                >
                  New Request
                </button>
              </div>

              {loadingRequests ? (
                <div className="flex justify-center items-center py-20">
                  <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-16 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
                  <p className="text-neutral-400 text-sm">You haven't submitted any catalog requests yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-neutral-900/30 border border-neutral-850 rounded-2xl shadow-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                        <th className="px-6 py-4">Request Date</th>
                        <th className="px-6 py-4">Chemical Name</th>
                        <th className="px-6 py-4">Dimension</th>
                        <th className="px-6 py-4">Preferred Unit</th>
                        <th className="px-6 py-4">Target Qty</th>
                        <th className="px-6 py-4">Notes</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80 text-xs">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="px-6 py-4 text-neutral-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-bold text-neutral-100">
                            {req.productName}
                          </td>
                          <td className="px-6 py-4 font-semibold text-neutral-300">
                            {req.dimension}
                          </td>
                          <td className="px-6 py-4 text-neutral-400">
                            {req.requestedUnit}
                          </td>
                          <td className="px-6 py-4 font-bold text-neutral-200">
                            {req.requestedQuantity ? Number(req.requestedQuantity).toFixed(2) : '-'}
                          </td>
                          <td className="px-6 py-4 text-neutral-400 max-w-xs truncate">
                            {req.notes || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold border ${
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
          )}

        </main>
      </div>

      {/* DETAILED ORDER MODAL WITH LIVE CALCULATOR */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-neutral-100">Order Configuration</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">Flexible unit ordering with real-time conversion maths.</p>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-neutral-950/60 border border-neutral-850 p-4 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400 font-semibold">Product Name:</span>
                <span className="text-neutral-100 font-bold">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-semibold">SKU:</span>
                <span className="font-mono text-neutral-200">{selectedProduct.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-semibold">Config Rate:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(selectedProduct.basePrice)} / {selectedProduct.baseUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-semibold">Catalog Stock:</span>
                <span className="font-mono text-neutral-200">{getDisplayStockDetailed(selectedProduct)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Order Quantity</label>
                  <input
                    type="number"
                    step="any"
                    min="0.00000001"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-xs text-neutral-100 outline-none"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Order Unit</label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-xs text-neutral-300 outline-none"
                    value={orderUnit}
                    onChange={(e) => setOrderUnit(e.target.value)}
                  >
                    {selectedProduct.dimension === 'WEIGHT' && (
                      <>
                        <option value="g">grams (g)</option>
                        <option value="kg">kilograms (kg)</option>
                      </>
                    )}
                    {selectedProduct.dimension === 'VOLUME' && (
                      <>
                        <option value="mL">milliliters (mL)</option>
                        <option value="L">liters (L)</option>
                      </>
                    )}
                    {selectedProduct.dimension === 'COUNT' && (
                      <option value="items">items</option>
                    )}
                  </select>
                </div>
              </div>

              {/* LIVE CONVERSION & PRICING PREVIEW */}
              {calcResult.valid ? (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 text-xs font-mono">
                  <div className="flex items-center text-[10px] font-bold text-emerald-400 uppercase tracking-wider border-b border-neutral-850 pb-1.5">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Live Conversion Calculator
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400">
                    <div>Equivalent Base Qty:</div>
                    <div className="text-right text-white font-bold">{calcResult.qtyInBaseUnit.toFixed(4)} {selectedProduct.baseUnit}</div>
                    
                    <div>Equivalent Stored Qty:</div>
                    <div className="text-right text-white font-bold">{calcResult.qtyInternal.toFixed(2)} {calcResult.baseInternalUnit}</div>
                  </div>
                  
                  {calcResult.exceedsStock && (
                    <div className="p-2 bg-rose-950/40 border border-rose-800/40 text-rose-300 rounded text-[10px] flex items-center font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2 animate-ping" />
                      Ordered quantity exceeds available stock!
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-neutral-850 pt-2.5 text-xs">
                    <span className="font-bold text-neutral-400 font-sans">Live Total Cost:</span>
                    <span className="font-black text-emerald-400 text-sm">{formatCurrency(calcResult.totalCost)}</span>
                  </div>
                </div>
              ) : (
                orderQuantity && (
                  <div className="p-2.5 bg-rose-950/20 border border-rose-800/30 text-rose-300 rounded text-center text-[10.5px]">
                    {calcResult.message || 'Calculations paused...'}
                  </div>
                )
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!calcResult.valid || calcResult.exceedsStock}
                onClick={handleAddToBag}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-colors flex items-center space-x-2 ${
                  !calcResult.valid || calcResult.exceedsStock
                    ? 'bg-neutral-950 border border-neutral-900 text-neutral-600 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/10'
                }`}
              >
                <span>Add to Quotation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-neutral-100">
                Request Chemical Catalog Expansion
              </h3>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {reqError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/50 text-rose-300 rounded-xl text-xs">
                {reqError}
              </div>
            )}

            {reqSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 rounded-xl text-xs">
                {reqSuccess}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Chemical / Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aspirin powder, Ethanol 99%"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-200 outline-none"
                  value={reqProductName}
                  onChange={(e) => setReqProductName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Dimension</label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-350 outline-none"
                    value={reqDimension}
                    onChange={(e) => setReqDimension(e.target.value)}
                  >
                    <option value="WEIGHT">Weight</option>
                    <option value="VOLUME">Volume</option>
                    <option value="COUNT">Count</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Preferred Unit</label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-350 outline-none"
                    value={reqUnit}
                    onChange={(e) => setReqUnit(e.target.value)}
                  >
                    {reqDimension === 'WEIGHT' && (
                      <>
                        <option value="kg">kilograms (kg)</option>
                        <option value="g">grams (g)</option>
                      </>
                    )}
                    {reqDimension === 'VOLUME' && (
                      <>
                        <option value="L">liters (L)</option>
                        <option value="mL">milliliters (mL)</option>
                      </>
                    )}
                    {reqDimension === 'COUNT' && (
                      <option value="items">items</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Approximate Target Qty Needed (Optional)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5, 250"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2.5 text-neutral-200 outline-none"
                  value={reqQuantity}
                  onChange={(e) => setReqQuantity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Additional Specifications / Notes</label>
                <textarea
                  placeholder="Purity levels required, specific packaging, urgent needs, etc."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-3 py-2 text-neutral-200 outline-none h-16 resize-none"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reqLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-2"
                >
                  {reqLoading ? (
                    <svg className="animate-spin h-4 w-4 text-neutral-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <span>Submit Request</span>
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
