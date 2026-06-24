import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Mail, Phone, Calendar, User, Download, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Customers = () => {
  const { tenantFilter, db, addCustomer, updateCustomer, deleteCustomer } = useApp();

  const customers = tenantFilter(db.customers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Female');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Filtered List
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setName('');
    setPhone('');
    setEmail('');
    setGender('Female');
    setBirthday('');
    setAddress('');
    setNotes('');
    setShowAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addCustomer({ name, phone, email, gender, birthday, address, notes });
    setShowAddModal(false);
  };

  const handleOpenEdit = (cust) => {
    setSelectedCust(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email || '');
    setGender(cust.gender || 'Female');
    setBirthday(cust.birthday || '');
    setAddress(cust.address || '');
    setNotes(cust.notes || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateCustomer(selectedCust._id, { name, phone, email, gender, birthday, address, notes });
    setShowEditModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this customer file?')) {
      deleteCustomer(id);
      setSelectedCust(null);
    }
  };

  // Simulate CSV data export
  const handleExportData = () => {
    const headers = 'Name,Phone,Email,Gender,Birthday,Loyalty Points,Membership\n';
    const rows = customers.map(c => 
      `"${c.name}","${c.phone}","${c.email || ''}","${c.gender || ''}","${c.birthday || ''}",${c.loyaltyPoints},"${c.membershipLevel}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SalonSync_CRM_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Visit history lookup
  const getCustomerHistory = (custId) => {
    const invoices = tenantFilter(db.invoices).filter(i => i.customerId === custId);
    let totalSpent = invoices.reduce((sum, i) => sum + i.finalAmount, 0);
    
    const servicesTaken = [];
    invoices.forEach(inv => {
      inv.services.forEach(s => servicesTaken.push(s.name));
    });

    const productsBought = [];
    invoices.forEach(inv => {
      inv.products.forEach(p => productsBought.push(p.name));
    });

    return {
      invoices,
      totalSpent,
      servicesCount: servicesTaken.length,
      productsCount: productsBought.length,
      servicesTaken: [...new Set(servicesTaken)],
      productsBought: [...new Set(productsBought)]
    };
  };

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Customer CRM</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage client portfolios, visit logs, and reward points.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportData} className="outline-btn">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={handleOpenAdd} className="gold-btn">
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* CRM Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Side: Directory */}
        <div className="glass-card">
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Phone</th>
                  <th>Loyalty Points</th>
                  <th>Tier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customers found matching search.</td>
                  </tr>
                ) : (
                  filteredCustomers.map(cust => (
                    <tr 
                      key={cust._id} 
                      onClick={() => setSelectedCust(cust)}
                      style={{ cursor: 'pointer', background: selectedCust?._id === cust._id ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gold-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                            {cust.name[0]}
                          </div>
                          <div>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{cust.name}</span>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{cust.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td>{cust.phone}</td>
                      <td>
                        <span style={{ color: 'var(--gold-primary)', fontWeight: '600' }}>{cust.loyaltyPoints || 0} pts</span>
                      </td>
                      <td>
                        <span className={`badge ${cust.membershipLevel.toLowerCase()}`}>{cust.membershipLevel}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleOpenEdit(cust)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><Edit size={16} /></button>
                          <button onClick={() => handleDelete(cust._id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Details Panel */}
        <div className="glass-card">
          {selectedCust ? (
            <div>
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'var(--gold-bg)',
                  border: '2px solid var(--gold-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)',
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  margin: '0 auto 0.75rem auto'
                }}>
                  {selectedCust.name[0]}
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{selectedCust.name}</h3>
                <span className={`badge ${selectedCust.membershipLevel.toLowerCase()}`} style={{ marginTop: '0.25rem' }}>
                  {selectedCust.membershipLevel} Member
                </span>
              </div>

              {/* CRM Info Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} style={{ color: 'var(--gold-primary)' }} />
                  <span>{selectedCust.phone}</span>
                </div>
                {selectedCust.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} style={{ color: 'var(--gold-primary)' }} />
                    <span>{selectedCust.email}</span>
                  </div>
                )}
                {selectedCust.birthday && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} style={{ color: 'var(--gold-primary)' }} />
                    <span>Birthday: {selectedCust.birthday}</span>
                  </div>
                )}
                {selectedCust.notes && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', borderLeft: '3px solid var(--gold-primary)' }}>
                    <strong>Notes:</strong> <span style={{ color: 'var(--text-secondary)' }}>{selectedCust.notes}</span>
                  </div>
                )}
              </div>

              {/* History calculations */}
              {(() => {
                const hist = getCustomerHistory(selectedCust._id);
                return (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>Treatment Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL VALUE SPENT</p>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{hist.totalSpent.toLocaleString()}</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL APPOINTMENTS</p>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{hist.invoices.length} visits</span>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>Preferred Services</h4>
                    {hist.servicesTaken.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No service records logged.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1.25rem' }}>
                        {hist.servicesTaken.map((srv, idx) => (
                          <span key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {srv}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <User size={36} style={{ marginBottom: '1rem', strokeWidth: 1 }} />
              <p style={{ fontSize: '0.8rem' }}>Select a customer from the directory list to display profiles and history.</p>
            </div>
          )}
        </div>

      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input type="text" required className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input type="text" required className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Birthday</label>
                  <input type="date" className="form-control" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Home Address</label>
                <input type="text" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Operational Notes</label>
                <textarea className="form-control" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>Save Customer File</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Edit Customer Details</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input type="text" required className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input type="text" required className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Birthday</label>
                  <input type="date" className="form-control" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Home Address</label>
                <input type="text" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Operational Notes</label>
                <textarea className="form-control" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>Update Customer File</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
