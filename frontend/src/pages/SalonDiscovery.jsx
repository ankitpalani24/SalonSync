import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, Star, Filter, ArrowUpDown, Clock, Scissors, 
  Sparkles, CheckCircle2, Calendar, ShieldCheck, ChevronRight, X, 
  SlidersHorizontal, Check, Zap, Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const SalonDiscovery = ({ setActivePage }) => {
  const { discoverSalons, addAppointment, addToast } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [openOnly, setOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  // Mobile Filter Drawer State
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Booking Modal State
  const [selectedSalonForBooking, setSelectedSalonForBooking] = useState(null);
  const [bookingClientName, setBookingClientName] = useState('');
  const [bookingClientPhone, setBookingClientPhone] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('11:00');
  const [bookingService, setBookingService] = useState('Signature Haircut');

  // Available Cities
  const cities = ['ALL', 'Mumbai', 'Delhi', 'Bangalore', 'Pune'];

  // Categories
  const categories = ['ALL', 'Haircut', 'Facial', 'Spa', 'Barbering', 'Bridal'];

  // Filtered & Sorted Salon Results
  const salonResults = useMemo(() => {
    return discoverSalons({
      search: searchTerm,
      city: selectedCity,
      serviceCategory: selectedCategory,
      minRating,
      maxPrice,
      openOnly,
      sortBy
    });
  }, [searchTerm, selectedCity, selectedCategory, minRating, maxPrice, openOnly, sortBy, discoverSalons]);

  // Submit Quick Booking
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingClientName || !bookingClientPhone) {
      addToast('Please enter your name and contact phone number.', 'warning');
      return;
    }

    await addAppointment({
      clientName: bookingClientName,
      clientPhone: bookingClientPhone,
      services: [{ name: bookingService, price: selectedSalonForBooking?.startingPrice || 500 }],
      salonId: selectedSalonForBooking?._id,
      date: bookingDate,
      time: bookingTime,
      status: 'Confirmed'
    });

    setSelectedSalonForBooking(null);
    setBookingClientName('');
    setBookingClientPhone('');
    addToast(`🎉 Booking confirmed at ${selectedSalonForBooking?.name} for ${bookingDate} at ${bookingTime}!`, 'success');
  };

  return (
    <div className="page-container animated-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* ── Search Hero Banner ── */}
      <div className="glass-card" style={{ 
        marginBottom: '1.5rem', 
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(10, 15, 20, 0.95) 100%)', 
        border: '1px solid var(--gold-border)',
        padding: '1.75rem'
      }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ 
            background: 'var(--gold-bg)', 
            color: 'var(--gold-primary)', 
            border: '1px solid var(--gold-border)', 
            fontSize: '0.68rem', 
            fontWeight: '700', 
            padding: '0.2rem 0.6rem', 
            borderRadius: '12px',
            letterSpacing: '0.5px'
          }}>
            SALONSYNC MARKETPLACE
          </span>

          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0.4rem 0 0.2rem 0' }}>
            Discover Top Salons & Spas
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Book appointments at verified luxury hair, skincare, and wellness sanctuaries near you.
          </p>

          {/* Search Inputs Row */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search by salon name, service, or locality..." 
                className="form-control" 
                style={{ paddingLeft: '2.5rem', height: '48px', fontSize: '0.88rem', borderRadius: '8px' }} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div style={{ position: 'relative', width: '160px' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-primary)' }} />
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.2rem', height: '48px', fontSize: '0.85rem', borderRadius: '8px', background: 'var(--bg-card)' }}
              >
                {cities.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Cities' : c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Category Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                border: selectedCategory === cat ? '1px solid var(--gold-border)' : '1px solid var(--border-light)',
                background: selectedCategory === cat ? 'var(--gold-primary)' : 'rgba(255,255,255,0.03)',
                color: selectedCategory === cat ? '#000' : 'var(--text-secondary)',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat === 'ALL' ? 'All Services' : cat}
            </button>
          ))}
        </div>

        {/* Sort & Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="form-control"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-card)' }}
            >
              <option value="rating">Highest Rated ★</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="reviews">Most Reviewed</option>
            </select>
          </div>

          <button 
            onClick={() => setShowFilterDrawer(!showFilterDrawer)} 
            className="outline-btn" 
            style={{ padding: '0.38rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      {/* Filter Drawer / Options Panel */}
      {showFilterDrawer && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Minimum Rating</label>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="form-control" style={{ fontSize: '0.78rem' }}>
                <option value="0">Any Rating</option>
                <option value="4.5">4.5+ ★ Rating</option>
                <option value="4.8">4.8+ ★ Rating</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Price Range</label>
              <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="form-control" style={{ fontSize: '0.78rem' }}>
                <option value="10000">All Price Ranges</option>
                <option value="500">Under ₹500 (Budget)</option>
                <option value="1000">Under ₹1,000 (Mid-Range)</option>
                <option value="2000">Under ₹2,000 (Luxury)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', pt: '1.25rem' }}>
              <input 
                type="checkbox" 
                id="openOnlyCheck" 
                checked={openOnly} 
                onChange={(e) => setOpenOnly(e.target.checked)} 
              />
              <label htmlFor="openOnlyCheck" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Show "Open Now" Salons Only
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Salon Results Header ── */}
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Showing <strong>{salonResults.length}</strong> registered salons
      </div>

      {/* ── Responsive Salon Cards Grid (Mobile-Optimized) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {salonResults.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
            <Search size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>No Salons Found</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Try adjusting your search criteria or resetting filters.</p>
          </div>
        ) : (
          salonResults.map(salon => (
            <div key={salon._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
              
              {/* Cover Image & Open Status */}
              <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                <img 
                  src={salon.coverImageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"} 
                  alt={salon.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />

                {/* Open Status Pill */}
                <span style={{
                  position: 'absolute',
                  top: '0.75rem',
                  left: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  background: 'rgba(46, 204, 113, 0.2)',
                  color: 'var(--accent-green)',
                  border: '1px solid rgba(46, 204, 113, 0.4)',
                  backdropFilter: 'blur(4px)'
                }}>
                  🟢 Open Now
                </span>

                {/* Distance Badge */}
                <span style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.68rem',
                  fontWeight: '600',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  📍 {salon.distanceStr || 'Nearby'}
                </span>

                {/* Logo & Salon Title */}
                <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.85rem', right: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <img 
                    src={salon.logoUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80"} 
                    alt="Logo" 
                    style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--gold-primary)' }} 
                  />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', lineHeight: 1.2 }}>
                      {salon.name}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                      {salon.locality}, {salon.city}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                
                {/* Rating & Availability */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                    <Star size={15} fill="var(--gold-primary)" />
                    <span>{salon.rating || 4.9} ({salon.totalReviews || 128} reviews)</span>
                  </div>

                  <span style={{ color: 'var(--accent-green)', fontWeight: '600', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Zap size={12} /> Slots Available
                  </span>
                </div>

                {/* Popular Services Tags */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {(salon.popularServices || ['Haircut', 'Facial']).map((srv, idx) => (
                    <span key={idx} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      {srv}
                    </span>
                  ))}
                </div>

                {/* Starting Price & Actions */}
                <div style={{ marginTop: 'auto', pt: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Starting Price</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--gold-primary)' }}>From ₹{salon.startingPrice || 350}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button 
                      onClick={() => setActivePage && setActivePage('public-profile')} 
                      className="outline-btn" 
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.72rem' }}
                    >
                      Showcase
                    </button>
                    <button 
                      onClick={() => setSelectedSalonForBooking(salon)} 
                      className="gold-btn" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.72rem' }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Instant Quick Booking Modal ── */}
      {selectedSalonForBooking && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setSelectedSalonForBooking(null); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Instant Booking</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '600' }}>{selectedSalonForBooking.name}</p>
              </div>
              <button onClick={() => setSelectedSalonForBooking(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Your Name *</label>
                <input type="text" required placeholder="e.g. Rahul Sharma" className="form-control" value={bookingClientName} onChange={(e) => setBookingClientName(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <input type="tel" required placeholder="+91 98765 00000" className="form-control" value={bookingClientPhone} onChange={(e) => setBookingClientPhone(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Select Service *</label>
                <select value={bookingService} onChange={(e) => setBookingService(e.target.value)} className="form-control">
                  {(selectedSalonForBooking.popularServices || ['Signature Haircut', 'Facial', 'Spa']).map((srv, idx) => (
                    <option key={idx} value={srv}>{srv}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" required className="form-control" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Time Slot *</label>
                  <input type="time" required className="form-control" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                Confirm Booking at {selectedSalonForBooking.name}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalonDiscovery;
