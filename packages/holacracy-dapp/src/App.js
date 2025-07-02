import React, { useState, useEffect } from 'react';
import './App.css';
import { ethers } from 'ethers';
import { CIRCLE_HIERARCHY_ADDRESS, CIRCLE_HIERARCHY_ABI } from './contractInfo';

const onboardingSteps = [
  {
    title: 'Welcome to Holacracy DApp',
    content: (
      <div style={{ color: 'inherit' }}>
        <p style={{ color: 'inherit', fontSize: 18, marginBottom: 12 }}>
          Experience self-management and decentralized governance.<br/>
          This DApp is your gateway to a new way of organizing and working together.
        </p>
      </div>
    ),
  },
  {
    title: 'What is Holacracy?',
    content: (
      <div style={{ color: 'inherit' }}>
        <p style={{ color: 'inherit', fontSize: 17, marginBottom: 12 }}>
          Holacracy is a framework for self-management and distributed authority.<br/>
          It replaces traditional management hierarchies with circles, roles, and clear governance processes.
        </p>
        <a href="https://www.holacracy.org/constitution/5-0/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline', fontSize: 15 }}>
          Read the Holacracy Constitution v5.0
        </a>
      </div>
    ),
  },
  {
    title: 'Circles, Roles, and Governance',
    content: (
      <div style={{ color: 'inherit' }}>
        <p style={{ color: 'inherit', fontSize: 17, marginBottom: 12 }}>
          <b>Circles</b> are teams with a shared purpose.<br/>
          <b>Roles</b> are specific responsibilities within circles.<br/>
          <b>Governance</b> is how circles evolve their structure and rules.
        </p>
      </div>
    ),
  },
  {
    title: 'How to Get Started',
    content: (
      <div style={{ color: 'inherit' }}>
        <p style={{ color: 'inherit', fontSize: 17, marginBottom: 12 }}>
          1. Connect your MetaMask wallet.<br/>
          2. Create or join a Circle.<br/>
          3. Take on roles, participate in governance, and collaborate!
        </p>
      </div>
    ),
  },
  {
    title: 'You are ready!',
    content: (
      <div style={{ color: 'inherit' }}>
        <p style={{ color: 'inherit', fontSize: 18, marginBottom: 12 }}>
          You're all set to explore and participate.<br/>
          Click <b>Let's Go!</b> to begin your Holacracy journey.
        </p>
      </div>
    ),
  },
];

function OnboardingModal({ onClose, onComplete, loading }) {
  const [step, setStep] = useState(0);
  const isLast = step === onboardingSteps.length - 1;
  const isFirst = step === 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,62,80,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#232946', borderRadius: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', padding: 40, maxWidth: 420, width: '90%', textAlign: 'center', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ color: '#4ecdc4', marginBottom: 18 }}>{onboardingSteps[step].title}</h2>
        <div style={{ marginBottom: 24, color: '#f5f6fa', fontSize: 17, lineHeight: 1.6 }}>{onboardingSteps[step].content}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={isFirst || loading} style={{ opacity: isFirst ? 0.5 : 1, background: 'none', border: 'none', color: '#4ecdc4', fontWeight: 600, fontSize: 16, cursor: isFirst ? 'default' : 'pointer' }}>Back</button>
          {!isLast ? (
            <button onClick={() => setStep(s => Math.min(onboardingSteps.length - 1, s + 1))} disabled={loading} style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Next</button>
          ) : (
            <button onClick={onComplete} disabled={loading} style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Registering...' : "Let's Go!"}</button>
          )}
        </div>
        <div style={{ position: 'absolute', top: 16, right: 20, cursor: 'pointer', color: '#aaa', fontSize: 22 }} onClick={onClose} title="Skip onboarding">×</div>
        <div style={{ marginTop: 18 }}>
          {onboardingSteps.map((_, i) => (
            <span key={i} style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: i === step ? '#4ecdc4' : '#eee', margin: '0 3px' }}></span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function TransactionPendingOverlay() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(44,62,80,0.65)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#232946',
        borderRadius: 18,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        padding: 40,
        maxWidth: 420,
        width: '90%',
        textAlign: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          border: '7px solid #4ecdc4',
          borderTop: '7px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 28,
          boxShadow: '0 0 20px rgba(78,205,196, 0.5)',
        }} />
        <h3 style={{ color: '#4ecdc4', marginBottom: 12, fontWeight: 700, letterSpacing: 1 }}>Transaction Pending</h3>
        <p style={{ color: '#fff', fontSize: 17, marginBottom: 0, opacity: 0.92 }}>
          Please wait while your transaction is being processed on the blockchain...
        </p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function SuccessPopup({ message, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 30,
      right: 30,
      background: '#232946',
      color: '#4ecdc4',
      padding: '18px 32px',
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(44,62,80,0.18)',
      fontWeight: 600,
      fontSize: 17,
      zIndex: 3000,
      opacity: 0.97,
      letterSpacing: 0.5,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: '#4ecdc4', color: '#232946', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 10 }}>OK</button>
    </div>
  );
}

