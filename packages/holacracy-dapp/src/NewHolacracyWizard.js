import React, { useState, useEffect } from 'react';

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function NewHolacracyWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [founders, setFounders] = useState([]);
  const [anchorPurpose, setAnchorPurpose] = useState('');
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [account, setAccount] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [agreeConstitution, setAgreeConstitution] = useState(false);

  // Wallet connect handler
  const connectWallet = async () => {
    setConnecting(true);
    setConnectError('');
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setFounders([accounts[0]]);
        setStep(1);
      } catch (e) {
        setConnectError('Wallet connection was rejected.');
      }
    } else {
      setConnectError('MetaMask is not installed.');
    }
    setConnecting(false);
  };

  // Handlers for founder address fields
  const handleFounderChange = (idx, value) => {
    setFounders(f => f.map((a, i) => (i === idx ? value : a)));
  };
  const addFounder = () => setFounders(f => [...f, '']);
  const removeFounder = idx => setFounders(f => f.filter((_, i) => i !== idx));

  const allValid = founders.length > 0 && founders.every(isValidAddress);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,62,80,0.25)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(44,62,80,0.18)', padding: 36, minWidth: 340, maxWidth: 420, width: '90%' }}>
        <h2 style={{ color: '#232946', marginBottom: 18 }}>Create New Holacracy</h2>
        <div style={{ minHeight: 120 }}>
          {step === 0 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 18 }}>Step 1: Connect your wallet</div>
              <button
                onClick={connectWallet}
                disabled={connecting}
                style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginBottom: 12 }}
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
              {account && (
                <div style={{ color: '#232946', fontSize: 15, marginTop: 10 }}>
                  Connected: <span style={{ color: '#4ecdc4', fontWeight: 600 }}>{account}</span>
                </div>
              )}
              {connectError && <div style={{ color: '#ee6c4d', fontSize: 14, marginTop: 10 }}>{connectError}</div>}
            </div>
          )}
          {step === 1 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Step 2: Enter founder addresses</div>
              {founders.map((addr, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="text"
                    value={addr}
                    onChange={e => handleFounderChange(idx, e.target.value)}
                    placeholder="0x..."
                    style={{ flex: 1, padding: 8, border: isValidAddress(addr) ? '1px solid #ccc' : '1px solid #ee6c4d', borderRadius: 6, fontSize: 15 }}
                    disabled={idx === 0 && account === addr}
                  />
                  {founders.length > 1 && (idx !== 0 || account !== addr) && (
                    <button onClick={() => removeFounder(idx)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#ee6c4d', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addFounder} style={{ marginTop: 8, background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>+ Add Founder</button>
              <div style={{ color: '#ee6c4d', fontSize: 13, marginTop: 8, minHeight: 18 }}>
                {!allValid && founders.some(f => f && !isValidAddress(f)) && 'Please enter valid Ethereum addresses.'}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Step 3: Agree to the Holacracy Constitution</div>
              <div style={{
                maxHeight: 180,
                overflowY: 'auto',
                background: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: 16,
                fontSize: 15,
                color: '#232946',
                marginBottom: 16
              }}>
                <b>Preamble (excerpt):</b><br/>
                “This organization is governed by the <a href="https://www.holacracy.org/constitution/5-0/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Holacracy Constitution 5.0</a>. All authority derives from this Constitution, not from individuals.”<br/><br/>
                By checking the box below, you agree to be bound by the Holacracy Constitution 5.0 as the formal authority structure of this organization.
              </div>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: 15 }}>
                <input
                  type="checkbox"
                  checked={agreeConstitution}
                  onChange={e => setAgreeConstitution(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                I have read the Holacracy Constitution and agree that all authority in this organisation derives from this Constitution, not from individuals.
              </label>
            </div>
          )}
          {step === 3 && <div>Step 4: Enter anchor circle purpose (UI coming soon)</div>}
          {step === 4 && <div>Step 5: Define initial roles (UI coming soon)</div>}
          {step === 5 && <div>Step 6: Assign founders to roles (UI coming soon)</div>}
          {step === 6 && <div>Step 7: Deploy organization (UI coming soon)</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
          {step < 6 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 0 && !account) ||
                (step === 1 && !allValid) ||
                (step === 2 && !agreeConstitution)
              }
            >
              Next
            </button>
          ) : (
            <button onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewHolacracyWizard; 