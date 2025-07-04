import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { HOLACRACY_FACTORY_ADDRESS, HOLACRACY_FACTORY_ABI } from "./contractInfo";
import NewHolacracyWizard from './NewHolacracyWizard';

// ErrorBoundary component to catch uncaught errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: 24, textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{this.state.error?.message || String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function NewHolacracyApp() {
  const [created, setCreated] = useState(false);
  const [preOrgPartners, setPreOrgPartners] = useState([]);
  const [hasSigned, setHasSigned] = useState(false);
  const [factoryContract, setFactoryContract] = useState(null);
  const [account, setAccount] = useState("");

  // Connect wallet handler (manual, not auto)
  const handleConnectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } else {
        alert('MetaMask is not installed.');
      }
    } catch (e) {
      console.error('Error getting account:', e);
      alert(e?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e)) || 'Error connecting wallet.');
    }
  };

  // Initialize contract
  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setFactoryContract(new ethers.Contract(HOLACRACY_FACTORY_ADDRESS, HOLACRACY_FACTORY_ABI, provider));
    }
  }, []);

  // Listen for wallet account changes and handle disconnects
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // Wallet disconnected
          setAccount("");
          setHasSigned(false);
          setPreOrgPartners([]);
          setFactoryContract(null);
        } else {
          setAccount(accounts[0]);
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  // Fetch pre-org partners
  useEffect(() => {
    async function fetchPreOrgPartners() {
      if (factoryContract) {
        try {
          const partners = await factoryContract.getPreOrgPartners();
          setPreOrgPartners(partners);
          if (account && partners.map(a => a.toLowerCase()).includes(account.toLowerCase())) {
            setHasSigned(true);
          } else {
            setHasSigned(false);
          }
        } catch (e) {
          console.error("Error fetching pre-org partners:", e);
        }
      } else {
        setPreOrgPartners([]);
        setHasSigned(false);
      }
    }
    fetchPreOrgPartners();
  }, [factoryContract, account]);

  // Sign as pre-org partner
  const handleSign = async () => {
    if (factoryContract && account) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractWithSigner = factoryContract.connect(signer);
        await contractWithSigner.signPreOrgConstitution();
        setHasSigned(true);
        // Refresh the list
        const partners = await factoryContract.getPreOrgPartners();
        setPreOrgPartners(partners);
      } catch (e) {
        console.error("Error signing constitution:", e);
        alert(e?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e)) || "An error occurred. Please reconnect your wallet.");
      }
    } else {
      alert("Please connect your wallet to sign the constitution.");
    }
  };

  // Note: The original App.js page is now accessible at any non-root, non-/create path (e.g. /home, /legacy, /anything)

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 0 0 0', textAlign: 'center' }}>
          <h2>Welcome to Holacracy Organization Creation</h2>
          <div style={{ marginBottom: 20, color: '#232946', fontSize: 17, lineHeight: 1.6 }}>
            <p><b>Ready to create a self-managing organization?</b></p>
            <p>
              Holacracy is a new way of running an organization that empowers every partner to take initiative and drive meaningful work. Here, you can:
            </p>
            <ul style={{ textAlign: 'left', margin: '0 auto', maxWidth: 500, color: '#232946', fontSize: 16 }}>
              <li><b>Pre-register as a partner</b> by signing the <a href="https://www.holacracy.org/constitution/5-0/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Holacracy Constitution 5.0</a>.</li>
              <li><b>See who else has joined</b> as a potential founder.</li>
              <li><b>Launch your Holacratic organization</b> together with your co-founders, using the pre-registered partner list.</li>
            </ul>
            <p style={{ marginTop: 18 }}>
              To get started, connect your wallet and pre-register as a partner. Once your founding team is ready, you can create your organization in just a few clicks!
            </p>
          </div>
          {!account ? (
            <button onClick={handleConnectWallet} style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginBottom: 18 }}>
              Connect Wallet
            </button>
          ) : (
            hasSigned ? (
              <p style={{ color: 'green' }}>You have pre-registered as a partner.</p>
            ) : (
              <button onClick={handleSign} style={{ background: '#232946', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginBottom: 18 }}>
                Pre-register as a Partner
              </button>
            )
          )}
          <h3 style={{ marginTop: 32 }}>Current Pre-Registered Partners:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {!account && preOrgPartners.length === 0 && (
              <li>Connect a wallet to see the list of pre-registered partners.</li>
            )}
            {account && preOrgPartners.length === 0 && (
              <li>No partners yet. Be the first to join!</li>
            )}
            {preOrgPartners.length > 0 && preOrgPartners.map(addr => (
              <li key={addr} style={{ wordBreak: 'break-all', color: addr.toLowerCase() === account?.toLowerCase() ? '#4ecdc4' : '#232946' }}>
                {addr}
                {addr.toLowerCase() === account?.toLowerCase() && " (You)"}
              </li>
            ))}
          </ul>
          {/* Show a button to start the wizard only if the user has signed and org not yet created */}
          {hasSigned && !created && (
            <button
              style={{ marginTop: 24, background: '#232946', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
              onClick={() => setCreated('wizard')}
            >
              Start Organization Wizard
            </button>
          )}
          {/* Show the wizard only if the user has chosen to start it */}
          {created === 'wizard' && (
            <NewHolacracyWizard onClose={() => setCreated(false)} onCreated={() => setCreated('done')} />
          )}
          {created === 'done' && (
            <div style={{ color: '#4ecdc4', fontWeight: 700, fontSize: 22, marginTop: 60 }}>Holacracy created successfully!</div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default NewHolacracyApp; 