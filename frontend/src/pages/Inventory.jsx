import React, { useState } from 'react';
import {
  Plus, Package, Truck, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit, Search, X,
  Bookmark, History, Clock, User, Scissors, Calendar, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState, DataGridHeader } from '../components/UIComponents';

const Inventory = () => {
  const { tenantFilter, db, addProduct, updateProduct, updateProductQuantity, addSupplier, hasPermission, PERMISSIONS } = useApp();
  const [editingProduct, setEditingProduct] = useState(null);

  const products = tenantFilter(db.products || []);
  const suppliers = tenantFilter(db.suppliers || []);
  const consumptionLogs = tenantFilter(db.inventoryConsumptions || []);
  const lowStockProducts = products.filter(p => p.quantity <= (p.reorderLevel || p.lowStockThreshold || 5));

  const [activePane, setActivePane] = useState('stock'); // 'stock', 'audit', 'suppliers'
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
  const [prodUnit, setProdUnit] = useState('units');
  const [prodMinStock, setProdMinStock] = useState(5);
  const [prodReorderLevel, setProdReorderLevel] = useState(10);
  const [prodBuyPrice, setProdBuyPrice] = useState(0);
  const [prodSellPrice, setProdSellPrice] = useState(0);
  const [prodSuppId, setProdSuppId] = useState('');
  const [prodExpiryDate, setProdExpiryDate] = useState('');

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
    (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filtered Audit Consumption Logs
  const filteredAuditLogs = consumptionLogs.filter(log =>
    (log.productName && log.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.serviceName && log.serviceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.customerName && log.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.staffName && log.staffName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: prodName,
      sku: prodSku,
      category: prodCat,
      quantity: Number(prodQty),
      unit: prodUnit || 'units',
      minStock: Number(prodMinStock),
      reorderLevel: Number(prodReorderLevel),
      lowStockThreshold: Number(prodReorderLevel),
      purchasePrice: Number(prodBuyPrice),
      sellingPrice: Number(prodSellPrice),
      supplierId: prodSuppId || null,
      expiryDate: prodExpiryDate || null
    };

    if (editingProduct) {
      updateProduct(editingProduct._id, payload);
    } else {
      addProduct(payload);
    }

    setShowProdModal(false);
    setEditingProduct(null);
    resetProductForm();
  };

  const resetProductForm = () => {
    setProdName('');
    setProdSku('');
    setProdCat('Hair Care');
    setProdQty(0);
    setProdUnit('units');
    setProdMinStock(5);
    setProdReorderLevel(10);
    setProdBuyPrice(0);
    setProdSellPrice(0);
    setProdSuppId('');
    setProdExpiryDate('');
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdCat(p.category || 'Hair Care');
    setProdQty(p.quantity || 0);
    setProdUnit(p.unit || 'units');
    setProdMinStock(p.minStock !== undefined ? p.minStock : 5);
    setProdReorderLevel(p.reorderLevel !== undefined ? p.reorderLevel : 10);
    setProdBuyPrice(p.purchasePrice || 0);
    setProdSellPrice(p.sellingPrice || 0);
    setProdSuppId(p.supplierId || '');
    setProdExpiryDate(p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : '');
    setShowProdModal(true);
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
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Service-Linked Inventory System</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time consumable product tracking, automated service completion stock deduction, and consumption audit trails.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-3-cols" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Inventory Items</span>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>{products.length} Products</h3>
        </div>
        <div className="glass-card" style={{ borderLeft: lowStockProducts.length > 0 ? '3px solid var(--accent-red)' : '3px solid #2ecc71' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reorder & Stock Alerts</span>
          <h3 style={{ fontSize: '1.5rem', color: lowStockProducts.length > 0 ? 'var(--accent-red)' : '#2ecc71', marginTop: '0.25rem' }}>
            {lowStockProducts.length} Alert Items
          </h3>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed Service Consumptions</span>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--gold-primary)', marginTop: '0.25rem' }}>{consumptionLogs.length} Deductions Logged</h3>
        </div>
      </div>

      {/* Pane Navigation Toggles */}
      <div className="crm-workspace-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`crm-tab-btn ${activePane === 'stock' ? 'active' : ''}`}
          onClick={() => setActivePane('stock')}
        >
          <Package size={15} />
          <span>Stock Catalog ({products.length})</span>
        </button>
        <button
          className={`crm-tab-btn ${activePane === 'audit' ? 'active' : ''}`}
          onClick={() => setActivePane('audit')}
        >
          <History size={15} />
          <span>Service Consumption Audit History ({consumptionLogs.length})</span>
        </button>
        <button
          className={`crm-tab-btn ${activePane === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActivePane('suppliers')}
        >
          <Truck size={15} />
          <span>Suppliers & Vendors ({suppliers.length})</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
         PANE 1: STOCK CATALOG & REORDER LEVELS
         ════════════════════════════════════════════════════════════════════ */}
      {activePane === 'stock' && (
        <div className="glass-card">
          <DataGridHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search product name, SKU, category..."
            actionButtonLabel={hasPermission(PERMISSIONS.INVENTORY_EDIT) ? "Add Product SKU" : null}
            onActionButtonClick={() => { resetProductForm(); setShowProdModal(true); }}
            actionButtonIcon={Plus}
          />

          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No Products Found"
              description="There are no inventory items matching your search. Create a new product SKU to get started."
              actionLabel="Add Product SKU"
              onAction={() => { resetProductForm(); setShowProdModal(true); }}
            />
          ) : (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Product & SKU</th>
                    <th>Current Stock</th>
                    <th>Min / Reorder Threshold</th>
                    <th>Expiry Date</th>
                    <th>Pricing (Cost / Retail)</th>
                    <th>Supplier</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const minStk = p.minStock !== undefined ? p.minStock : 5;
                    const reorderLvl = p.reorderLevel !== undefined ? p.reorderLevel : 10;
                    const isLow = p.quantity <= reorderLvl;
                    const isCritical = p.quantity <= minStk;
                    const supp = suppliers.find(s => String(s._id) === String(p.supplierId));
                    const expStr = p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A';

                    return (
                      <tr key={p._id} style={{ borderLeft: isCritical ? '3px solid var(--accent-red)' : isLow ? '3px solid #e67e22' : '3px solid transparent' }}>
                        <td>
                          <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</span>
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.15rem' }}>
                              <span className="gcal-tag">{p.sku}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.category}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong style={{ color: isCritical ? 'var(--accent-red)' : isLow ? '#e67e22' : '#fff', fontSize: '0.95rem' }}>
                              {p.quantity} {p.unit || 'units'}
                            </strong>
                            {isLow && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.65rem', color: isCritical ? 'var(--accent-red)' : '#e67e22', marginTop: '0.15rem' }}>
                                <AlertTriangle size={10} /> {isCritical ? 'CRITICAL LOW STOCK' : 'Reorder Needed'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <div>Min: {minStk} {p.unit || 'units'}</div>
                            <div>Reorder: {reorderLvl} {p.unit || 'units'}</div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{expStr}</span>
                        </td>
                        <td>
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: 'var(--gold-primary)' }}>₹{p.sellingPrice}</strong>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cost: ₹{p.purchasePrice}</p>
                          </div>
                        </td>
                        <td>{supp ? supp.name : 'Direct Vendor'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button onClick={() => handleOpenStockAdjust(p)} className="outline-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                              Stock +/-
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="outline-btn"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: 'var(--gold-primary)', color: 'var(--gold-primary)' }}
                            >
                              Edit
                            </button>
                          </div>
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


      {/* ════════════════════════════════════════════════════════════════════
         PANE 2: SERVICE CONSUMPTION AUDIT LOG HISTORY (AUTOMATED DEDUCTIONS)
         ════════════════════════════════════════════════════════════════════ */}
      {activePane === 'audit' && (
        <div className="glass-card">
          <div className="flex-between-responsive" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} style={{ color: 'var(--gold-primary)' }} /> Service Consumption Audit Trail
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Automated inventory deductions triggered ONLY upon service completion (Appointment status: Completed).
              </p>
            </div>
          </div>

          <DataGridHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search product, service, customer, staff..."
          />

          {filteredAuditLogs.length === 0 ? (
            <EmptyState
              icon={History}
              title="No Consumption Records Logged"
              description="Inventory consumption records will automatically generate whenever an appointment status transitions to Completed."
            />
          ) : (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Consumable Product</th>
                    <th>Quantity Consumed</th>
                    <th>Triggering Service</th>
                    <th>Client Customer</th>
                    <th>Assigned Stylist</th>
                    <th>Appointment ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map(log => (
                    <tr key={log._id}>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {log.date ? new Date(log.date).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--gold-primary)' }}>{log.productName}</strong>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--accent-red)' }}>−{log.quantityConsumed} {log.unit || 'units'}</strong>
                      </td>
                      <td>
                        <span className="gcal-tag">{log.serviceName || 'Service'}</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{log.customerName || 'Client'}</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)' }}>{log.staffName || 'Staff'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{String(log.appointmentId || log._id).slice(-6)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         PANE 3: SUPPLIERS & VENDORS
         ════════════════════════════════════════════════════════════════════ */}
      {activePane === 'suppliers' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Vendor Supplier Ledger</h3>
            <button onClick={() => setShowSuppModal(true)} className="gold-btn" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
              <Truck size={15} /> Add Supplier
            </button>
          </div>

          {suppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No Suppliers Registered"
              description="Keep track of wholesale beauty vendors, distributors, and purchase orders by adding your first supplier."
              actionLabel="Add Supplier"
              onAction={() => setShowSuppModal(true)}
            />
          ) : (
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
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{supp.name}</span>
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
          )}
        </div>
      )}


      {/* Add / Edit Product Modal */}
      {showProdModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowProdModal(false); setEditingProduct(null); } }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>{editingProduct ? 'Edit Catalog Product' : 'Register Inventory Product'}</h3>
              <button onClick={() => { setShowProdModal(false); setEditingProduct(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Product Name *</label>
                <input type="text" required placeholder="L'Oreal Hair Color Shade #5" className="form-control" value={prodName} onChange={(e) => setProdName(e.target.value)} />
              </div>

              <div className="grid-3-cols">
                <div className="form-group">
                  <label>SKU Code *</label>
                  <input type="text" required placeholder="CLR-LUR-05" className="form-control" value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
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
                <div className="form-group">
                  <label>Measurement Unit</label>
                  <select className="form-control" value={prodUnit} onChange={(e) => setProdUnit(e.target.value)}>
                    <option value="units">units</option>
                    <option value="g">g (grams)</option>
                    <option value="ml">ml (milliliters)</option>
                    <option value="bottles">bottles</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
              </div>

              <div className="grid-3-cols">
                <div className="form-group">
                  <label>Current Stock</label>
                  <input type="number" required className="form-control" value={prodQty} onChange={(e) => setProdQty(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Min Stock Level</label>
                  <input type="number" className="form-control" value={prodMinStock} onChange={(e) => setProdMinStock(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Reorder Alert Level</label>
                  <input type="number" className="form-control" value={prodReorderLevel} onChange={(e) => setProdReorderLevel(e.target.value)} />
                </div>
              </div>

              <div className="grid-3-cols">
                <div className="form-group">
                  <label>Buy Price (₹) *</label>
                  <input type="number" required placeholder="400" className="form-control" value={prodBuyPrice} onChange={(e) => setProdBuyPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Retail Price (₹) *</label>
                  <input type="number" required placeholder="750" className="form-control" value={prodSellPrice} onChange={(e) => setProdSellPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="date" className="form-control" value={prodExpiryDate} onChange={(e) => setProdExpiryDate(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Supplier Vendor</label>
                <select className="form-control" value={prodSuppId} onChange={(e) => setProdSuppId(e.target.value)}>
                  <option value="">-- Direct / No Supplier --</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                {editingProduct ? 'Update Product SKU' : 'Save Product SKU'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSuppModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowSuppModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '400px' }}>
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
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowStockAdjustModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Stock Roster Adjustment</h3>
              <button onClick={() => setShowStockAdjustModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              <p><strong>Item:</strong> {selectedProd.name}</p>
              <p><strong>SKU:</strong> {selectedProd.sku}</p>
              <p><strong>Current Stock:</strong> {selectedProd.quantity} {selectedProd.unit || 'units'}</p>
            </div>
            <form onSubmit={handleStockAdjustSubmit}>
              <div className="form-group">
                <label>Adjustment Action</label>
                <div className="grid-2-cols">
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
                <label>Units Quantity ({selectedProd.unit || 'units'})</label>
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
