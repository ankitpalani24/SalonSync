import React, { useState } from 'react';
import { Plus, Scissors, Sparkles, Clock, Calculator, Percent, Tag, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Services = () => {
  const { tenantFilter, db, addService, addPackage } = useApp();

  const services = tenantFilter(db.services);
  const packages = tenantFilter(db.packages);

  const categories = ['All', 'Haircut', 'Hair Color', 'Facial', 'Makeup', 'Waxing', 'Spa', 'Bridal Services'];
  const [activeTab, setActiveTab] = useState('All');
  
  // Modals
  const [showSrvModal, setShowSrvModal] = useState(false);
  const [showPkgModal, setShowPkgModal] = useState(false);

  // Service Form state
  const [srvName, setSrvName] = useState('');
  const [srvCat, setSrvCat] = useState('Haircut');
  const [srvDuration, setSrvDuration] = useState(30);
  const [srvPrice, setSrvPrice] = useState(0);
  const [srvCost, setSrvCost] = useState(0);
  const [srvDesc, setSrvDesc] = useState('');

  // Package Form state
  const [pkgName, setPkgName] = useState('');
  const [selectedServices, setSelectedServices] = useState([]); // array of {serviceId, sessionsCount}
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgExpiry, setPkgExpiry] = useState('');

  // Temp service inputs for package compiler
  const [tempServId, setTempServId] = useState('');
  const [tempSessions, setTempSessions] = useState(1);

  // Filter service catalog
  const filteredServices = activeTab === 'All' 
    ? services 
    : services.filter(s => s.category === activeTab);

  const handleServiceSubmit = (e) => {
    e.preventDefault();
    addService({
      name: srvName,
      category: srvCat,
      duration: Number(srvDuration),
      price: Number(srvPrice),
      materialCost: Number(srvCost),
      description: srvDesc
    });
    setShowSrvModal(false);
    
    // reset
    setSrvName('');
    setSrvPrice(0);
    setSrvCost(0);
    setSrvDesc('');
  };

  const handleAddTempService = () => {
    if (!tempServId) return;
    const exists = selectedServices.some(s => s.serviceId === tempServId);
    if (exists) return;

    const matchedSrv = services.find(s => s._id === tempServId);
    setSelectedServices(prev => [
      ...prev,
      { serviceId: tempServId, name: matchedSrv ? matchedSrv.name : 'Service', sessionsCount: Number(tempSessions) }
    ]);
  };

  const handleRemoveTempService = (srvId) => {
    setSelectedServices(prev => prev.filter(s => s.serviceId !== srvId));
  };

  const handlePackageSubmit = (e) => {
    e.preventDefault();
    addPackage({
      name: pkgName,
      includedServices: selectedServices.map(s => ({ serviceId: s.serviceId, name: s.name, sessionsCount: s.sessionsCount })),
      price: Number(pkgPrice),
      expiryDate: pkgExpiry
    });
    setShowPkgModal(false);

    // reset
    setPkgName('');
    setSelectedServices([]);
    setPkgPrice(0);
    setPkgExpiry('');
  };

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Services & Packages</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure treatment menu lists, material costs, and service packages.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowPkgModal(true)} className="outline-btn">
            <Sparkles size={16} /> Bundle Package
          </button>
          <button onClick={() => setShowSrvModal(true)} className="gold-btn">
            <Plus size={16} /> Create Service
          </button>
        </div>
      </div>

      {/* Services and Packages Splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Side: Services Roster */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Treatment Menu Catalog</h3>
            
            {/* Category Tabs Dropdown/List */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', maxWidth: '400px', paddingBottom: '0.25rem' }}>
              {categories.slice(0, 5).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  style={{
                    background: activeTab === cat ? 'var(--gold-bg)' : 'transparent',
                    border: activeTab === cat ? '1px solid var(--gold-primary)' : '1px solid var(--border-light)',
                    color: activeTab === cat ? 'var(--gold-primary)' : 'var(--text-secondary)',
                    borderRadius: '4px',
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.7rem',
                    fontWeight: '500'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Cost Parameters</th>
                  <th>Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map(srv => {
                  const profitVal = srv.price - (srv.materialCost || 0);
                  const marginPct = Math.round((profitVal / srv.price) * 100);
                  return (
                    <tr key={srv._id}>
                      <td>
                        <div>
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{srv.name}</span>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{srv.description || 'No description'}</p>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{srv.category}</span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                          <Clock size={12} style={{ color: 'var(--gold-primary)' }} /> {srv.duration} mins
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>₹{srv.price}</span>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Material: ₹{srv.materialCost || 0}</p>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.85rem' }}>₹{profitVal}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({marginPct}%)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Packages Bundles */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Bundled Combos & Packages</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {packages.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No service packages configured yet.</p>
            ) : (
              packages.map((pkg) => (
                <div key={pkg._id} style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', fontWeight: '600' }}>{pkg.name}</h4>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem' }}>₹{pkg.price}</span>
                  </div>
                  
                  {/* List of included services */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.05)' }}>
                    {pkg.includedServices.map((inc, i) => (
                      <span key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        • {inc.name} ({inc.sessionsCount} sessions)
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>Unlimited validity</span>
                    {pkg.expiryDate && <span>Expires: {pkg.expiryDate}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Create Service Modal */}
      {showSrvModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '420px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Create Menu Service</h3>
              <button onClick={() => setShowSrvModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleServiceSubmit}>
              <div className="form-group">
                <label>Service Name *</label>
                <input type="text" required placeholder="Signature Blow Dry" className="form-control" value={srvName} onChange={(e) => setSrvName(e.target.value)} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Category *</label>
                  <select className="form-control" value={srvCat} onChange={(e) => setSrvCat(e.target.value)}>
                    {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (mins)</label>
                  <input type="number" className="form-control" value={srvDuration} onChange={(e) => setSrvDuration(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Price Charged (₹) *</label>
                  <input type="number" required placeholder="1200" className="form-control" value={srvPrice} onChange={(e) => setSrvPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Material Cost (₹)</label>
                  <input type="number" placeholder="150" className="form-control" value={srvCost} onChange={(e) => setSrvCost(e.target.value)} />
                </div>
              </div>

              {/* Live Profit Estimator */}
              <div style={{
                background: 'rgba(46,204,113,0.06)',
                border: '1px solid rgba(46,204,113,0.2)',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calculator size={14} /> Estimated Profit Margin:
                </span>
                <strong style={{ color: 'var(--accent-green)', fontSize: '0.9rem' }}>
                  ₹{Math.max(0, srvPrice - srvCost)} ({srvPrice > 0 ? Math.round(((srvPrice - srvCost)/srvPrice)*100) : 0}%)
                </strong>
              </div>

              <div className="form-group">
                <label>Description Details</label>
                <textarea className="form-control" rows="2" placeholder="Brief outline of steps involved..." value={srvDesc} onChange={(e) => setSrvDesc(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>Save Menu Item</button>
            </form>
          </div>
        </div>
      )}

      {/* Bundle Package Modal */}
      {showPkgModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '480px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Bundle Service Package</h3>
              <button onClick={() => setShowPkgModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handlePackageSubmit}>
              <div className="form-group">
                <label>Package Name *</label>
                <input type="text" required placeholder="Luxury Facial Roster" className="form-control" value={pkgName} onChange={(e) => setPkgName(e.target.value)} />
              </div>

              {/* Service multi-selector */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Bundle Items</h4>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <select className="form-control" style={{ flex: 2 }} value={tempServId} onChange={(e) => setTempServId(e.target.value)}>
                    <option value="">-- Choose Service --</option>
                    {services.map(s => <option key={s._id} value={s._id}>{s.name} (₹{s.price})</option>)}
                  </select>
                  <input type="number" min="1" className="form-control" style={{ flex: 1 }} placeholder="Sessions" value={tempSessions} onChange={(e) => setTempSessions(e.target.value)} />
                  <button type="button" onClick={handleAddTempService} className="outline-btn" style={{ padding: '0.5rem' }}>Add</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedServices.map(item => (
                    <div key={item.serviceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      <span>{item.name} (x{item.sessionsCount} sessions)</span>
                      <button type="button" onClick={() => handleRemoveTempService(item.serviceId)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Bundle Package Price (₹) *</label>
                  <input type="number" required placeholder="5000" className="form-control" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Expiration Date</label>
                  <input type="date" className="form-control" value={pkgExpiry} onChange={(e) => setPkgExpiry(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>Create Bundle Package</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Services;
