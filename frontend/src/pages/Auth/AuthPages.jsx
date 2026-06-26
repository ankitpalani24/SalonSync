import React, { useState } from 'react';
import { Mail, Lock, Phone, User, Home, MapPin, Building, Key } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const AuthPages = ({ defaultView = 'login', onAuthSuccess, onBackToLanding }) => {
  const { login, signup } = useApp();
  const [view, setView] = useState(defaultView); // 'login', 'signup', 'forgot', 'otp', 'reset'
  const [signupRole, setSignupRole] = useState('SALON_OWNER'); // 'SALON_OWNER', 'CLIENT'

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [salonName, setSalonName] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessType, setBusinessType] = useState('Premium Unisex Salon');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      onAuthSuccess();
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const payload = {
      ownerName, email, phone, password,
      role: signupRole,
      salonName: signupRole === 'CLIENT' ? '' : salonName,
      salonAddress: signupRole === 'CLIENT' ? '' : salonAddress,
      city: signupRole === 'CLIENT' ? '' : city,
      state: signupRole === 'CLIENT' ? '' : state,
      gstNumber: signupRole === 'CLIENT' ? '' : gstNumber,
      businessType: signupRole === 'CLIENT' ? '' : businessType
    };

    const result = await signup(payload);
    setLoading(false);
    if (result.success) {
      setSuccessMsg('Account registered successfully! Loading workspace...');
      setTimeout(() => {
        onAuthSuccess();
      }, 1500);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('A 6-digit OTP code has been sent to your email.');
      setView('otp');
    }, 1000);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('OTP Code verified. Please choose a new password.');
      setView('reset');
    }, 1000);
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView('login');
      setSuccessMsg('Password has been reset successfully. You can now login.');
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #181818 0%, #0a0a0a 100%)',
      padding: '2rem'
    }}>
      <div className="glass-card gold-border" style={{
        width: '100%',
        maxWidth: (view === 'signup' && signupRole === 'SALON_OWNER') ? '800px' : '450px',
        padding: '2.5rem',
        borderRadius: '12px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            onClick={onBackToLanding}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--gold-primary) 0%, #b38f20 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 'bold',
              margin: '0 auto 1rem auto',
              cursor: 'pointer'
            }}
          >SF</div>
          <h2 style={{ fontSize: '1.75rem', color: '#fff' }}>SalonSync</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {view === 'login' && 'Sign in to access your salon desk'}
            {view === 'signup' && 'Register your beauty enterprise'}
            {view === 'forgot' && 'Reset your password account credentials'}
            {view === 'otp' && 'Input the verification code'}
            {view === 'reset' && 'Create your new master passcode'}
          </p>

        </div>

        {/* Notices */}
        {errorMsg && (
          <div style={{
            background: 'var(--accent-red-bg)',
            color: 'var(--accent-red)',
            border: '1px solid rgba(231,76,60,0.2)',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: 'var(--accent-green-bg)',
            color: 'var(--accent-green)',
            border: '1px solid rgba(46,204,113,0.2)',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {successMsg}
          </div>
        )}

        {/* 1. LOGIN VIEW */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="alex@luxegold.com"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => { setView('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', fontSize: '0.75rem' }}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => { setView('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', fontWeight: 'bold' }}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* 2. SIGNUP VIEW */}
        {view === 'signup' && (
          <form onSubmit={handleSignupSubmit}>
            {/* Role Tab Toggle Selector */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.25rem', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setSignupRole('SALON_OWNER')}
                style={{
                  flex: 1,
                  background: signupRole === 'SALON_OWNER' ? 'var(--gold-primary)' : 'transparent',
                  color: signupRole === 'SALON_OWNER' ? '#000000' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Salon Enterprise
              </button>
              <button
                type="button"
                onClick={() => setSignupRole('CLIENT')}
                style={{
                  flex: 1,
                  background: signupRole === 'CLIENT' ? 'var(--gold-primary)' : 'transparent',
                  color: signupRole === 'CLIENT' ? '#000000' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Join as Client
              </button>
            </div>

            <div className={signupRole === 'SALON_OWNER' ? 'grid-2-cols-split' : ''} style={{ maxWidth: signupRole === 'CLIENT' ? '450px' : 'none', margin: '0 auto' }}>
              
              {/* Owner/Client Info Column */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.25rem', marginBottom: '1rem' }}>
                  {signupRole === 'CLIENT' ? 'Client Profile' : 'Owner Profile'}
                </h4>
                <div className="form-group">
                  <label>{signupRole === 'CLIENT' ? 'Client Full Name' : 'Owner Full Name'}</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input type="text" required placeholder={signupRole === 'CLIENT' ? 'Priyanka Chopra' : 'Alexander Wright'} className="form-control" style={{ paddingLeft: '2.5rem' }} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input type="email" required placeholder="alex@luxegold.com" className="form-control" style={{ paddingLeft: '2.5rem' }} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input type="text" required placeholder="+91 98765 43210" className="form-control" style={{ paddingLeft: '2.5rem' }} value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input type="password" required placeholder="••••••••" className="form-control" style={{ paddingLeft: '2.5rem' }} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Salon Info Column */}
              {signupRole === 'SALON_OWNER' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.25rem', marginBottom: '1rem' }}>
                    Salon Enterprise
                  </h4>
                  <div className="form-group">
                    <label>Salon / Parlor Name</label>
                    <div style={{ position: 'relative' }}>
                      <Building size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                      <input type="text" required placeholder="Luxe & Gold Salon" className="form-control" style={{ paddingLeft: '2.5rem' }} value={salonName} onChange={(e) => setSalonName(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Salon Address</label>
                    <div style={{ position: 'relative' }}>
                      <Home size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                      <input type="text" required placeholder="Signature Towers, 7th Ave" className="form-control" style={{ paddingLeft: '2.5rem' }} value={salonAddress} onChange={(e) => setSalonAddress(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid-2-cols">
                    <div className="form-group">
                      <label>City</label>
                      <input type="text" required placeholder="Mumbai" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input type="text" required placeholder="Maharashtra" className="form-control" value={state} onChange={(e) => setState(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid-2-cols">
                    <div className="form-group">
                      <label>GST Number</label>
                      <input type="text" placeholder="27AAAAA1111A1Z1" className="form-control" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Business Type</label>
                      <select className="form-control" value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                        <option>Premium Unisex Salon</option>
                        <option>Hair Salon / Barber Shop</option>
                        <option>Beauty Parlor & Bridal Studio</option>
                        <option>Luxury Wellness Spa</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <button type="submit" disabled={loading} className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
              {loading ? 'Creating Account Workspace...' : (signupRole === 'CLIENT' ? 'Register Client Portal Account' : 'Register Enterprise & Start Free Trial')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <button 
                type="button" 
                onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', fontWeight: 'bold' }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD VIEW */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <div className="form-group">
              <label>Enter Registered Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="alex@luxegold.com"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Send OTP Code
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setView('login')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* 4. OTP VIEW */}
        {view === 'otp' && (
          <form onSubmit={handleOtpSubmit}>
            <div className="form-group">
              <label>Enter 6-Digit OTP Code</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="123456"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', letterSpacing: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                A code was sent to your email. Enter 123456 to test immediately.
              </p>
            </div>

            <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Verify OTP
            </button>
          </form>
        )}

        {/* 5. RESET VIEW */}
        {view === 'reset' && (
          <form onSubmit={handleResetSubmit}>
            <div className="form-group">
              <label>Enter New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Reset Password
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthPages;
