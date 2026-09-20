import React, { useState, useEffect, useRef } from 'react';

/**
 * SalonSync Luxury Startup Splash Screen
 * Displays the transparent brand logo on a pure black background with smooth ambient glow and progress animation.
 */
const SplashScreen = ({ onFinish }) => {
  const [fadeState, setFadeState] = useState('in'); // 'in', 'out'
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // Phase 1: Hold presentation for 1.1s
    const holdTimer = setTimeout(() => {
      setFadeState('out');
    }, 1100);

    // Phase 2: Fade out and unmount at 1.45s
    const finishTimer = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, 1450);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(finishTimer);
    };
  }, []); // Run ONLY once on mount

  const handleDismiss = () => {
    setFadeState('out');
    setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, 200);
  };

  return (
    <div
      onClick={handleDismiss}
      className={`app-startup-splash-overlay ${fadeState === 'out' ? 'splash-fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'hidden',
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.5s ease',
        opacity: fadeState === 'out' ? 0 : 1,
        visibility: fadeState === 'out' ? 'hidden' : 'visible'
      }}
    >
      {/* Ambient background lighting effect */}
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(112, 130, 56, 0.22) 0%, rgba(212, 175, 55, 0.08) 40%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          animation: 'splashPulseAura 3s ease-in-out infinite alternate'
        }}
      />

      {/* Main Brand Logo Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          maxWidth: '90vw'
        }}
      >
        <img
          src="/splash-logo.png"
          alt="SalonSync - Beauty Meets Business"
          className="splash-logo-img"
          style={{
            width: 'clamp(240px, 62vw, 360px)',
            height: 'auto',
            maxHeight: '65vh',
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 24px rgba(112, 130, 56, 0.35))',
            animation: 'splashLogoScale 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        />

        {/* Slender Gold Progress Indicator */}
        <div
          style={{
            marginTop: '2rem',
            width: '120px',
            height: '2px',
            borderRadius: '2px',
            background: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              background: 'linear-gradient(90deg, #708238 0%, #d4af37 50%, #8b9b6a 100%)',
              borderRadius: '2px',
              animation: 'splashProgressFill 1.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.8)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
