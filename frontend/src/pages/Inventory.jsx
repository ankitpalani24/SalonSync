import React, { useState } from 'react';
import { Plus, Package, Truck, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Inventory = () => {
  const { tenantFilter, db, addProduct, updateProductQuantity, addSupplier } = useApp();

  const products = tenantFilter(db.products);
  const suppliers = tenantFilter(db.suppliers);

  const [activePane, setActivePane] = useState('stock'); // 'stock', 'suppliers'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showProdModal, setShowProdModal] = useState(false);
  const [showSuppModal, setShowSuppModal] = useState(false);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [selectedProd, setSelectedProd] = useState(null);

  // Form states - Product
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCat, setProdCat] = useState('Hair Care');
  const [prodQty, setProdQty] = useState(0);
  const [prodBuyPrice, setProdBuyPrice] = useState(0);
  const [prodSellPrice, setProdSellPrice] = useState(0);
  const [prodSuppId, setProdSuppId] = useState('');
  const [prodThreshold, setProdThreshold] = useState(5);

  // Form states - Supplier
  const [suppName, setSuppName] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppEmail, setSuppEmail] = useState('');
  const [suppAddress, setSuppAddress] = useState('');

  // Form states - Stock Adjust
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustAction, setAdjustAction] = useState('in'); // 'in' or 'out'

  // Filtered Products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSubmit = (e) => {
    e.preventDefault();
    addProduct({
      name: prodName,
      sku: prodSku,
      category: prodCat,
      quantity: Number(prodQty),
      purchasePrice: Number(prodBuyPrice),
      sellingPrice: Number(prodSellPrice),
      supplierId: prodSuppId || null,
      lowStockThreshold: Number(prodThreshold)
    });
    setShowProdModal(false);
    
    // reset
    setProdName('');
    setProdSku('');
    setProdQty(0);
    setProdBuyPrice(0);
    setProdSellPrice(0);
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    addSupplier({
      name: suppName,
      phone: suppPhone,
      email: suppEmail,
      address: suppAddress
    });
    setShowSuppModal(false);

    // reset
    setSuppName('');
    setSuppPhone('');
    setSuppEmail('');
    setSuppAddress('');
  };

  const handleOpenStockAdjust = (prod) => {
    setSelectedProd(prod);
    setAdjustQty(1);
    setAdjustAction('in');
    setShowStockAdjustModal(true);
  };

  const handleStockAdjustSubmit = (e) => {
    e.preventDefault();
    const delta = adjustAction === 'in' ? Number(adjustQty) : -Number(adjustQty);
    updateProductQuantity(selectedProd._id, delta);
    setShowStockAdjustModal(false);
  };

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Inventory Control</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Track retail stocks, log item thresholds, and organize vendor list databases.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.2rem', borderRadius: '4px' }}>
          <button onClick={() => setActivePane('stock')} style={{ border: 'none', background: activePane === 'stock' ? 'var(--gold-primary)' : 'transparent', color: activePane === 'stock' ? '#000' : '#aaa', fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.75rem', borderRadius: '3px' }}>
            Products Inventory
          </button>
          <button onClick={() => setActivePane('suppliers')} style={{ border: 'none', background: activePane === 'suppliers' ? 'var(--gold-primary)' : 'transparent', color: activePane === 'suppliers' ? '#000' : '#aaa', fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.75rem', borderRadius: '3px' }}>
            Supplier Vendors
          </button>
        </div>
      </div>

      {/* 1. STOCK MANAGER PANEL */}
      {activePane === 'stock' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search products by SKU / name..."
                className="form-control"
                style={{ paddingLeft: '2.3rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button onClick={() => setShowProdModal(true)} className="gold-btn" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={16} /> Add Product
            </button>
          </div>

          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Cost / Retail Price</th>
                  <th>Supplier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const isLow = p.quantity <= p.lowStockThreshold;
                  const supp = suppliers.find(s => s._id === p.supplierId);
                  return (
                    <tr key={p._id} style={{ borderLeft: isLow ? '3px solid var(--accent-red)' : '3px solid transparent' }}>
                      <td>
                        <div>
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{p.name}</span>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.category}</p>
                        </div>
                      </td>
                      <td>{p.sku}</td>
                      <td>
                        <span style={{ color: isLow ? 'var(--accent-red)' : '#fff', fontWeight: 'bold' }}>{p.quantity} units</span>
                        {isLow && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', fontSize: '0.65rem', color: 'var(--accent-red)', marginTop: '0.15rem' }}>
                            <AlertTriangle size={10} /> Low Stock alert
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>₹{p.sellingPrice}</span>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Buy: ₹{p.purchasePrice}</p>
                      </td>
                      <td>{supp ? supp.name : 'Unknown Vendor'}</td>
                      <td>
                        <button onClick={() => handleOpenStockAdjust(p)} className="outline-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                          Stock In/Out
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SUPPLIERS PANEL */}
      {activePane === 'suppliers' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Vendor Supplier Ledger</h3>
            <button onClick={() => setShowSuppModal(true)} className="gold-btn" style={{ padding: '0.5rem 1rem' }}>
              <Truck size={16} /> Add Supplier
            </button>
          </div>

          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Outstanding Dues</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supp => (
                  <tr key={supp._id}>
                    <td>
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{supp.name}</span>
                    </td>
                    <td>{supp.phone || 'N/A'}</td>
                    <td>{supp.email || 'N/A'}</td>
                    <td>{supp.address || 'N/A'}</td>
                    <td>
                      <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>₹{(supp.outstandingDues || 0).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showProdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '420px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Register Catalog Product</h3>
              <button onClick={() => setShowProdModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Product Name *</label>
                <input type="text" required placeholder="Damage Care Hair Oil" className="form-control" value={prodName} onChange={(e) => setProdName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>SKU Code *</label>
                  <input type="text" required placeholder="OIL-DMG-250" className="form-control" value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={prodCat} onChange={(e) => setProdCat(e.target.value)}>
                    <option>Hair Care</option>
                    <option>Skin Care</option>
                    <option>Spa Cosmetics</option>
                    <option>Salon Tooling</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label>Buy Price (₹) *</label>
                  <input type="number" required placeholder="400" className="form-control" value={prodBuyPrice} onChange={(e) => setProdBuyPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Retail Price (₹) *</label>
                  <input type="number" required placeholder="750" className="form-control" value={prodSellPrice} onChange={(e) => setProdSellPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Opening Stock</label>
                  <input type="number" required className="form-control" value={prodQty} onChange={(e) => setProdQty(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Supplier Vendor</label>
                  <select className="form-control" value={prodSuppId} onChange={(e) => setProdSuppId(e.target.value)}>
                    <option value="">-- No Supplier --</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Low Alert Level</label>
                  <input type="number" className="form-control" value={prodThreshold} onChange={(e) => setProdThreshold(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>Save Product</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSuppModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '400px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Add New Supplier</h3>
              <button onClick={() => setShowSuppModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSupplierSubmit}>
              <div className="form-group">
                <label>Supplier / Company Name *</label>
                <input type="text" required placeholder="L'Oreal Ind. Private Ltd" className="form-control" value={suppName} onChange={(e) => setSuppName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input type="text" placeholder="1800-22-3000" className="form-control" value={suppPhone} onChange={(e) => setSuppPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="orders@loreal.in" className="form-control" value={suppEmail} onChange={(e) => setSuppEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Office Address</label>
                <input type="text" placeholder="Goregaon East Hub, Mumbai" className="form-control" value={suppAddress} onChange={(e) => setSuppAddress(e.target.value)} />
              </div>
              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>Save Vendor</button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {showStockAdjustModal && selectedProd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '380px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Stock Roster Adjustment</h3>
              <button onClick={() => setShowStockAdjustModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              <p><strong>Item:</strong> {selectedProd.name}</p>
              <p><strong>SKU:</strong> {selectedProd.sku}</p>
              <p><strong>Current Stock:</strong> {selectedProd.quantity} units</p>
            </div>
            <form onSubmit={handleStockAdjustSubmit}>
              <div className="form-group">
                <label>Adjustment Action</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('in')}
                    style={{
                      background: adjustAction === 'in' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.03)',
                      color: adjustAction === 'in' ? '#000' : '#aaa',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    Stock In (Purchase)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('out')}
                    style={{
                      background: adjustAction === 'out' ? 'var(--accent-red)' : 'rgba(255,255,255,0.03)',
                      color: adjustAction === 'out' ? '#fff' : '#aaa',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    Stock Out (Usage)
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Units Quantity</label>
                <input type="number" required min="1" className="form-control" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
              </div>
              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>Commit Stock Adjustment</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