function App() {
  const [account, setAccount] = useState(null);
  const [isPartner, setIsPartner] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
      } catch (error) {
        alert('Connection to MetaMask was rejected.');
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask and try again.');
    }
  };

  // Check partner status on account change
  useEffect(() => {
    async function checkPartner() {
      if (account) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(CIRCLE_HIERARCHY_ADDRESS, CIRCLE_HIERARCHY_ABI, provider);
          const partner = await contract.isPartner(account);
          setIsPartner(partner);
          setShowOnboarding(!partner);
        } catch (e) {
          setIsPartner(false);
          setShowOnboarding(true);
        }
      } else {
        setIsPartner(false);
        setShowOnboarding(false);
      }
    }
    checkPartner();
  }, [account]);

  // Onboarding complete: register as partner on-chain
  const handleOnboardingComplete = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CIRCLE_HIERARCHY_ADDRESS, CIRCLE_HIERARCHY_ABI, signer);
      const tx = await contract.joinAsPartner();
      await tx.wait();
      setIsPartner(true);
      setShowOnboarding(false);
      setShowSuccess(true);
    } catch (e) {
      alert('Failed to register as partner: ' + (e?.info?.error?.message || e.message));
    }
    setLoading(false);
  };

  return (
    <div className="App" style={{ textAlign: 'center', marginTop: '60px', fontFamily: 'Arial, sans-serif' }}>
      {loading && <TransactionPendingOverlay />}
      {showSuccess && <SuccessPopup message="You are now a partner!" onClose={() => setShowSuccess(false)} />}
      {!account ? (
        <div style={{ maxWidth: 420, margin: '0 auto', background: '#f8f9fa', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32 }}>
          <h1 style={{ color: '#2c3e50', marginBottom: 12 }}>Welcome to Holacracy DApp</h1>
          <p style={{ color: '#555', fontSize: 18, marginBottom: 24 }}>
            Experience self-management and decentralized governance.<br/>
            Connect your MetaMask wallet to get started!
          </p>
          <button onClick={connectWallet} style={{ fontSize: '1.2em', padding: '12px 32px', background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px rgba(78,205,196,0.15)' }}>
            Connect Wallet
          </button>
          <p style={{ color: '#888', fontSize: 14, marginTop: 18 }}>
            No account? <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Install MetaMask</a>
          </p>
        </div>
      ) : (
        <>
          {showOnboarding && (
            <OnboardingModal
              onClose={() => setShowOnboarding(false)}
              onComplete={handleOnboardingComplete}
              loading={loading}
            />
          )}
          {!showOnboarding && isPartner && (
            <div style={{ maxWidth: 420, margin: '0 auto', background: '#f8f9fa', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32 }}>
              <h1 style={{ color: '#2c3e50', marginBottom: 12 }}>Welcome, Partner!</h1>
              <p style={{ color: '#555', fontSize: 18, marginBottom: 16 }}>
                Your wallet is connected.<br/>
                <span style={{ fontWeight: 600, color: '#4ecdc4' }}>{account}</span>
              </p>
              <p style={{ color: '#888', fontSize: 16, marginBottom: 0 }}>
                Next: Explore or create your first Circle!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
