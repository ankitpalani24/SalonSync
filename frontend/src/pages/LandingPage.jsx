import React, { useState } from 'react';
import {
  Sparkles, Check, ArrowRight, Play, Shield, Clock, Smartphone,
  MessageSquare, Users, CreditCard, BarChart3, Scissors, Building2,
  ChevronDown, Star, Phone, Mail, MapPin, Send, Zap, Award, Globe,
  CheckCircle2, HelpCircle, Layers, RefreshCw, Calendar, Heart, Gift
} from 'lucide-react';

const LandingPage = ({ onStartTrial, onLogin }) => {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly', 'annual'
  const [activePreviewTab, setActivePreviewTab] = useState('pos'); // 'pos', 'calendar', 'analytics', 'whatsapp'
  const [openFaq, setOpenFaq] = useState(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const features = [
    { title: '360° Customer CRM', desc: 'Complete client profiles, before/after transformation photo portfolios, treatment notes, and automated loyalty tiers.', icon: Users, color: '#3498db' },
    { title: 'Smart Appointment Calendar', desc: 'Conflict-free appointment scheduling with drag-and-drop slots, stylist rosters, and status tracking.', icon: Calendar, color: '#9b59b6' },
    { title: 'POS Billing & GST Invoicing', desc: 'Instant checkout terminal supporting UPI QR codes, Card, Cash, GST calculations, and digital receipts.', icon: CreditCard, color: '#2ecc71' },
    { title: 'Real-Time Inventory & Alerts', desc: 'Automatic stock deductions on checkout, SKU tracking, low stock notifications, and supplier purchase ledgers.', icon: Scissors, color: '#e67e22' },
    { title: 'WhatsApp Automation Hub', desc: 'Automated booking confirmations, 2-hour reminders, birthday wishes, anniversary perks, and instant invoice sends.', icon: MessageSquare, color: '#25D366' },
    { title: 'Staff & Commission Engine', desc: 'Biometric shift clock-ins, stylist commission rate calculators, performance leaderboards, and payout logs.', icon: Shield, color: '#f1c40f' },
    { title: 'Profit & Loss Analytics', desc: 'Real-time financial dashboard tracking net profit, material costs, monthly revenue trends, and popular service donuts.', icon: BarChart3, color: '#e74c3c' },
    { title: 'Multi-Branch Franchise System', desc: 'Centralized dashboard for multi-location owners to compare branch revenue, staff output, and tenant data.', icon: Building2, color: 'var(--gold-primary)' },
  ];

  const faqs = [
    {
      q: 'Can I try SalonSync for free before committing?',
      a: 'Yes! We offer a 14-day full feature free trial with no credit card required. You get complete access to POS billing, CRM, WhatsApp messaging, and analytics.'
    },
    {
      q: 'Does SalonSync handle GST calculations and UPI payment receipts?',
      a: 'Absolutely. SalonSync generates GST-compliant invoices with customizable tax rates, automatically calculates sub-totals, and displays instant UPI QR codes for seamless customer checkout.'
    },
    {
      q: 'How do automated WhatsApp reminders and invoices work?',
      a: 'SalonSync integrates directly with WhatsApp. When an appointment is scheduled or an invoice is generated, the client automatically receives a personalized WhatsApp message with full details.'
    },
    {
      q: 'Can I manage multiple salon or spa branches under one login?',
      a: 'Yes. SalonSync includes multi-branch franchise architecture. Salon owners can switch between locations seamlessly or view consolidated revenue reports for all outlets.'
    },
    {
      q: 'Is my salon customer and billing data safe and secure?',
      a: 'Your data security is our top priority. All database records use tenant isolation, SSL 256-bit encryption, and automated daily backups on cloud servers.'
    }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => setContactSubmitted(false), 4000);
  };

  return (
    <div style={{ background: '#050505', color: '#ffffff', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" }}>
      
      {/* ─── 1. NAVIGATION BAR ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(5, 5, 5, 0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,175,55,0.15)', padding: '1rem 3rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--gold-primary) 0%, #b38f20 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: '800', color: '#000', letterSpacing: '0.5px'
          }}>SS</div>
          <span style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '1px', color: '#ffffff' }}>
            Salon<span style={{ color: 'var(--gold-primary)' }}>Sync</span>
          </span>
        </div>

        {/* Nav Links */}
        <div className="hide-mobile" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {['Features', 'Preview', 'How It Works', 'Pricing', 'Testimonials', 'FAQ', 'Contact'].map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: '500', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--gold-primary)'}
              onMouseLeave={e => e.target.style.color = '#aaa'}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Nav Actions */}
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <button onClick={onLogin} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', padding: '0.5rem 1rem' }}>
            Sign In
          </button>
          <button onClick={onStartTrial} className="gold-btn" style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* ─── 2. HERO SECTION ────────────────────────────────────────────────── */}
      <section style={{
        padding: '11rem 2rem 5rem 2rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(212,175,55,0.15) 0%, rgba(5,5,5,0) 70%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '950px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1.25rem', background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.3)', borderRadius: '30px',
            fontSize: '0.82rem', color: 'var(--gold-primary)', fontWeight: '600',
            marginBottom: '2rem', backdropFilter: 'blur(8px)'
          }}>
            <Sparkles size={15} /> Next-Gen Salon & Spa SaaS Platform
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: '3.8rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.75rem',
            background: 'linear-gradient(135deg, #ffffff 40%, var(--gold-primary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            Empower Your Salon Empire with Modern Operating Systems
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: '1.2rem', color: '#aaaaaa', lineHeight: '1.65',
            maxWidth: '780px', margin: '0 auto 2.75rem auto'
          }}>
            Streamline POS checkout, automate WhatsApp appointment reminders, manage 360° client profiles, track stock inventory in real-time, and boost multi-branch profitability.
          </p>

          {/* Hero CTAs */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <button onClick={onStartTrial} className="gold-btn" style={{ padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: '700', borderRadius: '8px' }}>
              Start 14-Day Free Trial <ArrowRight size={18} />
            </button>
            <button onClick={onLogin} className="outline-btn" style={{ padding: '1rem 2.25rem', fontSize: '1rem', fontWeight: '600', borderRadius: '8px' }}>
              <Play size={16} fill="var(--gold-primary)" /> Watch 2-Min Demo
            </button>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem',
            maxWidth: '850px', margin: '0 auto', padding: '1.5rem',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', backdropFilter: 'blur(10px)'
          }}>
            {[
              { label: 'Revenue Processed', value: '₹15M+' },
              { label: 'Luxury Salons Onboard', value: '500+' },
              { label: 'Uptime SLA', value: '99.99%' },
              { label: 'User Rating', value: '4.9/5 ★' }
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--gold-primary)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#888888', marginTop: '0.2rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. INTERACTIVE DASHBOARD PREVIEW SECTION ──────────────────────── */}
      <section id="preview" style={{ padding: '5rem 2rem 7rem 2rem', background: '#080808' }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.75rem' }}>
              Experience the SalonSync Workspace
            </h2>
            <p style={{ color: '#888888', fontSize: '1rem' }}>Click below to explore interactive live feature previews.</p>

            {/* Preview Tabs */}
            <div style={{ display: 'inline-flex', gap: '0.5rem', marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { id: 'pos', label: 'POS Billing Desk' },
                { id: 'calendar', label: 'Smart Calendar' },
                { id: 'analytics', label: 'Financial Analytics' },
                { id: 'whatsapp', label: 'WhatsApp Automations' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActivePreviewTab(t.id)}
                  style={{
                    padding: '0.55rem 1.2rem', border: 'none', borderRadius: '6px',
                    background: activePreviewTab === t.id ? 'var(--gold-primary)' : 'transparent',
                    color: activePreviewTab === t.id ? '#000000' : '#888888',
                    fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-smooth)'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Mac Window Frame */}
          <div style={{
            background: '#121212', border: '1px solid var(--gold-border)',
            borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.85)'
          }}>
            {/* Window Topbar */}
            <div style={{ background: '#1c1c1c', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#777777', fontWeight: '600', letterSpacing: '1px' }}>
                SALONSYNC LIVE OPERATING DEMO
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: '600' }}>● ONLINE</div>
            </div>

            {/* Window Body Preview Content */}
            <div style={{ padding: '2rem', minHeight: '380px', background: '#0e0e0e' }}>
              {activePreviewTab === 'pos' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--gold-primary)', fontSize: '0.9rem' }}>✂️ Selected Cart Treatments</strong>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>INV-2026-0042</span>
                    </div>
                    {[{ name: 'Global Hair Balayage & Olaplex', rate: '₹3,500' }, { name: '24K Gold Luxury Facial', rate: '₹2,200' }, { name: 'Moroccan Argan Shampoo SKU#88', rate: '₹950' }].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.5rem 0', borderBottom: '1px dashed rgba(255,255,255,0.04)' }}>
                        <span>{item.name}</span>
                        <span style={{ fontWeight: '700', color: '#fff' }}>{item.rate}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid var(--gold-border)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>Client: Ananya Sharma</div>
                      <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '1rem' }}>Stylist: Rahul Verma</div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', color: 'var(--gold-primary)' }}>
                        <span>Grand Total</span>
                        <span>₹6,650</span>
                      </div>
                    </div>
                    <button className="gold-btn" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '1rem' }}>Collect UPI / Print Invoice</button>
                  </div>
                </div>
              )}

              {activePreviewTab === 'calendar' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {[{ time: '10:00 AM', client: 'Priya Mehta', service: 'Hydra Facial', stylist: 'Sanya' }, { time: '11:30 AM', client: 'Rohan Kapoor', service: 'Beard Sculpt & Haircut', stylist: 'Vikram' }, { time: '02:00 PM', client: 'Sneha Roy', service: 'Keratin Hair Treatment', stylist: 'Rahul' }].map((slot, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1.25rem', borderLeft: '4px solid var(--gold-primary)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '700', marginBottom: '0.4rem' }}>{slot.time}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>{slot.client}</div>
                      <div style={{ fontSize: '0.8rem', color: '#aaa', margin: '0.2rem 0' }}>{slot.service}</div>
                      <div style={{ fontSize: '0.72rem', color: '#666' }}>Stylist: {slot.stylist}</div>
                    </div>
                  ))}
                </div>
              )}

              {activePreviewTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {[{ title: 'Today Revenue', val: '₹24,500' }, { title: 'Net Profit', val: '₹18,200' }, { title: 'Material Costs', val: '₹3,400' }, { title: 'Total Visits', val: '18 Clients' }].map((k, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#888' }}>{k.title}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>{k.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>Monthly Revenue vs Expense Growth Chart</div>
                    <svg width="100%" height="80" viewBox="0 0 500 80">
                      <path d="M0,70 Q100,20 200,50 T400,10 L500,30" fill="none" stroke="var(--gold-primary)" strokeWidth="3" />
                      <path d="M0,70 Q100,20 200,50 T400,10 L500,30 L500,80 L0,80 Z" fill="rgba(212,175,55,0.1)" />
                    </svg>
                  </div>
                </div>
              )}

              {activePreviewTab === 'whatsapp' && (
                <div style={{ maxWidth: '500px', margin: '0 auto', background: '#0b141a', borderRadius: '12px', border: '1px solid #1f2c34', padding: '1.25rem', color: '#e9edef', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: '1.5' }}>
                  <div style={{ fontSize: '0.7rem', color: '#25D366', fontWeight: '700', marginBottom: '0.5rem', textTransform: 'uppercase' }}>📱 WhatsApp Automated Trigger Output</div>
                  Hello Ananya! 💇‍♀️<br /><br />
                  Your appointment at <b>SalonSync Luxe Spa</b> for <b>Global Balayage</b> is confirmed for <b>15 Aug at 03:30 PM</b>.<br /><br />
                  Receipt INV-2026-0042 • Total Paid: <b>₹6,650</b> (+66 pts earned).<br />
                  Thank you for visiting us!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. FEATURES SECTION ────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '7rem 2rem', background: '#050505', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
              Everything Needed to Run Your Salon Empire
            </h2>
            <p style={{ color: '#888888', maxWidth: '650px', margin: '0 auto', fontSize: '1rem' }}>
              From walk-in client checkout to multi-branch revenue tracking, SalonSync powers every aspect of luxury beauty business operations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.5rem' }}>
            {features.map((f, i) => {
              const IconComp = f.icon;
              return (
                <div key={i} className="glass-card" style={{
                  padding: '1.75rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'var(--transition-smooth)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '10px',
                      background: `${f.color}15`, color: f.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '1.25rem'
                    }}>
                      <IconComp size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>{f.title}</h3>
                    <p style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: '1.5' }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 5. HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '7rem 2rem', background: '#080808' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
              Simple 4-Step Setup Process
            </h2>
            <p style={{ color: '#888888', fontSize: '1rem' }}>Get your salon up and running in less than 5 minutes.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '01', title: 'Register Profile', desc: 'Create your salon account, set your logo, address, and branches.' },
              { step: '02', title: 'Add Services & Team', desc: 'Input treatments, prices, retail products, and assign staff stylists.' },
              { step: '03', title: 'Automate WhatsApp', desc: 'Enable instant WhatsApp receipts, appointment reminders, and birthday offers.' },
              { step: '04', title: 'Grow & Scale', desc: 'Track daily profits, monitor staff commission reports, and open new locations.' }
            ].map(item => (
              <div key={item.step} className="glass-card" style={{ padding: '2rem 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.015)' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>{item.step}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: '1.5' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. PRICING SECTION ────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '7rem 2rem', background: '#050505', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
              Transparent Enterprise Pricing
            </h2>
            <p style={{ color: '#888888', fontSize: '1rem', marginBottom: '2rem' }}>No hidden setup fees. Switch or cancel your subscription anytime.</p>

            {/* Annual / Monthly Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.6rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '0.4rem 1rem', border: 'none', borderRadius: '20px',
                  background: billingCycle === 'monthly' ? 'var(--gold-primary)' : 'transparent',
                  color: billingCycle === 'monthly' ? '#000' : '#888', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer'
                }}
              >Monthly</button>
              <button
                onClick={() => setBillingCycle('annual')}
                style={{
                  padding: '0.4rem 1rem', border: 'none', borderRadius: '20px',
                  background: billingCycle === 'annual' ? 'var(--gold-primary)' : 'transparent',
                  color: billingCycle === 'annual' ? '#000' : '#888', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer'
                }}
              >Annual (Save 20% 🎉)</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              {
                name: 'Starter Salon',
                price: billingCycle === 'annual' ? '₹1,199' : '₹1,499',
                desc: 'Perfect for boutique salons and independent stylists.',
                features: ['1 Branch Location', 'Customer CRM & Portfolios', 'POS Billing & GST Receipts', '500 Invoices / mo', 'Email Notifications']
              },
              {
                name: 'Professional Spa',
                popular: true,
                price: billingCycle === 'annual' ? '₹2,799' : '₹3,499',
                desc: 'Designed for growing salons and multi-stylist spas.',
                features: ['Up to 3 Branches', 'Unlimited Customer CRM', 'Full WhatsApp Automation System', 'Real-Time Inventory & Stock Alerts', 'Staff Commission Calculator', 'Profit & Loss Financial Analytics']
              },
              {
                name: 'Franchise Enterprise',
                price: billingCycle === 'annual' ? '₹6,399' : '₹7,999',
                desc: 'For multi-city franchise chains & salon brands.',
                features: ['Unlimited Branches', 'Central Franchise Admin Dashboard', 'Custom Domain & Branding', 'Dedicated 24/7 Account Manager', 'Priority WhatsApp Gateway', 'Custom Data Export & API']
              }
            ].map(plan => (
              <div key={plan.name} className="glass-card" style={{
                padding: '2.5rem 2rem', borderRadius: '14px',
                background: plan.popular ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.015)',
                border: plan.popular ? '2px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative'
              }}>
                {plan.popular && (
                  <span style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--gold-primary)', color: '#000', fontSize: '0.7rem', fontWeight: '800',
                    padding: '0.25rem 0.85rem', borderRadius: '12px', letterSpacing: '0.5px'
                  }}>MOST POPULAR</span>
                )}

                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#fff', marginBottom: '0.35rem' }}>{plan.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '1.5rem', lineHeight: '1.4' }}>{plan.desc}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: '800', color: 'var(--gold-primary)' }}>{plan.price}</span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>/ month</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#ccc' }}>
                        <Check size={15} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={onStartTrial} className={plan.popular ? 'gold-btn' : 'outline-btn'} style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                  Start 14-Day Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIALS SECTION ───────────────────────────────────────── */}
      <section id="testimonials" style={{ padding: '7rem 2rem', background: '#080808' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
              Loved by Top Salon & Spa Leaders
            </h2>
            <p style={{ color: '#888888', fontSize: '1rem' }}>See how SalonSync transforms daily salon operations.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { name: 'Ananya Mehta', role: 'Owner, Luxe Blossom Salon', quote: 'SalonSync replaced 4 separate tools. Our checkout speed increased 3x and WhatsApp reminders reduced no-shows by 40%.' },
              { name: 'Vikram Malhotra', role: 'Director, Groom & Co Barber Franchise', quote: 'The multi-branch financial comparisons are a game changer. I can monitor Mumbai & Delhi location revenues live on my phone.' },
              { name: 'Priya Sharma', role: 'Founder, Velvet Skin & Hair Clinic', quote: 'Our clients love the WhatsApp receipts with UPI QR codes. Super professional and modern! Highly recommended for any salon.' }
            ].map((t, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '2rem 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.015)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="var(--gold-primary)" />)}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '1.5rem' }}>"{t.quote}"</p>
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block' }}>{t.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. FAQ SECTION ────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: '7rem 2rem', background: '#050505', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: '#888888', fontSize: '1rem' }}>Everything you need to know about SalonSync.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                style={{
                  background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', fontSize: '1rem', color: '#fff' }}>
                  <span>{faq.q}</span>
                  <ChevronDown size={18} style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', color: 'var(--gold-primary)' }} />
                </div>
                {openFaq === idx && (
                  <p style={{ marginTop: '0.85rem', fontSize: '0.85rem', color: '#aaa', lineHeight: '1.6', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.85rem' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. CONTACT SECTION ────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '7rem 2rem', background: '#080808' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '3rem', alignItems: 'start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--gold-primary)', fontWeight: '700' }}>Get In Touch</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem', marginBottom: '1rem' }}>Let’s Upgrade Your Salon Operations</h2>
              <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                Have questions about pricing, custom franchise integrations, or data migration? Our team is available 24/7 to assist.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.88rem', color: '#ccc' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={18} /></div>
                  <span>+91 98765 43210</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.88rem', color: '#ccc' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={18} /></div>
                  <span>hello@salonsync.io</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.88rem', color: '#ccc' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={18} /></div>
                  <span>Luxe Tower, BKC Mumbai, MH, India</span>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '14px', background: 'rgba(255,255,255,0.015)' }}>
              {contactSubmitted ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--accent-green)' }}>
                  <CheckCircle2 size={48} style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Message Received!</h3>
                  <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.5rem' }}>Our team will call you within 15 minutes.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#ccc' }}>Your Name *</label>
                    <input type="text" required className="form-control" placeholder="Pooja Verma" />
                  </div>
                  <div className="grid-2-cols">
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#ccc' }}>Email *</label>
                      <input type="email" required className="form-control" placeholder="pooja@salon.com" />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#ccc' }}>Phone Number *</label>
                      <input type="text" required className="form-control" placeholder="+91 98765 00000" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#ccc' }}>Salon / Outlet Name</label>
                    <input type="text" className="form-control" placeholder="Aura Spa & Salon" />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#ccc' }}>How can we help?</label>
                    <textarea rows="3" className="form-control" placeholder="Tell us about your branches or requirements..." />
                  </div>
                  <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                    <Send size={15} /> Send Inquiry Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. FOOTER SECTION ────────────────────────────────────────────── */}
      <footer style={{
        padding: '4rem 3rem 2rem 3rem', background: '#030303',
        borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82rem', color: '#777777'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--gold-primary)', color: '#000', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SS</div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>Salon<span style={{ color: 'var(--gold-primary)' }}>Sync</span></span>
            </div>
            <p style={{ color: '#777777', lineHeight: '1.6', maxWidth: '320px' }}>
              Enterprise SaaS platform powering premium salons, spas, and barber franchises with modern POS billing and WhatsApp automations.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: '700', marginBottom: '1rem' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <a href="#features" style={{ color: '#777', textDecoration: 'none' }}>POS Billing</a>
              <a href="#features" style={{ color: '#777', textDecoration: 'none' }}>WhatsApp Messaging</a>
              <a href="#features" style={{ color: '#777', textDecoration: 'none' }}>360° Customer CRM</a>
              <a href="#features" style={{ color: '#777', textDecoration: 'none' }}>Financial Analytics</a>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: '700', marginBottom: '1rem' }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <a href="#how-it-works" style={{ color: '#777', textDecoration: 'none' }}>How It Works</a>
              <a href="#pricing" style={{ color: '#777', textDecoration: 'none' }}>Pricing Plans</a>
              <a href="#testimonials" style={{ color: '#777', textDecoration: 'none' }}>Client Reviews</a>
              <a href="#contact" style={{ color: '#777', textDecoration: 'none' }}>Contact Support</a>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: '700', marginBottom: '1rem' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span style={{ cursor: 'pointer' }}>Terms of Service</span>
              <span style={{ cursor: 'pointer' }}>GST Compliance</span>
              <span style={{ cursor: 'pointer' }}>Security Whitepaper</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', textAlign: 'center', color: '#555555', fontSize: '0.78rem' }}>
          &copy; {new Date().getFullYear()} SalonSync Inc. All rights reserved. Built for modern luxury salons.
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
