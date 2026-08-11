import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Mail, Bell, Sparkles, Send, Play, Layers, X,
  CheckCircle2, Edit3, RefreshCw, Settings, User, Clock, Calendar,
  Gift, Heart, Receipt, RotateCcw, ThumbsUp, AlertCircle, Copy,
  Check, Phone, Eye, Zap, Sliders, ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT AUTOMATION TEMPLATES (ALL 8 MANDATORY TYPES)
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_TEMPLATES = [
  {
    id: 'appt_confirm',
    name: 'Appointment Confirmation',
    category: 'Booking',
    icon: 'Calendar',
    color: '#3498db',
    enabled: true,
    desc: 'Automatically sent immediately when a client books an appointment.',
    variables: ['{customer_name}', '{salon_name}', '{service_name}', '{date}', '{time}', '{stylist_name}'],
    template: `Hello {customer_name}! 💇‍♀️\n\nYour appointment at *{salon_name}* for *{service_name}* with *{stylist_name}* is confirmed for *{date} at {time}*.\n\nWe look forward to giving you a wonderful experience! Need to reschedule? Reply to this message.`
  },
  {
    id: 'appt_rem',
    name: 'Appointment Reminder',
    category: 'Booking',
    icon: 'Clock',
    color: '#e67e22',
    enabled: true,
    desc: 'Automatically sent 2 hours before the scheduled appointment slot.',
    variables: ['{customer_name}', '{salon_name}', '{service_name}', '{time}'],
    template: `Reminder ⏰ Hi {customer_name}! Your *{service_name}* appointment at *{salon_name}* is today at *{time}*.\n\nPlease arrive 5 minutes early. Reply if you need directions or assistance.`
  },
  {
    id: 'birthday',
    name: 'Birthday Wishes',
    category: 'Celebration',
    icon: 'Gift',
    color: '#e74c3c',
    enabled: true,
    desc: 'Automatically sent at 9:00 AM on the client’s birthday.',
    variables: ['{customer_name}', '{salon_name}', '{discount_code}', '{expiry_date}'],
    template: `Happy Birthday {customer_name}! 🎉🎂\n\nEveryone at *{salon_name}* wishes you a joyful day! Enjoy a special birthday gift from us: *25% OFF* any pampering treatment using code *{discount_code}* (valid till {expiry_date}).\n\nBook your birthday glow-up today!`
  },
  {
    id: 'anniversary',
    name: 'Anniversary Wishes',
    category: 'Celebration',
    icon: 'Heart',
    color: '#9b59b6',
    enabled: true,
    desc: 'Automatically sent on client’s wedding or client anniversary date.',
    variables: ['{customer_name}', '{salon_name}', '{discount_code}'],
    template: `Happy Anniversary {customer_name}! 💕🥂\n\nCelebrate your special milestone with a relaxing salon day at *{salon_name}*. Enjoy a complimentary Hair Spa or Express Facial with any booking today. Use code *{discount_code}*!`
  },
  {
    id: 'invoice',
    name: 'Invoice Summary',
    category: 'Billing',
    icon: 'Receipt',
    color: '#2ecc71',
    enabled: true,
    desc: 'Automatically sent right after payment receipt is generated.',
    variables: ['{customer_name}', '{salon_name}', '{invoice_number}', '{amount}', '{points}'],
    template: `Receipt 🧾 Thank you for visiting *{salon_name}*, {customer_name}!\n\nInvoice No: *{invoice_number}*\nTotal Amount Paid: *₹{amount}*\nLoyalty Points Earned: *+{points} pts*\n\nHope to see you again soon!`
  },
  {
    id: 'renewal',
    name: 'Membership Renewal',
    category: 'Loyalty',
    icon: 'RotateCcw',
    color: '#f39c12',
    enabled: true,
    desc: 'Sent 7 days before client membership validity or loyalty tier expires.',
    variables: ['{customer_name}', '{salon_name}', '{membership_tier}', '{expiry_date}'],
    template: `Hi {customer_name}! Your *{membership_tier} Club* membership at *{salon_name}* is expiring on *{expiry_date}*.\n\nRenew today to maintain your exclusive 15% discount on all premium treatments and priority booking slots!`
  },
  {
    id: 'revisit',
    name: 'Revisit Reminder',
    category: 'Retention',
    icon: 'RefreshCw',
    color: '#1abc9c',
    enabled: true,
    desc: 'Sent when a client has not visited the salon for 30+ days.',
    variables: ['{customer_name}', '{salon_name}', '{last_service}', '{discount_code}'],
    template: `We miss you, {customer_name}! 💇✨\n\nIt’s been over a month since your last *{last_service}* at *{salon_name}*. Time for a touch-up!\n\nUse code *WELCOMEBACK* for 15% off when you book this week.`
  },
  {
    id: 'thank_you',
    name: 'Thank You Message',
    category: 'Feedback',
    icon: 'ThumbsUp',
    color: '#708238',
    enabled: true,
    desc: 'Sent 1 hour after checkout thanking the client and asking for a review.',
    variables: ['{customer_name}', '{salon_name}', '{review_link}'],
    template: `Thank you for visiting *{salon_name}*, {customer_name}! 🌟\n\nWe hope you loved your treatment today. Could you take 30 seconds to share your feedback or leave us a review?\n\n{review_link}`
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MARKETING & WHATSAPP AUTOMATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const Marketing = () => {
  const { tenantFilter, db, addNotification, addToast, currentSalon } = useApp();

  const notifications = tenantFilter(db.notifications);
  const customers = tenantFilter(db.customers);

  const [activeTab, setActiveTab] = useState('automations'); // 'automations', 'editor', 'history'
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('sf_wa_templates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_TEMPLATES; }
    }
    return DEFAULT_TEMPLATES;
  });

  // Editor modal & selection state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [copiedVar, setCopiedVar] = useState('');

  // Live Test Trigger Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTemplate, setTestTemplate] = useState(null);
  const [testCustomerId, setTestCustomerId] = useState('');

  // Instant Broadcast Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('All Customers');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Save templates to localStorage
  useEffect(() => {
    localStorage.setItem('sf_wa_templates', JSON.stringify(templates));
  }, [templates]);

  // Toggle trigger enable/disable
  const toggleTemplate = (id) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.enabled;
        addToast(`${t.name} automation ${nextState ? 'enabled' : 'disabled'}`, nextState ? 'success' : 'info');
        return { ...t, enabled: nextState };
      }
      return t;
    }));
  };

  // Open Template Customizer
  const handleOpenEdit = (tmpl) => {
    setSelectedTemplate(tmpl);
    setEditedContent(tmpl.template);
  };

  // Save Template Changes
  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? { ...t, template: editedContent } : t));
    addToast(`Template "${selectedTemplate.name}" updated successfully!`, 'success');
    setSelectedTemplate(null);
  };

  // Reset to Factory Default Template
  const handleResetDefault = (id) => {
    const orig = DEFAULT_TEMPLATES.find(d => d.id === id);
    if (orig) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, template: orig.template } : t));
      if (selectedTemplate && selectedTemplate.id === id) setEditedContent(orig.template);
      addToast('Reset to default template text', 'info');
    }
  };

  // Insert Variable into Editor
  const insertVariable = (varName) => {
    setEditedContent(prev => prev + ' ' + varName);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(''), 1500);
  };

  // Render merged preview text
  const getMergedPreview = (tmplText, custObj) => {
    const cName = custObj?.name || 'Ananya Sharma';
    const sName = currentSalon?.name || 'SalonSync Luxe Spa';
    return tmplText
      .replace(/{customer_name}/g, cName)
      .replace(/{salon_name}/g, sName)
      .replace(/{service_name}/g, 'Global Balayage & Hair Spa')
      .replace(/{date}/g, '15 Aug 2026')
      .replace(/{time}/g, '03:30 PM')
      .replace(/{stylist_name}/g, 'Rahul Verma')
      .replace(/{invoice_number}/g, 'INV-2026-0042')
      .replace(/{amount}/g, '2,450')
      .replace(/{points}/g, '24')
      .replace(/{membership_tier}/g, custObj?.membershipLevel || 'Gold')
      .replace(/{expiry_date}/g, '31 Aug 2026')
      .replace(/{discount_code}/g, 'BDAYGLOW25')
      .replace(/{last_service}/g, 'Deep Tissue Massage')
      .replace(/{review_link}/g, 'https://g.page/r/salonsync-review');
  };

  // Trigger Sample Test WhatsApp Message
  const handleSendTestWhatsApp = () => {
    if (!testTemplate) return;
    const targetCust = customers.find(c => String(c._id) === String(testCustomerId)) || customers[0];
    const phone = targetCust?.phone?.replace(/\D/g, '') || '';
    const formattedPhone = phone.length === 10 ? '91' + phone : phone;
    const msgText = getMergedPreview(testTemplate.template, targetCust);

    // Record in history log
    addNotification({
      customerId: targetCust?._id || null,
      type: 'WhatsApp',
      message: `[Automated: ${testTemplate.name}] ${msgText}`,
      status: 'Sent'
    });

    addToast(`Automated WhatsApp dispatched for ${testTemplate.name}!`, 'success');
    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msgText)}`, '_blank');
    }
    setShowTestModal(false);
  };

  // Broadcast Campaign Submission
  const handleDispatchBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      addToast('Please enter broadcast title and message body', 'warning');
      return;
    }
    setIsDispatching(true);
    let targetClients = customers;
    if (broadcastTarget === 'Platinum Tiers') {
      targetClients = customers.filter(c => c.membershipLevel === 'Platinum');
    }
    targetClients.forEach(c => {
      addNotification({
        customerId: c._id,
        type: 'WhatsApp',
        message: broadcastMessage.replace(/{customer_name}/g, c.name).replace(/{salon_name}/g, currentSalon?.name || 'SalonSync')
      });
    });
    addToast(`Broadcast dispatched! Sent WhatsApp message to ${targetClients.length} clients.`, 'success');
    setIsDispatching(false);
    setShowBroadcastModal(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  return (
    <div className="page-container animated-fade-in wa-container">
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquare size={24} style={{ color: '#25D366' }} /> WhatsApp Automation Hub
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Automate booking confirmations, birthday greetings, invoice receipts, and revisit reminders.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.25rem', borderRadius: '8px' }}>
          {[
            { id: 'automations', label: 'Automated Triggers (8)', icon: Zap },
            { id: 'editor', label: 'Customize Templates', icon: Edit3 },
            { id: 'history', label: 'WhatsApp Dispatch Logs', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none',
                background: activeTab === tab.id ? 'var(--gold-primary)' : 'transparent',
                color: activeTab === tab.id ? '#000' : 'var(--text-secondary)',
                fontSize: '0.78rem', fontWeight: '600', padding: '0.4rem 0.85rem', borderRadius: '6px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: AUTOMATED TRIGGERS GRID (ALL 8 MANDATORY TYPES)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'automations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top Banner & Quick Broadcast Button */}
          <div className="glass-card gold-border" style={{ background: 'var(--gold-bg)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-primary)', margin: 0 }}>8 Automated WhatsApp Triggers Active</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>All messages merge client details dynamically and can be customized by salon owners.</p>
              </div>
            </div>
            <button onClick={() => setShowBroadcastModal(true)} className="gold-btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.82rem' }}>
              <Send size={15} /> Instant WhatsApp Broadcast
            </button>
          </div>

          {/* 8 Triggers Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {templates.map(tmpl => (
              <div key={tmpl.id} className="glass-card" style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                borderLeft: `4px solid ${tmpl.color}`, padding: '1.25rem', transition: 'var(--transition-smooth)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: tmpl.color, fontWeight: '700', background: `${tmpl.color}15`, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {tmpl.category}
                      </span>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleTemplate(tmpl.id)}
                      style={{
                        width: '42px', height: '22px', borderRadius: '11px',
                        background: tmpl.enabled ? '#25D366' : '#444',
                        border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{
                        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: '3px', left: tmpl.enabled ? '23px' : '3px', transition: 'all 0.2s ease'
                      }} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: '600' }}>{tmpl.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>{tmpl.desc}</p>

                  {/* Message Box Preview */}
                  <div style={{
                    background: '#0b141a', color: '#e9edef', padding: '0.85rem', borderRadius: '8px',
                    fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.4',
                    border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem', maxHeight: '100px', overflowY: 'auto'
                  }}>
                    {tmpl.template}
                  </div>
                </div>

                {/* Actions Bar */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => handleOpenEdit(tmpl)}
                    className="outline-btn"
                    style={{ flex: 1, justifyContent: 'center', padding: '0.4rem', fontSize: '0.75rem' }}
                  >
                    <Edit3 size={13} /> Customize Text
                  </button>
                  <button
                    onClick={() => { setTestTemplate(tmpl); setShowTestModal(true); }}
                    style={{
                      background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid #25D366',
                      borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: '600',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Send size={13} /> Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: NOTIFICATION TEMPLATES EDITOR
         ═══════════════════════════════════════════════════════════════════════ */}
      {(activeTab === 'editor' || selectedTemplate) && (
        <div className="grid-split-2-1" style={{ alignItems: 'start' }}>
          
          {/* Template Selection List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={16} /> Select Template to Edit
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => handleOpenEdit(t)}
                  style={{
                    padding: '0.85rem 1rem', borderRadius: '8px',
                    border: '1px solid',
                    borderColor: selectedTemplate?.id === t.id ? 'var(--gold-primary)' : 'var(--border-light)',
                    background: selectedTemplate?.id === t.id ? 'var(--gold-bg)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>{t.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.category} • {t.variables.length} tags</span>
                  </div>
                  <span className={`badge ${t.enabled ? 'confirmed' : 'cancelled'}`} style={{ fontSize: '0.68rem' }}>
                    {t.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Workspace */}
          {selectedTemplate ? (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>{selectedTemplate.name} Template</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>Category: {selectedTemplate.category}</p>
                </div>
                <button type="button" onClick={() => handleResetDefault(selectedTemplate.id)} className="outline-btn" style={{ fontSize: '0.72rem', padding: '0.35rem 0.6rem' }}>
                  <RotateCcw size={12} /> Reset Default
                </button>
              </div>

              <form onSubmit={handleSaveTemplate}>
                {/* Available Insertable Variables */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                    Insert Dynamic Variables (Click to append):
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {selectedTemplate.variables.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        style={{
                          background: copiedVar === v ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)',
                          color: copiedVar === v ? '#000' : 'var(--gold-primary)',
                          border: '1px solid var(--gold-border)', borderRadius: '4px',
                          padding: '0.25rem 0.5rem', fontSize: '0.72rem', fontFamily: 'monospace',
                          cursor: 'pointer', transition: 'var(--transition-smooth)'
                        }}
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea Editor */}
                <div className="form-group">
                  <label>WhatsApp Message Template Content *</label>
                  <textarea
                    required
                    rows="7"
                    className="form-control"
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5' }}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Supports WhatsApp formatting: <code>*bold*</code>, <code>_italic_</code>, <code>~strikethrough~</code>.
                  </p>
                </div>

                {/* Live Preview Box */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <Eye size={14} /> Live Merged WhatsApp Preview:
                  </label>
                  <div style={{
                    background: '#0b141a', color: '#e9edef', padding: '1rem', borderRadius: '8px',
                    border: '1px solid #1f2c34', fontSize: '0.82rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'
                  }}>
                    {getMergedPreview(editedContent, customers[0])}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="gold-btn" style={{ flex: 1, justifyContent: 'center' }}>
                    <Check size={16} /> Save Customized Template
                  </button>
                  <button type="button" onClick={() => setSelectedTemplate(null)} className="outline-btn">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <Edit3 size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.9rem' }}>Click any template on the left to edit its text & variables.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: DISPATCH & ACTIVITY HISTORY LOG
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Type</th>
                  <th>WhatsApp Message Delivered</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No WhatsApp logs dispatch recorded yet.</td></tr>
                ) : (
                  notifications.map(notif => {
                    const client = db.customers.find(c => String(c._id) === String(notif.customerId));
                    return (
                      <tr key={notif._id}>
                        <td>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{client ? client.name : 'Broadcast All'}</span>
                          {client?.phone && <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{client.phone}</span>}
                        </td>
                        <td><span className="badge confirmed" style={{ fontSize: '0.7rem' }}>{notif.type || 'WhatsApp'}</span></td>
                        <td style={{ maxWidth: '400px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {notif.message}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {notif.sentAt ? new Date(notif.sentAt).toLocaleString() : new Date().toLocaleString()}
                        </td>
                        <td><span className="badge completed" style={{ fontSize: '0.7rem' }}>Delivered</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TEST WHATSAPP TRIGGER MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {showTestModal && testTemplate && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowTestModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '480px', background: 'var(--bg-secondary)', border: '1px solid #25D366', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Send size={18} style={{ color: '#25D366' }} /> Test Automation Trigger
              </h3>
              <button onClick={() => setShowTestModal(false)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label>Select Sample Customer for Merge Tags</label>
              <select className="form-control" value={testCustomerId} onChange={e => setTestCustomerId(e.target.value)}>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '600', marginBottom: '0.35rem', display: 'block' }}>Preview Merged WhatsApp Output:</label>
              <div style={{ background: '#0b141a', color: '#e9edef', padding: '0.85rem', borderRadius: '8px', fontSize: '0.8rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {getMergedPreview(testTemplate.template, customers.find(c => String(c._id) === String(testCustomerId)) || customers[0])}
              </div>
            </div>

            <button onClick={handleSendTestWhatsApp} className="gold-btn" style={{ width: '100%', justifyContent: 'center', background: '#25D366', color: '#fff', border: 'none' }}>
              <ExternalLink size={15} /> Send WhatsApp Preview Now
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          INSTANT PROMO BROADCAST MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {showBroadcastModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowBroadcastModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Launch Promo Broadcast</h3>
              <button onClick={() => setShowBroadcastModal(false)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleDispatchBroadcast}>
              <div className="form-group">
                <label>Campaign Name *</label>
                <input type="text" required placeholder="Festive Spa Discount" className="form-control" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Target Segment</label>
                <select className="form-control" value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}>
                  <option value="All Customers">All Customers ({customers.length})</option>
                  <option value="Platinum Tiers">Platinum Members Only</option>
                </select>
              </div>

              <div className="form-group">
                <label>Broadcast Message *</label>
                <textarea
                  required
                  rows="4"
                  className="form-control"
                  placeholder="Hello {customer_name}! Enjoy 20% off at {salon_name} this weekend."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                />
              </div>

              <button type="submit" disabled={isDispatching} className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                {isDispatching ? 'Dispatching...' : '🚀 Dispatch Broadcast via WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Marketing;
