import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Send, CreditCard, Sparkles, User, FileText, ShoppingBag, QrCode, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Billing = ({ apptForCheckout, clearApptCheckout }) => {
  const { tenantFilter, db, createInvoice, addNotification, currentSalon, currentBranch } = useApp();

  const invoices = tenantFilter(db.invoices);
  const customers = tenantFilter(db.customers);
  const services = tenantFilter(db.services);
  const products = tenantFilter(db.products);
  const staff = tenantFilter(db.staff).filter(s => {
    if (!currentBranch) return true;
    const bid = typeof s.branchId === 'object' ? s.branchId?._id : s.branchId;
    return !bid || String(bid) === String(currentBranch._id);
  });

  const [activePane, setActivePane] = useState('pos'); // 'pos', 'history'
  const [selectedInvoice, setSelectedInvoice] = useState(null); // printable invoice modal
  const [isProcessing, setIsProcessing] = useState(false);

  const getModalClient = () => {
    if (!selectedInvoice || !selectedInvoice.customerId) return null;
    const cId = typeof selectedInvoice.customerId === 'object' ? selectedInvoice.customerId._id : selectedInvoice.customerId;
    return db.customers.find(c => String(c._id) === String(cId)) || (typeof selectedInvoice.customerId === 'object' ? selectedInvoice.customerId : null);
  };
  const modalClient = getModalClient();

  const getInvoiceCustomerName = (inv) => {
    if (!inv || !inv.customerId) return 'Guest walk-in';
    const cId = typeof inv.customerId === 'object' ? inv.customerId._id : inv.customerId;
    const client = db.customers.find(c => String(c._id) === String(cId));
    if (client) return client.name;
    if (typeof inv.customerId === 'object' && inv.customerId.name) return inv.customerId.name;
    return 'Guest walk-in';
  };

  // POS State
  const [selectedCustId, setSelectedCustId] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [checkoutServices, setCheckoutServices] = useState([]); // array of {serviceId, quantity}
  const [checkoutProducts, setCheckoutProducts] = useState([]); // array of {productId, quantity}
  const [taxPercent, setTaxPercent] = useState(18); // default GST
  const [discountAmt, setDiscountAmt] = useState(0);
  const [payMethod, setPayMethod] = useState('UPI');

  // Temp service/product dropdown selections
  const [tempSrvId, setTempSrvId] = useState('');
  const [tempProdId, setTempProdId] = useState('');

  // Handle preset appointment checkout from calendar transition
  useEffect(() => {
    if (apptForCheckout) {
      // Safely extract _id from populated objects
      const custId = typeof apptForCheckout.customerId === 'object' && apptForCheckout.customerId !== null
        ? apptForCheckout.customerId._id
        : apptForCheckout.customerId;
      const stfId = typeof apptForCheckout.staffId === 'object' && apptForCheckout.staffId !== null
        ? apptForCheckout.staffId._id
        : apptForCheckout.staffId;
      
      setSelectedCustId(custId || '');
      setSelectedStaffId(stfId || '');
      
      const apptServices = apptForCheckout.services.map(s => ({
        serviceId: s.serviceId,
        quantity: 1
      }));
      setCheckoutServices(apptServices);
      
      // Clear parent state so it doesn't loop
      clearApptCheckout();
    }
  }, [apptForCheckout]);

  // Calculations
  const getSubTotal = () => {
    let sum = 0;
    checkoutServices.forEach(item => {
      const s = services.find(srv => String(srv._id) === String(item.serviceId));
      if (s) sum += s.price * item.quantity;
    });
    checkoutProducts.forEach(item => {
      const p = products.find(prod => String(prod._id) === String(item.productId));
      if (p) sum += p.sellingPrice * item.quantity;
    });
    return sum;
  };

  const subTotal = getSubTotal();
  const calculatedTax = Math.round(subTotal * (taxPercent / 100));
  const finalAmount = Math.max(0, Math.round(subTotal + calculatedTax - Number(discountAmt)));

  const handleAddService = () => {
    if (!tempSrvId) return;
    const exists = checkoutServices.some(s => String(s.serviceId) === String(tempSrvId));
    if (exists) return;
    setCheckoutServices(prev => [...prev, { serviceId: tempSrvId, quantity: 1 }]);
    setTempSrvId('');
  };

  const handleAddProduct = () => {
    if (!tempProdId) return;
    
    const p = products.find(prod => String(prod._id) === String(tempProdId));
    if (!p) return;
    
    if (p.quantity <= 0) {
      alert(`Cannot add ${p.name} to billing. Out of stock!`);
      return;
    }
    
    const exists = checkoutProducts.some(item => String(item.productId) === String(tempProdId));
    if (exists) return;
    setCheckoutProducts(prev => [...prev, { productId: tempProdId, quantity: 1 }]);
    setTempProdId('');
  };

  const handleRemoveService = (id) => {
    setCheckoutServices(prev => prev.filter(s => s.serviceId !== id));
  };

  const handleRemoveProduct = (id) => {
    setCheckoutProducts(prev => prev.filter(p => p.productId !== id));
  };

  const handleQuantityChange = (type, id, delta) => {
    if (type === 'service') {
      setCheckoutServices(prev => prev.map(s => s.serviceId === id ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s));
    } else {
      const p = products.find(prod => String(prod._id) === String(id));
      if (!p) return;
      
      setCheckoutProducts(prev => prev.map(item => {
        if (item.productId === id) {
          const newQty = item.quantity + delta;
          if (newQty > p.quantity) {
            alert(`Cannot increase quantity. Only ${p.quantity} units of ${p.name} available in stock.`);
            return item;
          }
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      }));
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (checkoutServices.length === 0 && checkoutProducts.length === 0) {
      alert('Please add at least one treatment service or product to invoice.');
      return;
    }

    // Verify stock availability before submission
    for (const item of checkoutProducts) {
      const p = products.find(prod => String(prod._id) === String(item.productId));
      if (p && item.quantity > p.quantity) {
        alert(`Cannot complete billing. Insufficient stock for ${p.name}. Available: ${p.quantity}, Demanded: ${item.quantity}`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const safeCustId = typeof selectedCustId === 'object' ? selectedCustId?._id : selectedCustId;
      const safeStaffId = typeof selectedStaffId === 'object' ? selectedStaffId?._id : selectedStaffId;
      const payload = {
        customerId: safeCustId || null,
        services: checkoutServices,
        products: checkoutProducts,
        tax: Number(taxPercent),
        discount: Number(discountAmt),
        paymentMethod: payMethod,
        staffId: safeStaffId || null
      };

      const newInvoice = await createInvoice(payload);
      
      if (newInvoice) {
        // Send notification to the client
        if (safeCustId) {
          const client = customers.find(c => String(c._id) === String(safeCustId));
          if (client) {
            addNotification({
              customerId: safeCustId,
              salonId: null, // Exclude from salon owner's feed
              type: 'Billing',
              message: `Your visit receipt ${newInvoice.invoiceNumber || 'INV'} has been generated. Total charged: ₹${finalAmount}. Thank you for using SalonSync!`,
              status: 'Sent'
            });
          }
        }

        // Clear Form
        setSelectedCustId('');
        setWalkinName('');
        setSelectedStaffId('');
        setCheckoutServices([]);
        setCheckoutProducts([]);
        setDiscountAmt(0);

        // Open print preview modal immediately
        setSelectedInvoice(newInvoice);
      } else {
        alert('Failed to generate invoice. Please verify backend connection.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container animated-fade-in">
      {/* Header Tabs */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>POS Billing Desk</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Checkout walk-in clients, sell retail products, and check invoice histories.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.2rem', borderRadius: '4px' }}>
          <button onClick={() => setActivePane('pos')} style={{ border: 'none', background: activePane === 'pos' ? 'var(--gold-primary)' : 'transparent', color: activePane === 'pos' ? '#000' : '#aaa', fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.75rem', borderRadius: '3px' }}>
            POS Checkout Terminal
          </button>
          <button onClick={() => setActivePane('history')} style={{ border: 'none', background: activePane === 'history' ? 'var(--gold-primary)' : 'transparent', color: activePane === 'history' ? '#000' : '#aaa', fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.75rem', borderRadius: '3px' }}>
            Invoice History Ledger
          </button>
        </div>
      </div>

      {/* 1. POS CHECKOUT SCREEN */}
      {activePane === 'pos' && (
        <form onSubmit={handleCheckoutSubmit} className="pos-grid">
          {/* Left panel: Cart Compiler */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} /> Sales Register Cart
            </h3>

            {/* Dropdown service selector */}
            <div className="flex-mobile-column" style={{ marginBottom: '1.5rem' }}>
              <select className="form-control" style={{ flex: 2 }} value={tempSrvId} onChange={(e) => setTempSrvId(e.target.value)}>
                <option value="">-- Click to Add Treatment Service --</option>
                {services.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.category ? `[${s.category}] - ` : ''}{s.name} (₹{s.price})
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddService} className="outline-btn" style={{ padding: '0.5rem 1rem' }}>Add Service</button>
            </div>

            {/* Dropdown product selector */}
            <div className="flex-mobile-column" style={{ marginBottom: '1.5rem' }}>
              <select className="form-control" style={{ flex: 2 }} value={tempProdId} onChange={(e) => setTempProdId(e.target.value)}>
                <option value="">-- Click to Add Hair Care Retail Product --</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.category ? `[${p.category}] - ` : ''}{p.name} (₹{p.sellingPrice} - Stock: {p.quantity})
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddProduct} className="outline-btn" style={{ padding: '0.5rem 1rem' }}>Add Product</button>
            </div>

            {/* Items Listing Table */}
            <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: '6px' }}>
              <table className="premium-table">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <th>Sale Item details</th>
                    <th>Rate</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th>Subtotal</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {checkoutServices.length === 0 && checkoutProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Sales cart is empty. Add services or products above.</td>
                    </tr>
                  ) : (
                    <>
                      {/* Services loop */}
                      {checkoutServices.map(item => {
                        const s = services.find(srv => String(srv._id) === String(item.serviceId));
                        if (!s) return null;
                        return (
                          <tr key={item.serviceId}>
                            <td>
                              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>✂️ {s.name}</span>
                              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Treatment Menu item</p>
                            </td>
                            <td>₹{s.price}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button type="button" onClick={() => handleQuantityChange('service', item.serviceId, -1)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: 'none', width: '20px', height: '20px', borderRadius: '3px' }}>-</button>
                                <span>{item.quantity}</span>
                                <button type="button" onClick={() => handleQuantityChange('service', item.serviceId, 1)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: 'none', width: '20px', height: '20px', borderRadius: '3px' }}>+</button>
                              </div>
                            </td>
                            <td>₹{s.price * item.quantity}</td>
                            <td>
                              <button type="button" onClick={() => handleRemoveService(item.serviceId)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Products loop */}
                      {checkoutProducts.map(item => {
                        const p = products.find(prod => String(prod._id) === String(item.productId));
                        if (!p) return null;
                        return (
                          <tr key={item.productId}>
                            <td>
                              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>🧴 {p.name}</span>
                              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</p>
                            </td>
                            <td>₹{p.sellingPrice}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button type="button" onClick={() => handleQuantityChange('product', item.productId, -1)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: 'none', width: '20px', height: '20px', borderRadius: '3px' }}>-</button>
                                <span>{item.quantity}</span>
                                <button type="button" onClick={() => handleQuantityChange('product', item.productId, 1)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: 'none', width: '20px', height: '20px', borderRadius: '3px' }}>+</button>
                              </div>
                            </td>
                            <td>₹{p.sellingPrice * item.quantity}</td>
                            <td>
                              <button type="button" onClick={() => handleRemoveProduct(item.productId)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Checkout and Client config */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '1.25rem' }}>Checkout & Checkout Details</h3>

            <div className="form-group">
              <label>Select Registered Customer</label>
              <select className="form-control" value={selectedCustId} onChange={(e) => setSelectedCustId(e.target.value)}>
                <option value="">-- Guest Walk-in client --</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Assign operator Stylist</label>
              <select className="form-control" required value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
                <option value="">-- Choose Stylist --</option>
                {staff.map(s => <option key={s._id} value={s._id}>{s.name} ({s.commissionPercentage}% Commission)</option>)}
              </select>
            </div>

            {/* Calculations Breakdown */}
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              padding: '1.25rem',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span style={{ color: 'var(--text-primary)' }}>₹{subTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>GST Tax Rate (%):</span>
                <input type="number" className="form-control" style={{ width: '60px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', textAlign: 'center' }} value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Discount Value (₹):</span>
                <input type="number" className="form-control" style={{ width: '85px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', textAlign: 'center' }} value={discountAmt} onChange={(e) => setDiscountAmt(e.target.value)} />
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--gold-primary)' }}>Final checkout:</span>
                <span style={{ color: 'var(--gold-primary)' }}>₹{finalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Pay methods and button */}
            <div className="form-group">
              <label>Select Payment Method</label>
              <div className="grid-3-cols">
                {['UPI', 'Cash', 'Card'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayMethod(method)}
                    style={{
                      background: payMethod === method ? 'var(--gold-primary)' : 'rgba(255,255,255,0.03)',
                      color: payMethod === method ? '#000' : '#aaa',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
              <CreditCard size={16} /> Collect Payment & Print Invoice
            </button>
          </div>
        </form>
      )}

      {/* 2. INVOICE HISTORY SCREEN */}
      {activePane === 'history' && (
        <div className="glass-card">
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Client</th>
                  <th>Services/Products</th>
                  <th>Total Amount</th>
                  <th>Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const client = (() => {
                    if (inv.customerId && typeof inv.customerId === 'object') return inv.customerId;
                    return db.customers.find(c => String(c._id) === String(inv.customerId));
                  })();
                  return (
                    <tr key={inv._id}>
                      <td>
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{inv.invoiceNumber}</span>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(inv.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td>{getInvoiceCustomerName(inv)}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem' }}>
                          {inv.services.map(s => s.name).concat(inv.products.map(p => p.name)).join(', ')}
                        </span>
                      </td>
                      <td>₹{inv.finalAmount}</td>
                      <td>
                        <span className="badge confirmed">{inv.paymentMethod}</span>
                      </td>
                      <td>
                        <button onClick={() => setSelectedInvoice(inv)} className="outline-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                          <Printer size={12} /> View Receipt
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

      {/* Printable Receipt Modal */}
      {selectedInvoice && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setSelectedInvoice(null); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content print-receipt-modal" style={{
            width: '100%',
            maxWidth: '450px',
            background: '#ffffff',
            color: '#000000',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedInvoice(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                color: '#666',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {/* Receipt Content */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #ddd', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: '#000' }}>{currentSalon?.name || 'SalonSync'}</h3>
              <p style={{ fontSize: '0.75rem', color: '#555' }}>{currentBranch ? `${currentBranch.name}, ${currentBranch.address || ''} ${currentBranch.city || ''}` : (currentSalon?.address || '')}</p>
              <p style={{ fontSize: '0.75rem', color: '#555' }}>{currentSalon?.gstNumber ? `GSTIN: ${currentSalon.gstNumber} • ` : ''}{currentSalon?.phone ? `Ph: ${currentSalon.phone}` : ''}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#333', marginBottom: '1rem' }}>
              <div>
                <p><strong>Invoice No:</strong> {selectedInvoice.invoiceNumber}</p>
                <p><strong>Date:</strong> {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p><strong>Client Name:</strong> {getInvoiceCustomerName(selectedInvoice)}</p>
                <p><strong>Stylist:</strong> {(() => { const sid = typeof selectedInvoice.staffId === 'object' ? selectedInvoice.staffId?._id : selectedInvoice.staffId; return db.staff.find(s => String(s._id) === String(sid))?.name || (typeof selectedInvoice.staffId === 'object' ? selectedInvoice.staffId?.name : null) || 'House Stylist'; })()}</p>
              </div>
            </div>

            {/* Items Grid */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>
                  <th style={{ padding: '0.4rem 0', textAlign: 'left' }}>Item Description</th>
                  <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.services.map((item, idx) => (
                  <tr key={`srv-${idx}`} style={{ borderBottom: '1px dashed #eee' }}>
                    <td style={{ padding: '0.4rem 0' }}>✂️ {item.name}</td>
                    <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>₹{item.price * item.quantity}</td>
                  </tr>
                ))}
                {selectedInvoice.products.map((item, idx) => (
                  <tr key={`prod-${idx}`} style={{ borderBottom: '1px dashed #eee' }}>
                    <td style={{ padding: '0.4rem 0' }}>🧴 {item.name}</td>
                    <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>₹{item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', alignSelf: 'flex-end', borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax GST ({selectedInvoice.tax}%):</span>
                <span>₹{Math.round((selectedInvoice.finalAmount - selectedInvoice.discount) * (selectedInvoice.tax / 118))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount Applied:</span>
                <span>-₹{selectedInvoice.discount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: '0.25rem' }}>
                <span>Grand Total Paid:</span>
                <span>₹{selectedInvoice.finalAmount}</span>
              </div>
            </div>

            {/* UPI QR Code simulator */}
            {selectedInvoice.paymentMethod === 'UPI' && (
              <div style={{
                background: '#f8f9fa',
                padding: '0.75rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #eee',
                marginBottom: '1rem'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'bold' }}>UPI INSTANT QR PAY</span>
                  <p style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.15rem' }}>Scan to clear ₹{selectedInvoice.finalAmount} invoice</p>
                </div>
                <QrCode size={40} style={{ color: '#000' }} />
              </div>
            )}

            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#666' }}>
              <p>Thank you for your visit!</p>
              <p>Simulated Digital bill sent to client WhatsApp successfully.</p>
              <button 
                onClick={() => { window.print(); }} 
                className="gold-btn print-btn" 
                style={{ width: '100%', justifyContent: 'center', padding: '0.5rem', fontSize: '0.75rem', marginTop: '1rem' }}
              >
                Print Receipt
              </button>
              {modalClient && modalClient.phone && (
                <button
                  type="button"
                  onClick={() => {
                    let formattedPhone = modalClient.phone.replace(/\D/g, '');
                    if (formattedPhone.length === 10) {
                      formattedPhone = '91' + formattedPhone;
                    }
                    const servicesText = selectedInvoice.services.map(s => `- ${s.name}: ₹${s.price}`).join('\n');
                    const productsText = selectedInvoice.products.length > 0 
                      ? '\nProducts:\n' + selectedInvoice.products.map(p => `- ${p.name} (x${p.quantity}): ₹${p.price}`).join('\n') 
                      : '';
                    const msg = `Hello ${modalClient.name},\n\nThank you for visiting SalonSync! Here is your bill summary (Invoice No: ${selectedInvoice.invoiceNumber}):\n\nServices:\n${servicesText}${productsText}\n\nDiscount: ₹${selectedInvoice.discount}\nTax GST: ${selectedInvoice.tax}%\nGrand Total Paid: *₹${selectedInvoice.finalAmount}*\n\nHope to see you again!`;
                    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="outline-btn"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    borderColor: '#25D366',
                    color: '#25D366',
                    background: 'rgba(37, 211, 102, 0.05)'
                  }}
                >
                  Send via WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Processing Overlay */}
      {isProcessing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          transition: 'all 0.3s ease-in-out'
        }}>
          <div style={{
            background: 'rgba(30, 35, 25, 0.9)',
            border: '1px solid var(--gold-primary)',
            borderRadius: '12px',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <svg className="animate-spin" style={{
              width: '50px',
              height: '50px',
              marginBottom: '1.5rem',
              color: 'var(--gold-primary)'
            }} viewBox="0 0 24 24" fill="none">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '600' }}>Processing Payment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>Generating transaction invoice and updating ledgers. Please wait...</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
