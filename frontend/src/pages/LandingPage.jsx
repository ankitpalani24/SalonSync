import React from 'react';
import { 
  Check, Play, Sparkles, Shield, Clock, Smartphone, 
  MessageSquare, Users, CreditCard, BarChart3, Scissors, Network 
} from 'lucide-react';

const LandingPage = ({ onStartTrial, onLogin }) => {
  const features = [
    { title: 'Customer CRM', desc: 'Secure database tracking client histories, service preferences, and before-and-after photo portfolios.', icon: Users },
    { title: 'Smart Appointments', desc: 'Real-time booking calendar minimizing overlaps with automated staff roster allocation.', icon: Clock },
    { title: 'Invoices & Billing', desc: 'Generate professional invoices, handle UPI/Cards, and trigger automated stock reductions.', icon: CreditCard },
    { title: 'Inventory Management', desc: 'Track products, trigger automatic stock out deductions on completions, and log supplier dues.', icon: Scissors },
    { title: 'Expense Tracker', desc: 'Log salon rents, salaries, utilities, and marketing costs to compile accurate profit sheets.', icon: Shield },
    { title: 'Staff & Commissions', desc: 'Roster schedule matching with automatic shift check-in logging and commission calculators.', icon: Check },
    { title: 'Membership System', desc: 'Manage Silver, Gold, Platinum loyalty tiers with custom discount triggers.', icon: Sparkles },
    { title: 'Loyalty Rewards', desc: 'Award points on every ₹100 spent and track points redemption catalogs.', icon: AwardIcon },
    { title: 'Multi-Branch Engine', desc: 'Centralized reports for franchise owners to rank, compare, and coordinate locations.', icon: Network },
    { title: 'Service Packages', desc: 'Combine haircuts, spa sessions, and skincare into custom discounted promotional bundles.', icon: Sparkles },
    { title: 'WhatsApp Automations', desc: 'Simulate automated reminders, holiday wishes, and digital bill sends to users.', icon: MessageSquare },
    { title: 'Business Analytics', desc: 'Compiles profit/loss trends, peak booking hours, and retention percentages.', icon: BarChart3 },
  ];

  function AwardIcon(props) {
    return <Sparkles {...props} style={{ color: 'var(--gold-primary)' }} />;
  }

  return (
    <div style={{ background: '#080808', color: '#fff', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* Header Nav */}
      <nav className="landing-nav" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 4rem',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
        position: 'sticky',
        top: 0,
        background: 'rgba(8,8,8,0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--gold-primary) 0%, #b38f20 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 'bold'
          }}>SS</div>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '1px', color: '#fff' }}>
            SalonSync
          </span>
        </div>
        <div className="hide-mobile" style={{ display: 'flex', gap: '2rem' }}>
          <a href="#features" style={{ color: '#aaa', fontSize: '0.9rem' }}>Features</a>
          <a href="#pricing" style={{ color: '#aaa', fontSize: '0.9rem' }}>Pricing</a>
          <a href="#testimonials" style={{ color: '#aaa', fontSize: '0.9rem' }}>Reviews</a>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={onLogin} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>
            Log In
          </button>
          <button onClick={onStartTrial} className="gold-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            Start Trial
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '6rem 2rem 4rem 2rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at center, rgba(212,175,55,0.1) 0%, rgba(8,8,8,0) 70%)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 1rem',
            background: 'rgba(212,175,55,0.05)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '20px',
            fontSize: '0.8rem',
            color: 'var(--gold-primary)',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={14} /> Next-Gen Enterprise Salon Management
          </div>
          
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            lineHeight: '1.2',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 40%, var(--gold-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-serif)'
          }}>
            Manage Your Salon Business Smarter
          </h1>
          
          <p style={{
            fontSize: '1.15rem',
            color: '#bbb',
            lineHeight: '1.6',
            marginBottom: '2.5rem',
            maxWidth: '750px',
            margin: '0 auto 2.5rem auto'
          }}>
            Customer CRM, Smart Booking Calendars, Billing Terminal, Automatic Inventory, Staff Commission Trackers, Profit Engines, and Comprehensive Analytics—all in one gorgeous, luxury dashboard.
          </p>

          <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
            <button onClick={onStartTrial} className="gold-btn" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem' }}>
              Start Free Trial
            </button>
            <button onClick={onStartTrial} className="outline-btn" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem' }}>
              <Play size={16} fill="var(--gold-primary)" /> Book Demo
            </button>
          </div>

          {/* Interactive Mockup */}
          <div className="glass-card" style={{
            maxWidth: '1000px',
            margin: '0 auto',
            border: '1px solid var(--border-gold)',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            transform: 'perspective(800px) rotateX(5deg)',
            background: '#111'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '1px' }}>SALONSYNC WORKSPACE</span>
              <div style={{ width: '40px' }}></div>
            </div>
            
            <div className="landing-mock-grid">
              {/* Mock Sidebar */}
              <div className="landing-mock-sidebar" style={{ background: '#0c0c0c', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ height: '8px', background: 'rgba(212,175,55,0.3)', width: '60%', borderRadius: '4px', marginBottom: '1.25rem' }}></div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: i === 1 ? 'var(--gold-primary)' : '#333' }}></div>
                    <div style={{ height: '6px', background: i === 1 ? '#fff' : '#666', width: i === 2 ? '70%' : '50%', borderRadius: '3px' }}></div>
                  </div>
                ))}
              </div>
              
              {/* Mock Dashboard Widgets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Today Revenue', val: '₹14,500', color: 'var(--gold-primary)' },
                    { label: 'Total Customers', val: '432', color: '#fff' },
                    { label: 'Low Stock Items', val: '2 Alerts', color: '#ff4d4d' }
                  ].map((tile, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0.75rem' }}>
                      <p style={{ fontSize: '0.6rem', color: '#777' }}>{tile.label}</p>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: tile.color, marginTop: '0.25rem' }}>{tile.val}</h4>
                    </div>
                  ))}
                </div>
                
                {/* Mock Chart Area */}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--gold-primary)', fontWeight: '600' }}>MONTHLY NET PROFIT ENGINE</span>
                    <span style={{ fontSize: '0.6rem', color: '#555' }}>UPDATED 5M AGO</span>
                  </div>
                  {/* SVG line animation mock */}
                  <svg width="100%" height="100" viewBox="0 0 500 100" style={{ marginTop: '0.5rem' }}>
                    <path d="M0,80 Q75,30 150,60 T300,20 T450,40 L500,10" fill="none" stroke="var(--gold-primary)" strokeWidth="3" />
                    <path d="M0,80 Q75,30 150,60 T300,20 T450,40 L500,10 L500,100 L0,100 Z" fill="rgba(212,175,55,0.05)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '6rem 2rem', background: '#0b0b0b', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>
              Everything Required to Run Your Salon Empire
            </h2>
            <p style={{ color: '#888', maxWidth: '600px', margin: '0 auto' }}>
              We combined daily operations with financial suites and marketing algorithms to provide the ultimate business workspace.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {features.map((f, i) => {
              const IconComp = f.icon;
              return (
                <div key={i} className="glass-card" style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'var(--gold-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComp size={20} style={{ color: 'var(--gold-primary)' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#fff' }}>{f.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: '1.5' }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>
              Flexible Enterprise Pricing Plans
            </h2>
            <p style={{ color: '#888' }}>Select the package tailored for your salon scale. Cancel or switch anytime.</p>
          </div>

          <div className="grid-3-cols">
            {[
              { name: 'Starter', price: '₹1,999', target: 'Single Salon / Spa', features: ['Customer CRM Directory', '1 Branch Included', 'Appointment Roster Calendar', 'Basic Invoicing & Billing', 'Email Activity Alerts'] },
              { name: 'Professional', price: '₹4,999', target: 'Growing Businesses', features: ['Advanced CRM Profiles', 'Up to 3 Branches Supported', 'Loyalty Program Modules', 'Full Inventory Management', 'Staff Commissions System', 'AI Assistant (50 prompts/mo)'] },
              { name: 'Enterprise', price: '₹9,999', target: 'Franchise Chains', features: ['Unlimited Branches', 'Centralized Franchise Admin', 'WhatsApp Automations', 'Unlimited AI Insights', 'Suppliers Ledger Tracker', 'Dedicated 24/7 Account Manager'] }
            ].map((plan, i) => (
              <div key={i} className="glass-card" style={{
                background: plan.name === 'Professional' ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.01)',
                border: plan.name === 'Professional' ? '1px solid var(--gold-primary)' : '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '2.5rem 2rem',
                position: 'relative'
              }}>
                {plan.name === 'Professional' && (
                  <span style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: 'var(--gold-primary)',
                    color: '#000',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '10px'
                  }}>RECOMMENDED</span>
                )}
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.25rem' }}>{plan.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '1.5rem' }}>{plan.target}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{plan.price}</span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>/ month</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                    {plan.features.map((feat, fidx) => (
                      <div key={fidx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: '#ccc' }}>
                        <Check size={14} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={onStartTrial} className={plan.name === 'Professional' ? 'gold-btn' : 'outline-btn'} style={{ width: '100%', justifyContent: 'center' }}>
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" style={{ padding: '6rem 2rem', background: '#0b0b0b' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>Loved by Leading Brands</h2>
            <p style={{ color: '#888' }}>Here is what elite beauty franchises say about SalonSync.</p>
          </div>

          <div className="grid-2-cols-split">
            {[
              { quote: "SalonSync replaced three different systems for us. Our bookings, checkout and staff commissions are now completely automated. The design matches our luxury brand identity.", author: "Monica Geller", role: "Owner, Velvet Spa Salon" },
              { quote: "The profit and loss engine and the multi-branch comparisons are game changers for franchise chains. I can see live reports for both Mumbai locations instantly.", author: "David Beckham", role: "Director, Groom & Co Barber franchise" }
            ].map((test, i) => (
              <div key={i} className="glass-card" style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)' }}>
                <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  "{test.quote}"
                </p>
                <div>
                  <h5 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>{test.author}</h5>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 4rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#070707',
        fontSize: '0.8rem',
        color: '#666'
      }}>
        <p>&copy; {new Date().getFullYear()} SalonSync Inc. All rights reserved.</p>
        <p>Enterprise SaaS Platform for Premium Beauty Outlets.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
