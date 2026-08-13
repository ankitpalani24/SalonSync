import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Trash2, Printer, Send, CreditCard, Sparkles, User, FileText, ShoppingBag,
  QrCode, X, Download, Mail, MessageSquare, Search, Filter, Calendar,
  ArrowUpRight, ArrowDownRight, TrendingUp, Receipt, IndianRupee, Clock,
  CheckCircle2, ChevronDown, Eye, Share2, Building2, Phone, MapPin
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const formatDate = (d) => {
  if (!d) return 'N/A';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};
const formatDateTime = (d) => {
  if (!d) return 'N/A';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const generateQRDataURL = (text) => {
  // Simple QR-like SVG pattern as placeholder (real QR would use a library)
  const size = 120;
  const cells = 21;
  const cellSize = size / cells;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  // Generate deterministic pattern from text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i);
  // Corner finder patterns
  const drawFinder = (x, y) => {
    svg += `<rect x="${x*cellSize}" y="${y*cellSize}" width="${7*cellSize}" height="${7*cellSize}" fill="black"/>`;
    svg += `<rect x="${(x+1)*cellSize}" y="${(y+1)*cellSize}" width="${5*cellSize}" height="${5*cellSize}" fill="white"/>`;
    svg += `<rect x="${(x+2)*cellSize}" y="${(y+2)*cellSize}" width="${3*cellSize}" height="${3*cellSize}" fill="black"/>`;
  };
  drawFinder(0, 0); drawFinder(14, 0); drawFinder(0, 14);
  // Data modules
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
      const bit = ((hash * (r * cells + c + 1)) >>> 0) % 3;
      if (bit === 0) {
        svg += `<rect x="${c*cellSize}" y="${r*cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }
  svg += '</svg>';
  return 'data:image/svg+xml;base64,' + btoa(svg);
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROFESSIONAL INVOICE TEMPLATE COMPONENT (used for modal, print, PDF)
// ═══════════════════════════════════════════════════════════════════════════════
const InvoiceTemplate = React.forwardRef(({ invoice, customer, salon, branch, staffName }, ref) => {
  if (!invoice) return null;
  const salonName = salon?.name || 'SalonSync';
  const salonAddr = branch ? `${branch.name}${branch.address ? ', ' + branch.address : ''}${branch.city ? ', ' + branch.city : ''}` : (salon?.address || '');
  const salonPhone = salon?.phone || '';
  const gst = salon?.gstNumber || '';
  const custName = customer?.name || 'Guest Walk-in';
  const custPhone = customer?.phone || '';
  const custEmail = customer?.email || '';
  const qrData = `upi://pay?pa=salonsync@upi&pn=${encodeURIComponent(salonName)}&am=${invoice.finalAmount}&tn=Invoice-${invoice.invoiceNumber}`;
  const qrImg = generateQRDataURL(qrData);
  const servicesTotal = (invoice.services || []).reduce((s, i) => s + (i.price * i.quantity), 0);
  const productsTotal = (invoice.products || []).reduce((s, i) => s + (i.price * i.quantity), 0);
  const subTotal = servicesTotal + productsTotal;
  const taxAmt = Math.round(subTotal * (invoice.tax / 100));

  return (
    <div ref={ref} style={{
      width: '100%',
      maxWidth: '650px',
      margin: '0 auto',
      background: '#ffffff',
      color: '#1a1a1a',
      fontFamily: "'Montserrat', 'Segoe UI', sans-serif",
      fontSize: '13px',
      lineHeight: '1.5'
    }}>
      {/* ── INVOICE HEADER ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#ffffff',
        padding: '28px 32px',
        borderRadius: '12px 12px 0 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '40%', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #708238 0%, #5b6d2b 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '1px'
              }}>SS</div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '0.5px' }}>{salonName}</h1>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{salon?.businessType || 'Premium Salon & Spa'}</p>
              </div>
            </div>
            {salonAddr && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {salonAddr}</p>}
            {salonPhone && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>📞 {salonPhone}</p>}
            {gst && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>GSTIN: {gst}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
              padding: '12px 16px'
            }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px' }}>Tax Invoice</p>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>#{invoice.invoiceNumber}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>{formatDateTime(invoice.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BILL TO / PAYMENT INFO ─────────────────────────── */}
      <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eef0f2' }}>
        <div>
          <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px', fontWeight: '600' }}>Bill To</p>
          <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>{custName}</p>
          {custPhone && <p style={{ fontSize: '12px', color: '#666', margin: '2px 0' }}>📱 {custPhone}</p>}
          {custEmail && <p style={{ fontSize: '12px', color: '#666', margin: '2px 0' }}>✉ {custEmail}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px', fontWeight: '600' }}>Payment Info</p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: invoice.paymentMethod === 'UPI' ? '#e8f5e9' : invoice.paymentMethod === 'Card' ? '#e3f2fd' : '#fff3e0',
            color: invoice.paymentMethod === 'UPI' ? '#2e7d32' : invoice.paymentMethod === 'Card' ? '#1565c0' : '#e65100',
            padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
          }}>
            <CreditCard size={13} /> {invoice.paymentMethod}
          </div>
          <p style={{ fontSize: '12px', color: '#666', margin: '6px 0 0' }}>Status: <span style={{ color: '#2e7d32', fontWeight: '600' }}>PAID</span></p>
        </div>
      </div>

      {/* ── SERVICES TABLE ─────────────────────────────────── */}
      {invoice.services && invoice.services.length > 0 && (
        <div style={{ padding: '20px 32px 0' }}>
          <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px', fontWeight: '600' }}>Services</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #1a1a2e' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service</th>
                <th style={{ textAlign: 'center', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map((item, idx) => (
                <tr key={`srv-${idx}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 0', fontSize: '12px', color: '#888' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{item.name}</span>
                    {item.category && <span style={{ display: 'block', fontSize: '10px', color: '#999' }}>{item.category}</span>}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'center', color: '#555' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#555' }}>₹{item.price?.toLocaleString()}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600', color: '#1a1a1a' }}>₹{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PRODUCTS TABLE ─────────────────────────────────── */}
      {invoice.products && invoice.products.length > 0 && (
        <div style={{ padding: '20px 32px 0' }}>
          <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px', fontWeight: '600' }}>Products</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #1a1a2e' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</th>
                <th style={{ textAlign: 'center', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.products.map((item, idx) => (
                <tr key={`prod-${idx}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 0', fontSize: '12px', color: '#888' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{item.name}</span>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'center', color: '#555' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#555' }}>₹{item.price?.toLocaleString()}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600', color: '#1a1a1a' }}>₹{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TOTALS & QR ────────────────────────────────────── */}
      <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px' }}>
        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <img src={qrImg} alt="Payment QR" style={{ width: '100px', height: '100px', border: '3px solid #1a1a2e', borderRadius: '8px', padding: '4px', background: '#fff' }} />
          <span style={{ fontSize: '9px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Scan to Pay</span>
        </div>

        {/* Totals */}
        <div style={{ flex: 1, maxWidth: '280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#555' }}>
            <span>Subtotal</span>
            <span>₹{subTotal.toLocaleString()}</span>
          </div>
          {invoice.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#e53935' }}>
              <span>Discount</span>
              <span>- ₹{invoice.discount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#555' }}>
            <span>GST ({invoice.tax}%)</span>
            <span>₹{taxAmt.toLocaleString()}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '6px',
            borderTop: '2px solid #1a1a2e', fontSize: '18px', fontWeight: '800', color: '#1a1a2e'
          }}>
            <span>Total</span>
            <span>₹{invoice.finalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <div style={{
        background: '#f8f9fa', padding: '16px 32px', borderRadius: '0 0 12px 12px',
        textAlign: 'center', borderTop: '1px solid #eef0f2'
      }}>
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 4px' }}>Thank you for choosing <strong>{salonName}</strong>! We look forward to your next visit.</p>
        <p style={{ fontSize: '10px', color: '#bbb' }}>This is a computer-generated invoice. No signature required. • Powered by SalonSync</p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN BILLING COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Billing = ({ apptForCheckout, clearApptCheckout }) => {
  const { tenantFilter, db, createInvoice, addNotification, addToast, currentSalon, currentBranch, hasPermission, PERMISSIONS } = useApp();

  const invoices = tenantFilter(db.invoices);
  const customers = tenantFilter(db.customers);
  const services = tenantFilter(db.services);
  const products = tenantFilter(db.products);
  const staff = tenantFilter(db.staff).filter(s => {
    if (!currentBranch) return true;
    const bid = typeof s.branchId === 'object' ? s.branchId?._id : s.branchId;
    return !bid || String(bid) === String(currentBranch._id);
  });

  const [activePane, setActivePane] = useState('pos');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const invoiceRef = useRef(null);

  // History filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyPayFilter, setHistoryPayFilter] = useState('ALL');

  // POS State
  const [selectedCustId, setSelectedCustId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [checkoutServices, setCheckoutServices] = useState([]);
  const [checkoutProducts, setCheckoutProducts] = useState([]);
  const [taxPercent, setTaxPercent] = useState(18);
  const [discountAmt, setDiscountAmt] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [payMethod, setPayMethod] = useState('UPI');
  const [tempSrvId, setTempSrvId] = useState('');
  const [tempProdId, setTempProdId] = useState('');

  // Selected customer object for loyalty calculation
  const selectedCustomerObj = customers.find(c => String(c._id) === String(selectedCustId));
  const pointsAvailable = selectedCustomerObj?.loyaltyPoints || 0;
  const actualPointsRedeemed = Math.min(Number(redeemPoints) || 0, pointsAvailable);

  // Appointment checkout preset
  useEffect(() => {
    if (apptForCheckout) {
      const custId = typeof apptForCheckout.customerId === 'object' && apptForCheckout.customerId !== null
        ? apptForCheckout.customerId._id : apptForCheckout.customerId;
      const stfId = typeof apptForCheckout.staffId === 'object' && apptForCheckout.staffId !== null
        ? apptForCheckout.staffId._id : apptForCheckout.staffId;
      setSelectedCustId(custId || '');
      setSelectedStaffId(stfId || '');
      const apptServices = apptForCheckout.services.map(s => ({ serviceId: s.serviceId, quantity: 1 }));
      setCheckoutServices(apptServices);
      clearApptCheckout();
    }
  }, [apptForCheckout]);

  // ── HELPERS ──
  const getCustomerForInvoice = (inv) => {
    if (!inv || !inv.customerId) return null;
    const cId = typeof inv.customerId === 'object' ? inv.customerId._id : inv.customerId;
    return db.customers.find(c => String(c._id) === String(cId)) || (typeof inv.customerId === 'object' ? inv.customerId : null);
  };
  const getInvoiceCustomerName = (inv) => getCustomerForInvoice(inv)?.name || 'Guest Walk-in';
  const getStaffName = (inv) => {
    if (!inv?.staffId) return 'House Stylist';
    const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
    return db.staff.find(s => String(s._id) === String(sid))?.name || (typeof inv.staffId === 'object' ? inv.staffId?.name : null) || 'House Stylist';
  };

  // ── CALCULATIONS ──
  const getSubTotal = () => {
    let sum = 0;
    checkoutServices.forEach(item => { const s = services.find(srv => String(srv._id) === String(item.serviceId)); if (s) sum += s.price * item.quantity; });
    checkoutProducts.forEach(item => { const p = products.find(prod => String(prod._id) === String(item.productId)); if (p) sum += p.sellingPrice * item.quantity; });
    return sum;
  };
  const subTotal = getSubTotal();
  const calculatedTax = Math.round(subTotal * (taxPercent / 100));
  const finalAmount = Math.max(0, Math.round(subTotal + calculatedTax - Number(discountAmt) - actualPointsRedeemed));

  // ── CART HANDLERS ──
  const handleAddService = () => { if (!tempSrvId) return; if (checkoutServices.some(s => String(s.serviceId) === String(tempSrvId))) return; setCheckoutServices(prev => [...prev, { serviceId: tempSrvId, quantity: 1 }]); setTempSrvId(''); };
  const handleAddProduct = () => {
    if (!tempProdId) return;
    const p = products.find(prod => String(prod._id) === String(tempProdId));
    if (!p) return;
    if (p.quantity <= 0) { addToast(`Cannot add ${p.name}. Out of stock!`, 'error'); return; }
    if (checkoutProducts.some(item => String(item.productId) === String(tempProdId))) return;
    setCheckoutProducts(prev => [...prev, { productId: tempProdId, quantity: 1 }]);
    setTempProdId('');
  };
  const handleRemoveService = (id) => setCheckoutServices(prev => prev.filter(s => s.serviceId !== id));
  const handleRemoveProduct = (id) => setCheckoutProducts(prev => prev.filter(p => p.productId !== id));
  const handleQuantityChange = (type, id, delta) => {
    if (type === 'service') {
      setCheckoutServices(prev => prev.map(s => s.serviceId === id ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s));
    } else {
      const p = products.find(prod => String(prod._id) === String(id));
      if (!p) return;
      setCheckoutProducts(prev => prev.map(item => {
        if (item.productId === id) {
          const newQty = item.quantity + delta;
          if (newQty > p.quantity) { addToast(`Only ${p.quantity} units of ${p.name} in stock.`, 'warning'); return item; }
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      }));
    }
  };

  // ── CHECKOUT ──
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (checkoutServices.length === 0 && checkoutProducts.length === 0) { addToast('Add at least one service or product.', 'warning'); return; }
    for (const item of checkoutProducts) {
      const p = products.find(prod => String(prod._id) === String(item.productId));
      if (p && item.quantity > p.quantity) { addToast(`Insufficient stock for ${p.name}.`, 'error'); return; }
    }
    setIsProcessing(true);
    try {
      const safeCustId = typeof selectedCustId === 'object' ? selectedCustId?._id : selectedCustId;
      const safeStaffId = typeof selectedStaffId === 'object' ? selectedStaffId?._id : selectedStaffId;
      const newInvoice = await createInvoice({
        customerId: safeCustId || null,
        services: checkoutServices,
        products: checkoutProducts,
        tax: Number(taxPercent),
        discount: Number(discountAmt),
        redeemPoints: actualPointsRedeemed,
        paymentMethod: payMethod,
        staffId: safeStaffId || null
      });
      if (newInvoice) {
        addToast(`Invoice ${newInvoice.invoiceNumber || 'INV'} generated!`, 'success');
        if (safeCustId) {
          const client = customers.find(c => String(c._id) === String(safeCustId));
          if (client) addNotification({ customerId: safeCustId, type: 'Billing', message: `Receipt ${newInvoice.invoiceNumber} generated. Total: ₹${finalAmount}.`, status: 'Sent' });
        }
        setSelectedCustId(''); setSelectedStaffId(''); setCheckoutServices([]); setCheckoutProducts([]); setDiscountAmt(0); setRedeemPoints(0);
        setSelectedInvoice(newInvoice);
      } else {
        addToast('Failed to generate invoice.', 'error');
      }
    } catch (err) { console.error(err); addToast('Checkout error.', 'error'); }
    finally { setIsProcessing(false); }
  };

  // ── PDF DOWNLOAD ──
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !selectedInvoice) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Invoice_${selectedInvoice.invoiceNumber}_${new Date().toLocaleDateString('en-CA')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(invoiceRef.current).save();
      addToast('Invoice PDF downloaded!', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      addToast('PDF download failed. Trying print...', 'warning');
      window.print();
    }
  };

  // ── PRINT ──
  const handlePrint = () => window.print();

  // ── WHATSAPP SHARE ──
  const handleWhatsApp = () => {
    if (!selectedInvoice) return;
    const client = getCustomerForInvoice(selectedInvoice);
    let phone = client?.phone?.replace(/\D/g, '') || '';
    if (phone.length === 10) phone = '91' + phone;
    const srvText = (selectedInvoice.services || []).map(s => `• ${s.name}: ₹${s.price * s.quantity}`).join('\n');
    const prodText = (selectedInvoice.products || []).length > 0
      ? '\n\n*Products:*\n' + selectedInvoice.products.map(p => `• ${p.name} (x${p.quantity}): ₹${p.price * p.quantity}`).join('\n')
      : '';
    const msg = `🧾 *Invoice #${selectedInvoice.invoiceNumber}*\n*${currentSalon?.name || 'SalonSync'}*\n${currentSalon?.gstNumber ? 'GSTIN: ' + currentSalon.gstNumber + '\n' : ''}\nDear ${client?.name || 'Guest'},\n\n*Services:*\n${srvText}${prodText}\n\nSubtotal: ₹${(selectedInvoice.services || []).reduce((s, i) => s + i.price * i.quantity, 0) + (selectedInvoice.products || []).reduce((s, i) => s + i.price * i.quantity, 0)}\nDiscount: -₹${selectedInvoice.discount}\nGST (${selectedInvoice.tax}%): ₹${Math.round(((selectedInvoice.services || []).reduce((s, i) => s + i.price * i.quantity, 0) + (selectedInvoice.products || []).reduce((s, i) => s + i.price * i.quantity, 0)) * selectedInvoice.tax / 100)}\n*Total Paid: ₹${selectedInvoice.finalAmount}*\nPayment: ${selectedInvoice.paymentMethod}\n\nThank you for your visit! 💇‍♀️`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    addToast('WhatsApp invoice shared!', 'success');
  };

  // ── EMAIL ──
  const handleEmail = () => {
    if (!selectedInvoice) return;
    const client = getCustomerForInvoice(selectedInvoice);
    const email = client?.email || '';
    const subject = `Invoice #${selectedInvoice.invoiceNumber} - ${currentSalon?.name || 'SalonSync'}`;
    const body = `Dear ${client?.name || 'Guest'},\n\nPlease find your invoice details below:\n\nInvoice Number: ${selectedInvoice.invoiceNumber}\nDate: ${formatDateTime(selectedInvoice.createdAt)}\nTotal Amount: ₹${selectedInvoice.finalAmount}\nPayment Method: ${selectedInvoice.paymentMethod}\n\nThank you for choosing ${currentSalon?.name || 'SalonSync'}!\n\nBest regards,\n${currentSalon?.name || 'SalonSync'}`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    addToast('Email client opened!', 'info');
  };

  // ── HISTORY STATS ──
  const historyStats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayInv = invoices.filter(i => new Date(i.createdAt) >= today);
    const todayRev = todayInv.reduce((s, i) => s + (i.finalAmount || 0), 0);
    const totalRev = invoices.reduce((s, i) => s + (i.finalAmount || 0), 0);
    const avgValue = invoices.length > 0 ? Math.round(totalRev / invoices.length) : 0;
    const upiCount = invoices.filter(i => i.paymentMethod === 'UPI').length;
    return { todayCount: todayInv.length, todayRev, totalRev, avgValue, total: invoices.length, upiCount };
  }, [invoices]);

  // ── FILTERED HISTORY ──
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const name = getInvoiceCustomerName(inv).toLowerCase();
        const num = (inv.invoiceNumber || '').toLowerCase();
        if (!name.includes(q) && !num.includes(q)) return false;
      }
      if (historyPayFilter !== 'ALL' && inv.paymentMethod !== historyPayFilter) return false;
      if (historyDateFrom) { const from = new Date(historyDateFrom); from.setHours(0, 0, 0, 0); if (new Date(inv.createdAt) < from) return false; }
      if (historyDateTo) { const to = new Date(historyDateTo); to.setHours(23, 59, 59, 999); if (new Date(inv.createdAt) > to) return false; }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [invoices, historySearch, historyPayFilter, historyDateFrom, historyDateTo]);

  // ════════════════════════════════════════════════════════════════════════════
  // JSX RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="page-container animated-fade-in billing-container">

      {/* ─── HEADER ───────────────────────────────────────── */}
      <div className="billing-hero">
        <div className="billing-hero-left">
          <h1>Enterprise Billing</h1>
          <p>POS checkout, professional invoicing, and complete billing history ledger</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', padding: '3px', borderRadius: '8px' }}>
          {[{ key: 'pos', label: 'POS Terminal', icon: <CreditCard size={14} /> }, { key: 'history', label: 'Invoice History', icon: <FileText size={14} /> }].map(tab => (
            <button key={tab.key} onClick={() => setActivePane(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', border: 'none',
              background: activePane === tab.key ? 'var(--gold-primary)' : 'transparent',
              color: activePane === tab.key ? '#000' : 'var(--text-secondary)',
              fontSize: '0.8rem', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '6px',
              transition: 'var(--transition-smooth)'
            }}>{tab.icon} {tab.label}</button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. POS CHECKOUT TERMINAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {activePane === 'pos' && (
        <form onSubmit={handleCheckoutSubmit} className="billing-pos-grid">
          {/* LEFT: Cart */}
          <div className="glass-card billing-cart-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} /> Sales Register Cart
            </h3>

            {/* Add Service */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <select className="form-control" style={{ flex: 1 }} value={tempSrvId} onChange={(e) => setTempSrvId(e.target.value)}>
                <option value="">-- Add Treatment Service --</option>
                {services.map(s => <option key={s._id} value={s._id}>{s.category ? `[${s.category}] ` : ''}{s.name} (₹{s.price})</option>)}
              </select>
              <button type="button" onClick={handleAddService} className="outline-btn" style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}><Plus size={14} /> Add</button>
            </div>

            {/* Add Product */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <select className="form-control" style={{ flex: 1 }} value={tempProdId} onChange={(e) => setTempProdId(e.target.value)}>
                <option value="">-- Add Retail Product --</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.sellingPrice} • Stock: {p.quantity})</option>)}
              </select>
              <button type="button" onClick={handleAddProduct} className="outline-btn" style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}><Plus size={14} /> Add</button>
            </div>

            {/* Items Table */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
              <table className="premium-table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th>Item</th>
                    <th>Rate</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th>Amount</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {checkoutServices.length === 0 && checkoutProducts.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      <ShoppingBag size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} /><br />
                      Cart is empty. Add services or products above.
                    </td></tr>
                  ) : (
                    <>
                      {checkoutServices.map(item => {
                        const s = services.find(srv => String(srv._id) === String(item.serviceId));
                        if (!s) return null;
                        return (
                          <tr key={item.serviceId}>
                            <td><span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>✂️ {s.name}</span><br /><span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.category || 'Service'}</span></td>
                            <td>₹{s.price}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                                <button type="button" onClick={() => handleQuantityChange('service', item.serviceId, -1)} className="billing-qty-btn">−</button>
                                <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                <button type="button" onClick={() => handleQuantityChange('service', item.serviceId, 1)} className="billing-qty-btn">+</button>
                              </div>
                            </td>
                            <td style={{ fontWeight: '600', color: 'var(--gold-primary)' }}>₹{(s.price * item.quantity).toLocaleString()}</td>
                            <td><button type="button" onClick={() => handleRemoveService(item.serviceId)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}><Trash2 size={15} /></button></td>
                          </tr>
                        );
                      })}
                      {checkoutProducts.map(item => {
                        const p = products.find(prod => String(prod._id) === String(item.productId));
                        if (!p) return null;
                        return (
                          <tr key={item.productId}>
                            <td><span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>🧴 {p.name}</span><br /><span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SKU: {p.sku || 'N/A'}</span></td>
                            <td>₹{p.sellingPrice}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                                <button type="button" onClick={() => handleQuantityChange('product', item.productId, -1)} className="billing-qty-btn">−</button>
                                <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                <button type="button" onClick={() => handleQuantityChange('product', item.productId, 1)} className="billing-qty-btn">+</button>
                              </div>
                            </td>
                            <td style={{ fontWeight: '600', color: 'var(--gold-primary)' }}>₹{(p.sellingPrice * item.quantity).toLocaleString()}</td>
                            <td><button type="button" onClick={() => handleRemoveProduct(item.productId)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}><Trash2 size={15} /></button></td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: Checkout Details */}
          <div className="glass-card billing-checkout-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={18} /> Checkout Details
            </h3>

            <div className="form-group">
              <label>Customer</label>
              <select className="form-control" value={selectedCustId} onChange={(e) => setSelectedCustId(e.target.value)}>
                <option value="">-- Guest Walk-in --</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Stylist</label>
              <select className="form-control" value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
                <option value="">-- Select Stylist --</option>
                {staff.map(s => <option key={s._id} value={s._id}>{s.name} ({s.commissionPercentage}%)</option>)}
              </select>
            </div>

            {/* Loyalty Point Redemption */}
            {selectedCustId && pointsAvailable > 0 && (
              <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', padding: '0.65rem 0.85rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.8rem', display: 'block' }}>🎁 Redeem Loyalty Points</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Available: {pointsAvailable} pts (1 pt = ₹1)</span>
                </div>
                <input type="number" min="0" max={pointsAvailable} className="form-control" style={{ width: '80px', padding: '0.2rem 0.4rem', fontSize: '0.85rem', textAlign: 'center' }} value={redeemPoints} onChange={(e) => setRedeemPoints(Math.min(pointsAvailable, Math.max(0, Number(e.target.value))))} />
              </div>
            )}

            {/* Bill Summary */}
            <div className="billing-summary-box">
              <div className="billing-sum-row"><span>Subtotal</span><span>₹{subTotal.toLocaleString()}</span></div>
              <div className="billing-sum-row">
                <span>GST (%)</span>
                <input type="number" className="form-control" style={{ width: '60px', padding: '0.2rem 0.4rem', fontSize: '0.8rem', textAlign: 'center' }} value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
              </div>
              <div className="billing-sum-row"><span>Tax Amount</span><span>₹{calculatedTax.toLocaleString()}</span></div>
              <div className="billing-sum-row">
                <span>Discount (₹)</span>
                <input type="number" className="form-control" style={{ width: '85px', padding: '0.2rem 0.4rem', fontSize: '0.8rem', textAlign: 'center' }} value={discountAmt} onChange={(e) => setDiscountAmt(e.target.value)} />
              </div>
              {actualPointsRedeemed > 0 && (
                <div className="billing-sum-row" style={{ color: 'var(--gold-primary)' }}>
                  <span>Points Redeemed</span>
                  <span>− ₹{actualPointsRedeemed}</span>
                </div>
              )}
              <div className="billing-sum-total">
                <span>Grand Total</span>
                <span>₹{finalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label>Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {['UPI', 'Cash', 'Card'].map(method => (
                  <button key={method} type="button" onClick={() => setPayMethod(method)} className={`billing-pay-btn ${payMethod === method ? 'active' : ''}`}>
                    {method === 'UPI' ? '📱' : method === 'Cash' ? '💵' : '💳'} {method}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isProcessing} className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.85rem' }}>
              {isProcessing ? (<><span className="btn-spinner"></span> Processing...</>) : (<><CreditCard size={16} /> Generate Invoice & Collect Payment</>)}
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          2. INVOICE HISTORY
         ═══════════════════════════════════════════════════════════════════════ */}
      {activePane === 'history' && (
        <div className="billing-history-section">
          {/* KPI Cards */}
          <div className="billing-kpi-grid">
            <div className="billing-kpi-card">
              <div className="billing-kpi-icon" style={{ background: 'rgba(112,130,56,0.12)', color: 'var(--gold-primary)' }}><Receipt size={20} /></div>
              <div><div className="billing-kpi-value">{historyStats.total}</div><div className="billing-kpi-label">Total Invoices</div></div>
            </div>
            <div className="billing-kpi-card">
              <div className="billing-kpi-icon" style={{ background: 'rgba(46,204,113,0.12)', color: '#2ecc71' }}><IndianRupee size={20} /></div>
              <div><div className="billing-kpi-value">₹{historyStats.totalRev.toLocaleString()}</div><div className="billing-kpi-label">Lifetime Revenue</div></div>
            </div>
            <div className="billing-kpi-card">
              <div className="billing-kpi-icon" style={{ background: 'rgba(52,152,219,0.12)', color: '#3498db' }}><TrendingUp size={20} /></div>
              <div><div className="billing-kpi-value">₹{historyStats.avgValue.toLocaleString()}</div><div className="billing-kpi-label">Avg Invoice Value</div></div>
            </div>
            <div className="billing-kpi-card">
              <div className="billing-kpi-icon" style={{ background: 'rgba(230,126,34,0.12)', color: '#e67e22' }}><ArrowUpRight size={20} /></div>
              <div><div className="billing-kpi-value">{historyStats.todayCount}</div><div className="billing-kpi-label">Today's Bills (₹{historyStats.todayRev.toLocaleString()})</div></div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
            <div className="billing-filter-row">
              <div className="billing-search-box">
                <Search size={15} style={{ color: 'var(--gold-primary)' }} />
                <input type="text" placeholder="Search invoice # or customer..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
                {historySearch && <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setHistorySearch('')} />}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="date" className="form-control" style={{ width: '140px', fontSize: '0.78rem', padding: '0.4rem 0.6rem' }} value={historyDateFrom} onChange={e => setHistoryDateFrom(e.target.value)} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>to</span>
                <input type="date" className="form-control" style={{ width: '140px', fontSize: '0.78rem', padding: '0.4rem 0.6rem' }} value={historyDateTo} onChange={e => setHistoryDateTo(e.target.value)} />
                <select className="form-control" style={{ width: '110px', fontSize: '0.78rem', padding: '0.4rem 0.6rem' }} value={historyPayFilter} onChange={e => setHistoryPayFilter(e.target.value)}>
                  <option value="ALL">All Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="premium-table billing-history-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No invoices match your search criteria.</td></tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr key={inv._id}>
                        <td>
                          <span style={{ color: 'var(--gold-primary)', fontWeight: '700', fontSize: '0.85rem' }}>{inv.invoiceNumber}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{getInvoiceCustomerName(inv)}</span>
                          <br /><span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{getStaffName(inv)}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(inv.createdAt)}</td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {(inv.services || []).length} svc, {(inv.products || []).length} prod
                          </span>
                        </td>
                        <td><span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>₹{inv.finalAmount?.toLocaleString()}</span></td>
                        <td>
                          <span className={`badge ${inv.paymentMethod === 'UPI' ? 'confirmed' : inv.paymentMethod === 'Card' ? 'pending' : 'completed'}`} style={{ fontSize: '0.72rem' }}>
                            {inv.paymentMethod}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => setSelectedInvoice(inv)} className="outline-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          INVOICE PREVIEW MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {selectedInvoice && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setSelectedInvoice(null); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content billing-invoice-modal">
            {/* Action Bar */}
            <div className="billing-invoice-actions">
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <FileText size={18} style={{ color: 'var(--gold-primary)' }} /> Invoice Preview
              </h3>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button onClick={handlePrint} className="billing-action-btn print-btn"><Printer size={14} /> Print</button>
                <button onClick={handleDownloadPDF} className="billing-action-btn pdf-btn"><Download size={14} /> PDF</button>
                <button onClick={handleWhatsApp} className="billing-action-btn wa-btn"><MessageSquare size={14} /> WhatsApp</button>
                <button onClick={handleEmail} className="billing-action-btn email-btn"><Mail size={14} /> Email</button>
                <button onClick={() => setSelectedInvoice(null)} className="billing-action-btn close-btn"><X size={14} /></button>
              </div>
            </div>

            {/* Invoice Template */}
            <div style={{ padding: '1.5rem', background: '#e8e8e8', borderRadius: '0 0 12px 12px' }}>
              <InvoiceTemplate
                ref={invoiceRef}
                invoice={selectedInvoice}
                customer={getCustomerForInvoice(selectedInvoice)}
                salon={currentSalon}
                branch={currentBranch}
                staffName={getStaffName(selectedInvoice)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 99999
        }}>
          <div style={{
            background: 'rgba(30,35,25,0.9)', border: '1px solid var(--gold-primary)',
            borderRadius: '12px', padding: '2.5rem', display: 'flex', flexDirection: 'column',
            alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', maxWidth: '400px', textAlign: 'center'
          }}>
            <svg className="animate-spin" style={{ width: '50px', height: '50px', marginBottom: '1.5rem', color: 'var(--gold-primary)' }} viewBox="0 0 24 24" fill="none">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '600' }}>Processing Payment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>Generating invoice and updating ledgers...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
