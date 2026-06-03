'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function SellerProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
            text: 'Your product has been deleted.',
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
      <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">My Products Catalog</h2>
          <p className="text-xs text-neutral-400 mt-1">Configure units, rates, SKUs, and inventory levels for your chemicals.</p>
        </div>
        <Link
          href="/seller/products/add"
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 text-xs transition-all duration-200"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Product</span>
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
          <p className="text-neutral-400 text-sm">You haven't listed any products yet. Click "Add Product" to create your first chemical listing.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-neutral-900/30 border border-neutral-850 rounded-2xl shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
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
            <tbody className="divide-y divide-neutral-800/80 text-xs text-neutral-200">
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
                      <Link
                        href={`/seller/products/add?id=${product.id}`}
                        className="inline-block bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Edit
                      </Link>
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
  );
}
