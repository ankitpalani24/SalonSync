import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, Send, Settings, Sliders, CheckCircle2, AlertCircle, 
  Clock, ShieldAlert, Key, Globe, Plus, Check, X, RefreshCw, Eye, 
  Smartphone, Edit2, Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const WhatsAppHub = () => {
  const { 
    currentUser, tenantFilter, db, 
    updateWhatsAppConfig, updateWhatsAppTemplates, toggleWhatsAppTrigger, 
    dispatchWhatsAppMessage, addToast, hasPermission, PERMISSIONS 
  } = useApp();

  const config = db.whatsAppConfig || {
    provider: 'Unconfigured',
    apiKey: '',
    phoneNumberId: '',
    webhookSecret: '',
    enabledTriggers: {}
  };

  const templates = db.whatsAppTemplates || {};
  const outboxList = (db.notifications || []).filter(n => n.type === 'WhatsApp');
  const customersList = tenantFilter(db.customers || []);

  // Tabs: 'outbox', 'templates', 'triggers', 'provider'
  const [activeTab, setActiveTab] = useState('outbox');

  // Active Selected Template for Editing
  const [activeTemplateKey, setActiveTemplateKey] = useState('Confirmation');

  // Test Dispatch Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testCustomerId, setTestCustomerId] = useState(customersList[0]?._id || '');
  const [testPhone, setTestPhone] = useState('+91 98765 43210');
  const [testTriggerType, setTestTriggerType] = useState('Confirmation');

  // Provider Settings Form State
  const [providerChoice, setProviderChoice] = useState(config.provider || 'Unconfigured');
  const [apiKeyInput, setApiKeyInput] = useState(config.apiKey || '');
  const [phoneIdInput, setPhoneIdInput] = useState(config.phoneNumberId || '');
  const [webhookInput, setWebhookInput] = useState(config.webhookSecret || '');

  // 11 Supported Triggers Configuration
  const triggerList = [
    { key: 'Confirmation', label: 'Appointment Confirmation', desc: 'Sent instantly when an appointment is booked.' },
    { key: 'Reminder', label: 'Appointment Reminder', desc: 'Sent 2 hours before the scheduled appointment.' },
    { key: 'Cancellation', label: 'Appointment Cancellation', desc: 'Sent when an appointment is cancelled.' },
    { key: 'Rescheduled', label: 'Appointment Rescheduling', desc: 'Sent when appointment time or date is updated.' },
    { key: 'Invoice', label: 'Invoice / Digital Bill', desc: 'Sent when a checkout billing invoice is generated.' },
    { key: 'Payment', label: 'Payment Confirmation', desc: 'Sent upon successful payment receipt.' },
    { key: 'Birthday', label: 'Birthday Greeting', desc: 'Sent on customer birthday with celebratory offer.' },
    { key: 'MembershipExpiry', label: 'Membership Expiry Warning', desc: 'Sent 30 days prior to tier pass expiration.' },
    { key: 'Loyalty', label: 'Loyalty Rewards Notification', desc: 'Sent when points are earned or redeemed.' },
    { key: 'Revisit', label: 'Revisit Reminder', desc: 'Sent to inactive customers missing for 45+ days.' },
    { key: 'Promo', label: 'Promotional Offers & Vouchers', desc: 'Broadcasted for seasonal salon discounts.' }
  ];

  // Live Template Text & Substitution Preview
  const currentTemplateText = templates[activeTemplateKey] || '';
  const [editedTemplateText, setEditedTemplateText] = useState(currentTemplateText);

  // Synchronize when changing active template key
  const handleSelectTemplateKey = (key) => {
    setActiveTemplateKey(key);
    setEditedTemplateText(templates[key] || '');
  };

  // Substitute variables for Live Chat Preview
  const livePreviewText = useMemo(() => {
    let txt = editedTemplateText || templates[activeTemplateKey] || '';
    const sampleVars = {
      customerName: 'Priyanka Chopra',
      salonName: currentUser?.salonName || 'Luxe & Gold Salon',
      appointmentDate: '24th June 2026',
      appointmentTime: '10:30 AM',
      serviceName: '24K Gold Luxury Facial',
      staffName: 'Emma Watson',
      invoiceNumber: 'INV-2026-0001',
      invoiceAmount: '₹3,630',
      amountPaid: '₹3,630',
      paymentMethod: 'UPI',
      pointsEarned: '363',
      loyaltyBalance: '512',
      membershipTier: 'Platinum Pass',
      discountPercentage: '20',
      expiryDate: '31st Dec 2026'
    };

    Object.keys(sampleVars).forEach(k => {
      const regex = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
      txt = txt.replace(regex, sampleVars[k]);
    });

    return txt;
  }, [editedTemplateText, activeTemplateKey, templates]);

  // Insert Placeholder Chip into Textarea
  const insertPlaceholder = (tag) => {
    setEditedTemplateText(prev => prev + ` {{${tag}}}`);
  };

  // Save Template Text
  const handleSaveTemplate = async () => {
    const updated = {
      ...templates,
      [activeTemplateKey]: editedTemplateText
    };
    await updateWhatsAppTemplates(updated);
  };

  // Save Provider Config Form
  const handleSaveProviderConfig = async (e) => {
    e.preventDefault();
    await updateWhatsAppConfig({
      provider: providerChoice,
      apiKey: apiKeyInput,
      phoneNumberId: phoneIdInput,
      webhookSecret: webhookInput
    });
  };

  // Handle Test Dispatch Submit
  const handleTestDispatchSubmit = async (e) => {
    e.preventDefault();
    const cust = customersList.find(c => String(c._id) === String(testCustomerId));

    await dispatchWhatsAppMessage({
      customerId: testCustomerId,
      phone: testPhone,
      customerName: cust ? cust.name : 'Test Recipient',
      triggerType: testTriggerType
    });

    setShowTestModal(false);
  };

  return (
    <div className="page-container animated-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>WhatsApp Communication System</h1>
            <span style={{ 
              background: 'rgba(37, 211, 102, 0.15)', 
              color: '#25D366', 
              border: '1px solid rgba(37, 211, 102, 0.4)', 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              padding: '0.2rem 0.55rem', 
              borderRadius: '12px' 
            }}>
              META & TWILIO COMPATIBLE
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Customizable WhatsApp templates, automated customer triggers, and decoupled API gateway adapter.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', padding: '0.25rem', borderRadius: '6px' }}>
          <button 
            onClick={() => setActiveTab('outbox')} 
            style={{ 
              border: 'none', 
              background: activeTab === 'outbox' ? 'var(--gold-primary)' : 'transparent', 
              color: activeTab === 'outbox' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <MessageSquare size={14} /> Outbox Ledger
          </button>
          <button 
            onClick={() => setActiveTab('templates')} 
            style={{ 
              border: 'none', 
              background: activeTab === 'templates' ? 'var(--gold-primary)' : 'transparent', 
              color: activeTab === 'templates' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Edit2 size={14} /> Message Templates (11)
          </button>
          <button 
            onClick={() => setActiveTab('triggers')} 
            style={{ 
              border: 'none', 
              background: activeTab === 'triggers' ? 'var(--gold-primary)' : 'transparent', 
              color: activeTab === 'triggers' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Sliders size={14} /> Auto Triggers
          </button>
          <button 
            onClick={() => setActiveTab('provider')} 
            style={{ 
              border: 'none', 
              background: activeTab === 'provider' ? 'var(--gold-primary)' : 'transparent', 
              color: activeTab === 'provider' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Key size={14} /> Provider Gateway
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. OUTBOX LEDGER & DISPATCHER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'outbox' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>WhatsApp Message Outbox Ledger</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit history of dispatched and queued WhatsApp notifications.</p>
            </div>

            <button onClick={() => setShowTestModal(true)} className="gold-btn" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}>
              <Send size={15} /> Dispatch Test Message
            </button>
          </div>

          <div className="glass-card">
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Phone</th>
                    <th>Trigger Type</th>
                    <th>Provider</th>
                    <th>Delivery Status</th>
                    <th>Sent At</th>
                    <th>Message Text Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {outboxList.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No WhatsApp messages dispatched yet.</td></tr>
                  ) : (
                    outboxList.map(item => (
                      <tr key={item._id}>
                        <td><strong style={{ color: 'var(--text-primary)' }}>{item.customerName || 'Client'}</strong></td>
                        <td style={{ fontSize: '0.78rem' }}>{item.customerPhone || '+91 98765 43210'}</td>
                        <td>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 'bold', background: 'rgba(37, 211, 102, 0.15)', color: '#25D366' }}>
                            {item.triggerType || 'General'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.providerUsed || config.provider}</td>
                        <td>
                          <span style={{
                            padding: '0.15rem 0.55rem',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 'bold',
                            background: item.status === 'Sent' ? 'rgba(46, 204, 113, 0.15)' : item.status === 'Provider Required' ? 'rgba(241, 196, 15, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                            color: item.status === 'Sent' ? 'var(--accent-green)' : item.status === 'Provider Required' ? '#f1c40f' : 'var(--accent-red)'
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(item.sentAt || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.message}
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. TEMPLATE EDITOR (11 CUSTOMIZABLE TEMPLATES) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
          
          {/* Template Selector List */}
          <div className="glass-card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.75rem' }}>Select Trigger Template (11)</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {triggerList.map(t => {
                const active = activeTemplateKey === t.key;
                const enabled = config.enabledTriggers ? config.enabledTriggers[t.key] !== false : true;

                return (
                  <button
                    key={t.key}
                    onClick={() => handleSelectTemplateKey(t.key)}
                    style={{
                      border: active ? '1px solid var(--gold-border)' : '1px solid transparent',
                      background: active ? 'var(--gold-bg)' : 'rgba(255,255,255,0.02)',
                      color: active ? 'var(--gold-primary)' : 'var(--text-secondary)',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      textAlign: 'left',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{t.label}</span>
                    <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: enabled ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: enabled ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {enabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor & Live Preview Column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
            
            {/* Editor Textarea */}
            <div className="glass-card">
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Editing: {activeTemplateKey} Template</h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Customize message text and insert dynamic variable placeholders.</p>
                </div>

                <button onClick={handleSaveTemplate} className="gold-btn" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}>
                  Save Template
                </button>
              </div>

              {/* Placeholder Insert Chips */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>Insert Placeholder Variables:</span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {['customerName', 'salonName', 'appointmentDate', 'appointmentTime', 'serviceName', 'staffName', 'invoiceAmount', 'loyaltyBalance', 'membershipTier', 'expiryDate'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => insertPlaceholder(tag)}
                      style={{
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid var(--gold-border)',
                        color: 'var(--gold-primary)',
                        fontSize: '0.68rem',
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      + {`{{${tag}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <textarea 
                  rows="8" 
                  className="form-control" 
                  style={{ fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.5 }}
                  value={editedTemplateText} 
                  onChange={(e) => setEditedTemplateText(e.target.value)} 
                />
              </div>
            </div>

            {/* Live WhatsApp Chat Bubble Preview */}
            <div className="glass-card" style={{ background: '#0b141a', border: '1px solid #222d34', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid #222d34', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#25D366' }}>
                <Smartphone size={16} />
                <h4 style={{ fontSize: '0.82rem', fontWeight: '600' }}>WhatsApp Chat Preview</h4>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', pt: '1rem' }}>
                <div style={{
                  background: '#005c4b',
                  color: '#e9edef',
                  padding: '0.85rem 1rem',
                  borderRadius: '0px 12px 12px 12px',
                  fontSize: '0.78rem',
                  lineHeight: 1.5,
                  maxWidth: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {livePreviewText}
                  <div style={{ textAlign: 'right', fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.3rem' }}>
                    10:30 AM ✓✓
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. AUTOMATED NOTIFICATION TRIGGER RULES */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'triggers' && (
        <div className="glass-card" style={{ maxWidth: '700px' }}>
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>Automated Trigger Toggles</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enable or disable specific automated WhatsApp message dispatches.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {triggerList.map(t => {
              const enabled = config.enabledTriggers ? config.enabledTriggers[t.key] !== false : true;

              return (
                <div key={t.key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.85rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem', display: 'block' }}>{t.label}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.desc}</span>
                  </div>

                  <button
                    onClick={() => toggleWhatsAppTrigger(t.key, !enabled)}
                    style={{
                      border: 'none',
                      background: enabled ? '#25D366' : 'rgba(255,255,255,0.1)',
                      color: enabled ? '#000' : 'var(--text-muted)',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '16px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. PROVIDER API GATEWAY SETTINGS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'provider' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Provider Config Form */}
          <div className="glass-card">
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>API Provider Gateway Credentials</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure Meta Cloud API, Twilio, or Interakt WhatsApp credentials.</p>
            </div>

            <form onSubmit={handleSaveProviderConfig}>
              <div className="form-group">
                <label>Select WhatsApp Service Provider *</label>
                <select 
                  value={providerChoice} 
                  onChange={(e) => setProviderChoice(e.target.value)} 
                  className="form-control"
                >
                  <option value="Unconfigured">Unconfigured (Sandbox Mode)</option>
                  <option value="MetaCloudAPI">Meta Cloud API (Official WhatsApp Business API)</option>
                  <option value="Twilio">Twilio Programmable WhatsApp</option>
                  <option value="Interakt">Interakt / AISensy Gateway</option>
                </select>
              </div>

              <div className="form-group">
                <label>API Key / System User Token</label>
                <input 
                  type="password" 
                  placeholder="EAA... or AC..." 
                  className="form-control" 
                  value={apiKeyInput} 
                  onChange={(e) => setApiKeyInput(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Phone Number ID / Sender ID</label>
                <input 
                  type="text" 
                  placeholder="109823749283749" 
                  className="form-control" 
                  value={phoneIdInput} 
                  onChange={(e) => setPhoneIdInput(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Webhook Verify Token</label>
                <input 
                  type="text" 
                  placeholder="salonsync_wh_verify_secret" 
                  className="form-control" 
                  value={webhookInput} 
                  onChange={(e) => setWebhookInput(e.target.value)} 
                />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Save Provider Gateway Credentials
              </button>
            </form>
          </div>

          {/* Status & Integration Guide Banner */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(20,30,40,0.9) 0%, rgba(10,15,20,0.95) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <ShieldAlert size={22} style={{ color: 'var(--gold-primary)' }} />
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Integration Architecture Status</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.85rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--gold-primary)', display: 'block', marginBottom: '0.2rem' }}>🔒 Honest Delivery Tracking</strong>
                If API keys are left unconfigured, message dispatches log as status <strong>"Provider Credentials Required"</strong>. We never fake delivery statuses.
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.85rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--gold-primary)', display: 'block', marginBottom: '0.2rem' }}>🌐 Meta Cloud API Webhook URL</strong>
                `POST https://salonsync.app/api/whatsapp/webhook`
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.85rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--gold-primary)', display: 'block', marginBottom: '0.2rem' }}>🔌 Decoupled Adapter Interface</strong>
                Backend handler `backend/src/routes/api.js` maps trigger dispatches dynamically to Meta Cloud API / Twilio payloads.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── DISPATCH TEST MESSAGE MODAL ── */}
      {showTestModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowTestModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Dispatch Test WhatsApp Message</h3>
              <button onClick={() => setShowTestModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleTestDispatchSubmit}>
              <div className="form-group">
                <label>Recipient Customer</label>
                <select 
                  value={testCustomerId} 
                  onChange={(e) => setTestCustomerId(e.target.value)} 
                  className="form-control"
                >
                  {customersList.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Recipient Phone Number *</label>
                <input type="tel" required className="form-control" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Select Trigger Type *</label>
                <select value={testTriggerType} onChange={(e) => setTestTriggerType(e.target.value)} className="form-control">
                  {triggerList.map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Dispatch Message to Outbox
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WhatsAppHub;
