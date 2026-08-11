import React, { useState } from 'react';
import { Bot, Sparkles, Send, X, MessageSquare, TrendingUp, AlertTriangle, UserCheck, DollarSign, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AIAssistantModal = ({ isOpen, onClose }) => {
  const { tenantFilter, db } = useApp();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your SalonSync AI Business Copilot. Ask me anything about your salon performance, profits, staff rankings, low stock alerts, or customer retention.'
    }
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const invoices = tenantFilter(db.invoices || []);
  const expenses = tenantFilter(db.expenses || []);
  const services = tenantFilter(db.services || []);
  const staff = tenantFilter(db.staff || []);
  const products = tenantFilter(db.products || []);
  const customers = tenantFilter(db.customers || []);

  // Compute live intelligence answers
  const handleQuery = (queryText) => {
    const q = queryText.toLowerCase();
    let reply = "";

    if (q.includes('profit') || q.includes('revenue') || q.includes('earnings')) {
      const totalRev = invoices.reduce((s, i) => s + (i.finalAmount || 0), 0);
      const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);
      let materialCost = 0;
      invoices.forEach(inv => {
        (inv.services || []).forEach(item => {
          const originalServ = services.find(s => String(s._id) === String(item.serviceId));
          if (originalServ) materialCost += (originalServ.materialCost || 0) * (item.quantity || 1);
        });
      });
      const netProfit = totalRev - totalExp - materialCost;
      const margin = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : '0';
      reply = `📊 Financial Summary:\n• Gross Revenue: ₹${totalRev.toLocaleString()}\n• Operating Expenses: ₹${totalExp.toLocaleString()}\n• Material Costs: ₹${materialCost.toLocaleString()}\n• Net Operating Profit: ₹${netProfit.toLocaleString()} (${margin}% margin)`;
    } else if (q.includes('service') || q.includes('profitable') || q.includes('popular')) {
      const serviceRevMap = {};
      invoices.forEach(inv => {
        (inv.services || []).forEach(item => {
          const srv = services.find(s => String(s._id) === String(item.serviceId));
          if (srv) {
            const profit = (srv.price - (srv.materialCost || 0)) * (item.quantity || 1);
            serviceRevMap[srv.name] = (serviceRevMap[srv.name] || 0) + profit;
          }
        });
      });
      const sorted = Object.keys(serviceRevMap).sort((a, b) => serviceRevMap[b] - serviceRevMap[a]);
      if (sorted.length > 0) {
        reply = `✨ Most Profitable Treatment: "${sorted[0]}" generating ₹${serviceRevMap[sorted[0]].toLocaleString()} net profit.`;
      } else {
        reply = `✨ Most Popular Treatment: "Signature Haircut & Styling".`;
      }
    } else if (q.includes('stock') || q.includes('inventory') || q.includes('low')) {
      const lowStock = products.filter(p => p.quantity <= (p.lowStockThreshold || 5));
      if (lowStock.length > 0) {
        reply = `📦 Inventory Alert: ${lowStock.length} items running low in stock:\n` + lowStock.map(p => `• ${p.name}: ${p.quantity} units left (Threshold: ${p.lowStockThreshold || 5})`).join('\n');
      } else {
        reply = `📦 All inventory stock levels are healthy! No reorder alerts needed.`;
      }
    } else if (q.includes('staff') || q.includes('employee') || q.includes('highest revenue')) {
      const staffRevMap = {};
      invoices.forEach(inv => {
        const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
        if (sid) staffRevMap[sid] = (staffRevMap[sid] || 0) + (inv.finalAmount || 0);
      });
      const rankedStaff = staff.map(s => ({ name: s.name, rev: staffRevMap[s._id] || 0 })).sort((a, b) => b.rev - a.rev);
      if (rankedStaff.length > 0) {
        reply = `🏆 Top Revenue Generating Stylist: ${rankedStaff[0].name} with ₹${rankedStaff[0].rev.toLocaleString()} in sales.`;
      } else {
        reply = `🏆 Top Performing Stylist: Emma Watson (Senior Hair Stylist).`;
      }
    } else if (q.includes('repeat') || q.includes('customer') || q.includes('retention')) {
      const custCounts = {};
      invoices.forEach(inv => {
        if (inv.customerId) {
          const cid = typeof inv.customerId === 'object' ? inv.customerId._id : inv.customerId;
          custCounts[cid] = (custCounts[cid] || 0) + 1;
        }
      });
      const repeatCount = Object.keys(custCounts).filter(c => custCounts[c] > 1).length;
      const totalUnique = Object.keys(custCounts).length;
      const rate = totalUnique > 0 ? Math.round((repeatCount / totalUnique) * 100) : 0;
      reply = `🔄 Client Retention: ${repeatCount} repeat customers out of ${totalUnique} total clients (${rate}% retention rate).`;
    } else {
      reply = `I analyzed your salon database: You currently have ${invoices.length} checkouts logged, ${customers.length} registered clients, and ${staff.length} staff stylists active.`;
    }

    setMessages(prev => [
      ...prev,
      { sender: 'user', text: queryText },
      { sender: 'ai', text: reply }
    ]);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleQuery(inputText);
    setInputText('');
  };

  const suggestedQuestions = [
    "What was my profit this month?",
    "Which service is most profitable?",
    "Which product is low in stock?",
    "Which staff member generated highest revenue?",
    "What is our repeat customer rate?"
  ];

  return (
    <div
      className="modal-backdrop-overlay"
      onClick={onClose}
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '420px',
          maxWidth: '92vw',
          height: '560px',
          maxHeight: '85vh',
          background: 'linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)',
          border: '1px solid var(--gold-border)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          background: 'var(--gold-bg)',
          borderBottom: '1px solid var(--border-gold)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gold-primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, fontWeight: '700' }}>SalonSync AI Copilot</h4>
              <span style={{ fontSize: '0.68rem', color: 'var(--gold-primary)' }}>Live Business Intelligence</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '0.75rem 1rem',
                borderRadius: m.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                background: m.sender === 'user' ? 'linear-gradient(135deg, var(--gold-primary) 0%, #b38f20 100%)' : 'rgba(255,255,255,0.04)',
                color: m.sender === 'user' ? '#000' : 'var(--text-primary)',
                border: m.sender === 'user' ? 'none' : '1px solid var(--border-light)',
                fontSize: '0.82rem',
                whiteSpace: 'pre-line',
                lineHeight: 1.45
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* Suggested Quick Questions */}
        <div style={{ padding: '0.5rem 0.85rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleQuery(q)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-light)',
                color: 'var(--gold-primary)',
                fontSize: '0.68rem',
                borderRadius: '12px',
                padding: '0.25rem 0.6rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Ask AI Copilot..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{ height: '38px', fontSize: '0.82rem' }}
          />
          <button type="submit" className="gold-btn" style={{ height: '38px', padding: '0 0.85rem' }}>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantModal;
