import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, MapPin, Clock, Phone, Mail, Calendar, Scissors, Award, 
  CheckCircle2, Sparkles, Heart, Share2, ArrowRight, ShieldCheck, 
  ChevronRight, MessageSquare, Plus, X, Globe, User, Gift, Image as ImageIcon,
  Camera, Upload, Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const PublicSalonProfile = ({ setActivePage }) => {
  const { getPublicSalonProfile, addAppointment, addReview, addToast, updateSalonDetails, currentUser } = useApp();

  // Load public profile payload
  const publicData = useMemo(() => {
    return getPublicSalonProfile('luxe-salon-spa-mumbai');
  }, [getPublicSalonProfile]);

  const { salon, services, staff, reviews, packages } = publicData;

  // Active Showcase Tab
  const [activeSection, setActiveSection] = useState('services');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingService, setBookingService] = useState(null);
  const [bookingStaff, setBookingStaff] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:30');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revClientName, setRevClientName] = useState('');

  // Edit Salon Details & Photos Modal
  const [showEditSalonModal, setShowEditSalonModal] = useState(false);
  const [editSalonName, setEditSalonName] = useState(salon?.name || '');
  const [editSalonTagline, setEditSalonTagline] = useState(salon?.tagline || '');
  const [editSalonLogo, setEditSalonLogo] = useState(salon?.logoUrl || '');
  const [editSalonCover, setEditSalonCover] = useState(salon?.coverImageUrl || '');
  const [editSalonPhone, setEditSalonPhone] = useState(salon?.phone || '');
  const [editSalonAddress, setEditSalonAddress] = useState(salon?.address || '');
  const [editSalonHours, setEditSalonHours] = useState(salon?.openingHours || '');
  const [editSalonDescription, setEditSalonDescription] = useState(salon?.description || '');

  // Preset Cover Photos & Logos
  const PRESET_COVERS = [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1600&q=80'
  ];

  const PRESET_LOGOS = [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=300&q=80'
  ];

  const handleFileUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      addToast('Image size should be under 3MB', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
      addToast('Photo loaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSalonDetails = async (e) => {
    e.preventDefault();
    await updateSalonDetails({
      name: editSalonName,
      tagline: editSalonTagline,
      logoUrl: editSalonLogo,
      coverImageUrl: editSalonCover,
      phone: editSalonPhone,
      address: editSalonAddress,
      openingHours: editSalonHours,
      description: editSalonDescription
    });
    setShowEditSalonModal(false);
    addToast('✨ Salon details & profile photos updated successfully!', 'success');
  };

  const openEditModal = () => {
    setEditSalonName(salon?.name || '');
    setEditSalonTagline(salon?.tagline || '');
    setEditSalonLogo(salon?.logoUrl || '');
    setEditSalonCover(salon?.coverImageUrl || '');
    setEditSalonPhone(salon?.phone || '');
    setEditSalonAddress(salon?.address || '');
    setEditSalonHours(salon?.openingHours || '');
    setEditSalonDescription(salon?.description || '');
    setShowEditSalonModal(true);
  };

  // Simulate SEO Document Title Update
  useEffect(() => {
    document.title = `${salon?.name || 'SalonSync'} - Book Online | Hair, Skincare & Spa`;
    return () => {
      document.title = 'SalonSync - Enterprise Salon SaaS';
    };
  }, [salon]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set((services || []).map(s => s.category || 'Hair'));
    return ['ALL', ...Array.from(set)];
  }, [services]);

  const filteredServices = (services || []).filter(s => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });

  // Handle Booking Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !bookingService) {
      addToast('Please fill in your name, phone number, and selected service.', 'warning');
      return;
    }

    await addAppointment({
      clientName,
      clientPhone,
      services: [{ serviceId: bookingService._id, name: bookingService.name, price: bookingService.price }],
      staffId: bookingStaff || (staff[0] ? staff[0]._id : null),
      date: bookingDate,
      time: bookingTime,
      status: 'Confirmed'
    });

    setShowBookingModal(false);
    setBookingService(null);
    addToast(`🎉 Appointment booked successfully for ${clientName} on ${bookingDate} at ${bookingTime}!`, 'success');
  };

  // Handle Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!revClientName || !revComment) return;

    await addReview({
      customerName: revClientName,
      rating: Number(revRating),
      comment: revComment,
      serviceName: 'General Visit',
      status: 'Approved'
    });

    setShowReviewModal(false);
    setRevComment('');
    setRevClientName('');
    addToast('Thank you! Your verified review has been submitted.', 'success');
  };

  const openBookingForService = (service = null) => {
    setBookingService(service || services[0] || null);
    setShowBookingModal(true);
  };

  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100vh', paddingBottom: '3rem' }}>
      
      {/* ── SEO Preview Bar ── */}
      <div style={{ background: 'rgba(212, 175, 55, 0.1)', borderBottom: '1px solid var(--gold-border)', padding: '0.4rem 1rem', fontSize: '0.72rem', color: 'var(--gold-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={14} />
          <span>SEO Public Showcase Page • Indexable URL: <strong>https://salonsync.app/salon/{salon?.slug}</strong></span>
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Privacy Protected: 0 Private Phone/Salary Data Exposed</span>
      </div>

      {/* ── Hero Banner Section ── */}
      <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden' }}>
        <img 
          src={salon?.coverImageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80"} 
          alt="Salon Cover Showcase" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }} 
        />

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,15,20,1) 0%, rgba(10,15,20,0.3) 60%, rgba(0,0,0,0.4) 100%)' }} />

        {/* Hero Content Overlay */}
        <div className="page-container" style={{ position: 'absolute', bottom: '1.5rem', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img 
              src={salon?.logoUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80"} 
              alt="Salon Logo" 
              style={{ width: '88px', height: '88px', borderRadius: '16px', border: '2px solid var(--gold-primary)', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ background: 'var(--gold-bg)', color: 'var(--gold-primary)', border: '1px solid var(--gold-border)', fontSize: '0.65rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                  VERIFIED SALONSYNC STOREFRONT
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <CheckCircle2 size={12} /> Open Now • {salon?.openingHours}
                </span>
              </div>

              <h1 style={{ fontSize: '2.1rem', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>
                {salon?.name}
              </h1>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {salon?.tagline}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                  <Star size={16} fill="var(--gold-primary)" /> {salon?.rating} ({salon?.totalReviews} Verified Reviews)
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={14} style={{ color: 'var(--gold-primary)' }} /> {salon?.address}, {salon?.city}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={openEditModal}
              className="outline-btn"
              style={{
                padding: '0.85rem 1.4rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                borderColor: 'var(--gold-primary)',
                color: 'var(--gold-primary)'
              }}
            >
              <Camera size={18} /> Edit Salon Photos & Info
            </button>

            {/* PRIMARY CTA BUTTON */}
            <button 
              onClick={() => openBookingForService(null)} 
              className="gold-btn" 
              style={{ 
                padding: '0.85rem 1.8rem', 
                fontSize: '1rem', 
                fontWeight: '700', 
                borderRadius: '30px', 
                boxShadow: '0 8px 25px rgba(112, 130, 56, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
            >
              <Calendar size={20} /> Book Appointment
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Showcase Container ── */}
      <div className="page-container" style={{ marginTop: '2rem' }}>

        {/* Showcase Navigation Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.75rem', overflowX: 'auto' }}>
          {[
            { id: 'services', label: 'Services & Prices', icon: Scissors },
            { id: 'offers', label: 'Special Offers', icon: Gift },
            { id: 'staff', label: 'Stylists & Experts', icon: User },
            { id: 'gallery', label: 'Photo Showcase', icon: ImageIcon },
            { id: 'reviews', label: 'Client Reviews', icon: Star },
            { id: 'location', label: 'Location & Hours', icon: MapPin },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                style={{
                  border: 'none',
                  background: active ? 'var(--gold-bg)' : 'transparent',
                  color: active ? 'var(--gold-primary)' : 'var(--text-secondary)',
                  borderBottom: active ? '2px solid var(--gold-primary)' : '2px solid transparent',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 1. SERVICES & PRICING CATALOGUE */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeSection === 'services' && (
          <div>
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
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
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Services Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredServices.map(srv => (
                <div key={srv._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{srv.name}</h3>
                      <span style={{ fontSize: '1.15rem', color: 'var(--gold-primary)', fontWeight: '800' }}>₹{srv.price}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      <span><Clock size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> {srv.duration || 45} mins</span>
                      <span>•</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{srv.category}</span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                      {srv.description || 'Professional treatment delivered by certified senior stylists using premium imported products.'}
                    </p>
                  </div>

                  <button
                    onClick={() => openBookingForService(srv)}
                    className="gold-btn"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.55rem', fontSize: '0.8rem' }}
                  >
                    Book Service • ₹{srv.price}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 2. SPECIAL OFFERS & PACKAGES */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeSection === 'offers' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Active Promotional Packages & Vouchers</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Exclusive combo packages for online bookings.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {(packages || []).map(pkg => (
                <div key={pkg._id} className="glass-card" style={{ border: '1px solid var(--gold-border)', background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(10,15,20,0.9) 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: '700', background: 'var(--gold-bg)', color: 'var(--gold-primary)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                        FEATURED OFFER
                      </span>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '700', marginTop: '0.3rem' }}>{pkg.name}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--gold-primary)' }}>₹{pkg.price}</div>
                      {pkg.originalPrice && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{pkg.originalPrice}</div>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {pkg.description || 'Special multi-service grooming package with VIP pampering.'}
                  </p>

                  <button
                    onClick={() => openBookingForService({ name: pkg.name, price: pkg.price })}
                    className="gold-btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Claim Offer & Book Package
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 3. STYLISTS & EXPERTS ROSTER (SANITISED PUBLIC VIEW) */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeSection === 'staff' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Master Stylists & Beauty Experts</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Certified professionals dedicated to crafting your signature look.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {(staff || []).map(st => (
                <div key={st._id} className="glass-card" style={{ textCenter: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img 
                    src={st.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"} 
                    alt={st.name} 
                    style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-primary)', marginBottom: '0.85rem' }} 
                  />

                  <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>{st.name}</h4>
                  
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '600', marginBottom: '0.3rem' }}>
                    {(st.specializations || []).join(' • ')}
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    {st.experience || '5+ Years'} Experience • <Star size={12} fill="var(--gold-primary)" style={{ display: 'inline', color: 'var(--gold-primary)' }} /> {st.rating || 4.9}
                  </span>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem' }}>
                    {st.bio || 'Specializes in high-precision hair styling, balayage coloring, and luxury skincare.'}
                  </p>

                  <button 
                    onClick={() => {
                      setBookingStaff(st._id);
                      openBookingForService(null);
                    }}
                    className="outline-btn"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}
                  >
                    Book with {st.name.split(' ')[0]}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 4. PHOTO SHOWCASE GALLERY */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeSection === 'gallery' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Salon Ambiance & Work Showcase</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Explore our 5-star interiors, luxury spa suites, and styling transformations.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {(salon?.galleryImages || []).map((img, idx) => (
                <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', height: '220px', border: '1px solid var(--border-light)' }}>
                  <img src={img} alt={`Showcase ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 5. VERIFIED CLIENT REVIEWS */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeSection === 'reviews' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Verified Customer Reviews & Ratings</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Real feedback from guests who visited {salon?.name}.</p>
              </div>

              <button onClick={() => setShowReviewModal(true)} className="gold-btn" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}>
                <MessageSquare size={15} /> Write a Review
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {(reviews || []).map(rev => (
                <div key={rev._id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{rev.customerName}</strong>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{rev.serviceName || 'Hair & Skincare Visit'} • {rev.date}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.1rem', color: 'var(--gold-primary)' }}>
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} size={14} fill="var(--gold-primary)" />
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 6. LOCATION & HOURS */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeSection === 'location' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card">
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '1rem' }}>Location & Contact Details</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <MapPin size={20} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#fff', display: 'block' }}>Address:</strong>
                    {salon?.address}, {salon?.city}, {salon?.state}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Phone size={20} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#fff', display: 'block' }}>Phone Contact:</strong>
                    {salon?.phone}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Clock size={20} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#fff', display: 'block' }}>Opening Hours:</strong>
                    {salon?.openingHours}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.3)', textAlign: 'center', minHeight: '220px' }}>
              <Globe size={40} style={{ color: 'var(--gold-primary)', marginBottom: '0.75rem' }} />
              <h4 style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Google Maps Interactive Pin</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Location: {salon?.address}, {salon?.city}</p>
            </div>
          </div>
        )}

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* INSTANT BOOKING MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showBookingModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowBookingModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Book Appointment at {salon?.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instant online confirmation</p>
              </div>
              <button onClick={() => setShowBookingModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Your Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Ananya Roy" 
                  className="form-control" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Your Mobile Number *</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="+91 98765 00000" 
                  className="form-control" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Selected Treatment / Service *</label>
                <select 
                  value={bookingService ? bookingService._id : ''} 
                  onChange={(e) => {
                    const s = services.find(srv => String(srv._id) === String(e.target.value));
                    setBookingService(s);
                  }}
                  className="form-control"
                  required
                >
                  <option value="">-- Choose Service --</option>
                  {(services || []).map(s => (
                    <option key={s._id} value={s._id}>{s.name} (₹{s.price})</option>
                  ))}
                </select>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Preferred Date *</label>
                  <input type="date" required className="form-control" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Preferred Time Slot *</label>
                  <input type="time" required className="form-control" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Preferred Stylist (Optional)</label>
                <select value={bookingStaff} onChange={(e) => setBookingStaff(e.target.value)} className="form-control">
                  <option value="">Any Available Stylist</option>
                  {(staff || []).map(st => (
                    <option key={st._id} value={st._id}>{st.name} ({st.specializations ? st.specializations[0] : 'Stylist'})</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}>
                Confirm Appointment Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* WRITE REVIEW MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showReviewModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowReviewModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Write a Verified Review</h3>
              <button onClick={() => setShowReviewModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>Your Name *</label>
                <input type="text" required placeholder="e.g. Pooja Sharma" className="form-control" value={revClientName} onChange={(e) => setRevClientName(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Star Rating *</label>
                <select value={revRating} onChange={(e) => setRevRating(e.target.value)} className="form-control">
                  <option value="5">⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                  <option value="4">⭐⭐⭐⭐ (4/5 Very Good)</option>
                  <option value="3">⭐⭐⭐ (3/5 Good)</option>
                  <option value="2">⭐⭐ (2/5 Average)</option>
                  <option value="1">⭐ (1/5 Poor)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Review Comments *</label>
                <textarea rows="3" required placeholder="Share your experience..." className="form-control" value={revComment} onChange={(e) => setRevComment(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Submit Verified Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* EDIT SALON DETAILS & PHOTO UPLOAD MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showEditSalonModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowEditSalonModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={20} style={{ color: 'var(--gold-primary)' }} />
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '700' }}>Edit Salon Profile & Photos</h3>
              </div>
              <button onClick={() => setShowEditSalonModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveSalonDetails}>
              {/* Salon Logo Section */}
              <div style={{ marginBottom: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--gold-primary)', display: 'block', marginBottom: '0.5rem' }}>
                  Salon Profile Picture / Logo
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <img 
                    src={editSalonLogo || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200"} 
                    alt="Logo Preview" 
                    style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--gold-primary)' }}
                  />
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <label className="outline-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Upload size={14} /> Upload Logo File
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setEditSalonLogo)} style={{ display: 'none' }} />
                      </label>
                    </div>
                    <input 
                      type="url" 
                      placeholder="Or paste Logo Image URL..." 
                      className="form-control" 
                      style={{ fontSize: '0.78rem' }}
                      value={editSalonLogo} 
                      onChange={(e) => setEditSalonLogo(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Preset Logos */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Presets:</span>
                  {PRESET_LOGOS.map((pUrl, idx) => (
                    <img 
                      key={idx} 
                      src={pUrl} 
                      alt={`Preset ${idx + 1}`}
                      onClick={() => setEditSalonLogo(pUrl)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: editSalonLogo === pUrl ? '2px solid var(--gold-primary)' : '1px solid var(--border-light)'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Salon Cover Photo Section */}
              <div style={{ marginBottom: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--gold-primary)', display: 'block', marginBottom: '0.5rem' }}>
                  Salon Hero Cover Image
                </label>
                <div style={{ marginBottom: '0.75rem' }}>
                  <img 
                    src={editSalonCover || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600"} 
                    alt="Cover Preview" 
                    style={{ width: '100%', height: '110px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <label className="outline-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Upload size={14} /> Upload Cover File
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setEditSalonCover)} style={{ display: 'none' }} />
                  </label>
                </div>
                <input 
                  type="url" 
                  placeholder="Or paste Cover Image URL..." 
                  className="form-control" 
                  style={{ fontSize: '0.78rem' }}
                  value={editSalonCover} 
                  onChange={(e) => setEditSalonCover(e.target.value)} 
                />

                {/* Preset Covers */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Presets:</span>
                  {PRESET_COVERS.map((cUrl, idx) => (
                    <img 
                      key={idx} 
                      src={cUrl} 
                      alt={`Cover ${idx + 1}`}
                      onClick={() => setEditSalonCover(cUrl)}
                      style={{
                        width: '45px',
                        height: '28px',
                        borderRadius: '4px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: editSalonCover === cUrl ? '2px solid var(--gold-primary)' : '1px solid var(--border-light)'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Salon Brand Name *</label>
                  <input type="text" required className="form-control" value={editSalonName} onChange={(e) => setEditSalonName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="text" required className="form-control" value={editSalonPhone} onChange={(e) => setEditSalonPhone(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Tagline / Headline</label>
                <input type="text" className="form-control" value={editSalonTagline} onChange={(e) => setEditSalonTagline(e.target.value)} />
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Physical Address</label>
                  <input type="text" className="form-control" value={editSalonAddress} onChange={(e) => setEditSalonAddress(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Opening Hours</label>
                  <input type="text" className="form-control" value={editSalonHours} onChange={(e) => setEditSalonHours(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Salon Bio & Description</label>
                <textarea rows="2" className="form-control" value={editSalonDescription} onChange={(e) => setEditSalonDescription(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                Save Salon Details & Photos
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PublicSalonProfile;
