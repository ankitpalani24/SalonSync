import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Calendar, Users, CreditCard, Scissors, Package, UserCheck,
  BarChart3, MessageSquare, Plus, Settings, DollarSign, X, Command, ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const CommandPalette = ({ isOpen, onClose, setActivePage }) => {
  const { tenantFilter, db, currentUser } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const customers = tenantFilter(db.customers || []);
  const appointments = tenantFilter(db.appointments || []);
  const staff = tenantFilter(db.staff || []);
  const services = tenantFilter(db.services || []);
  const products = tenantFilter(db.products || []);

  const cleanQuery = query.toLowerCase().trim();

  // Search Results
  const matchingCustomers = cleanQuery ? customers.filter(c =>
    (c.name && c.name.toLowerCase().includes(cleanQuery)) ||
    (c.phone && c.phone.includes(cleanQuery))
  ).slice(0, 3) : [];

  const matchingServices = cleanQuery ? services.filter(s =>
    s.name && s.name.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  const matchingStaff = cleanQuery ? staff.filter(s =>
    s.name && s.name.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  const matchingProducts = cleanQuery ? products.filter(p =>
    (p.name && p.name.toLowerCase().includes(cleanQuery)) ||
    (p.sku && p.sku.toLowerCase().includes(cleanQuery))
  ).slice(0, 3) : [];

  // Command Shortcuts
  const quickActions = [
    { label: 'Book New Appointment', icon: Calendar, action: () => { setActivePage('appointments'); onClose(); }, roles: ['SALON_OWNER', 'SALON_MANAGER', 'STAFF', 'CLIENT'] },
    { label: 'Register New Client', icon: Users, action: () => { setActivePage('customers'); onClose(); }, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { label: 'Generate POS Invoice', icon: CreditCard, action: () => { setActivePage('billing'); onClose(); }, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { label: 'View BI Executive Analytics', icon: BarChart3, action: () => { setActivePage('analytics'); onClose(); }, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { label: 'Manage Treatment Menu', icon: Scissors, action: () => { setActivePage('services'); onClose(); }, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { label: 'Inventory & Stock Logistics', icon: Package, action: () => { setActivePage('inventory'); onClose(); }, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { label: 'Staff Roster & HR Desk', icon: UserCheck, action: () => { setActivePage('staff'); onClose(); }, roles: ['SALON_OWNER', 'SALON_MANAGER', 'STAFF'] },
    { label: 'WhatsApp Automation', icon: MessageSquare, action: () => { setActivePage('marketing'); onClose(); }, roles: ['SALON_OWNER', 'FRANCHISE_OWNER'] }
  ].filter(a => !currentUser || a.roles.includes(currentUser.role));

  const filteredActions = cleanQuery
    ? quickActions.filter(a => a.label.toLowerCase().includes(cleanQuery))
    : quickActions;

  return (
    <div
      className="modal-backdrop-overlay"
      onClick={onClose}
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'linear-gradient(135deg, rgba(22,22,22,0.95) 0%, rgba(12,12,12,0.98) 100%)',
          border: '1px solid var(--gold-border)',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-light)', gap: '0.75rem' }}>
          <Search size={18} style={{ color: 'var(--gold-primary)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search client, service, staff, product..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              width: '100%',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: 'var(--text-muted)' }}>ESC to close</span>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
          </div>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem 1rem' }}>
          
          {/* Quick Actions Group */}
          {filteredActions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                Quick Actions
              </div>
              {filteredActions.map((act, i) => {
                const IconComp = act.icon;
                return (
                  <div
                    key={i}
                    onClick={act.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-bg)'; e.currentTarget.style.color = 'var(--gold-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <IconComp size={16} />
                      <span>{act.label}</span>
                    </div>
                    <ArrowRight size={14} style={{ opacity: 0.5 }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Customers Section */}
          {matchingCustomers.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                Clients Directory
              </div>
              {matchingCustomers.map(c => (
                <div
                  key={c._id}
                  onClick={() => { setActivePage('customers'); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Users size={14} style={{ color: 'var(--gold-primary)' }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{c.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({c.phone})</span>
                  </div>
                  <span className={`badge ${c.membershipLevel ? c.membershipLevel.toLowerCase() : 'none'}`} style={{ fontSize: '0.65rem' }}>
                    {c.membershipLevel || 'Client'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Services Section */}
          {matchingServices.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                Treatment Catalog
              </div>
              {matchingServices.map(s => (
                <div
                  key={s._id}
                  onClick={() => { setActivePage('services'); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Scissors size={14} style={{ color: 'var(--gold-primary)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>• {s.category}</span>
                  </div>
                  <strong style={{ color: 'var(--gold-primary)' }}>₹{s.price}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Staff Section */}
          {matchingStaff.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                Stylists & Staff
              </div>
              {matchingStaff.map(st => (
                <div
                  key={st._id}
                  onClick={() => { setActivePage('staff'); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <UserCheck size={14} style={{ color: 'var(--gold-primary)' }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{st.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({st.role})</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)' }}>★ {st.rating || 5.0}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '0.6rem 1.25rem', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>Navigate with mouse or arrow keys</span>
          <span>Shortcut: <strong style={{ color: 'var(--gold-primary)' }}>Ctrl + K</strong></span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
