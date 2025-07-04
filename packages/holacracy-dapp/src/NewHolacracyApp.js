import React, { useState, useEffect, useRef } from 'react';
import { ethers } from "ethers";
import { HOLACRACY_FACTORY_ADDRESS, HOLACRACY_FACTORY_ABI } from "./contractInfo";
import NewHolacracyWizard from './NewHolacracyWizard';
import { TransactionPendingOverlay } from './NewHolacracyWizard';

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
  const [factoryContract, setFactoryContract] = useState(null);
  const [account, setAccount] = useState("");
  const [initiatives, setInitiatives] = useState([]); // [{id, name, creator, partnerCount, exists}]
  const [expandedInitiatives, setExpandedInitiatives] = useState([]); // array of expanded initiative ids
  const [partners, setPartners] = useState([]);
  const [hasSigned, setHasSigned] = useState(false);
  const [created, setCreated] = useState(false);
  const [newInitiativeName, setNewInitiativeName] = useState("");
  const [creatingInitiative, setCreatingInitiative] = useState(false);
  const [loadingInitiatives, setLoadingInitiatives] = useState(true);
  const [pendingTx, setPendingTx] = useState(false);
  const detailsRef = useRef(null);

  // Connect wallet handler
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
          setAccount("");
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

  // Fetch all initiatives
  useEffect(() => {
    async function fetchInitiatives() {
      if (!factoryContract) return;
      setLoadingInitiatives(true);
      try {
        const ids = await factoryContract.getInitiativeIds();
        const infos = await Promise.all(ids.map(async (id) => {
          const [iid, name, creator, partnerCount, exists] = await factoryContract.getInitiative(id);
          return { id: Number(iid), name, creator, partnerCount: Number(partnerCount), exists };
        }));
        setInitiatives(infos.filter(i => i.exists));
      } catch (e) {
        setInitiatives([]);
      }
      setLoadingInitiatives(false);
    }
    fetchInitiatives();
  }, [factoryContract, created, creatingInitiative]);

  // Fetch partners for all expanded initiatives
  useEffect(() => {
    async function fetchAllPartners() {
      if (!factoryContract || expandedInitiatives.length === 0) {
        setPartners([]);
        setHasSigned(false);
        return;
      }
      // Only fetch for the first expanded initiative (for now, for simplicity)
      // Optionally, you could fetch for all and store in a map
      const id = expandedInitiatives[0];
      try {
        const addrs = await factoryContract.getPreOrgPartners(id);
        setPartners(addrs);
        if (account && addrs.map(a => a.toLowerCase()).includes(account.toLowerCase())) {
          setHasSigned(true);
        } else {
          setHasSigned(false);
        }
      } catch (e) {
        setPartners([]);
        setHasSigned(false);
      }
    }
    fetchAllPartners();
  }, [factoryContract, expandedInitiatives, account, created]);

  // Scroll to details when an initiative is selected
  useEffect(() => {
    if (expandedInitiatives.length > 0 && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [expandedInitiatives]);

  // Create a new initiative
  const handleCreateInitiative = async () => {
    if (!factoryContract || !newInitiativeName.trim()) return;
    setCreatingInitiative(true);
    setPendingTx(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = factoryContract.connect(signer);
      const tx = await contractWithSigner.startPreOrgInitiative(newInitiativeName.trim());
      await tx.wait();
      setNewInitiativeName("");
      setExpandedInitiatives([]);
    } catch (e) {
      alert(e?.message || "Failed to create initiative");
    }
    setCreatingInitiative(false);
    setPendingTx(false);
  };

  // Sign as pre-org partner for selected initiative
  const handleSign = async () => {
    if (!factoryContract || expandedInitiatives.length === 0) return;
    setPendingTx(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = factoryContract.connect(signer);
      const tx = await contractWithSigner.signPreOrgConstitution(expandedInitiatives[0]);
      await tx.wait();
      setHasSigned(true);
      // Refresh partners
      const addrs = await factoryContract.getPreOrgPartners(expandedInitiatives[0]);
      setPartners(addrs);
      // Refresh initiatives list so partner count updates
      if (factoryContract) {
        const ids = await factoryContract.getInitiativeIds();
        const infos = await Promise.all(ids.map(async (id) => {
          const [iid, name, creator, partnerCount, exists] = await factoryContract.getInitiative(id);
          return { id: Number(iid), name, creator, partnerCount: Number(partnerCount), exists };
        }));
        setInitiatives(infos.filter(i => i.exists));
      }
    } catch (e) {
      alert(e?.message || "Failed to sign constitution");
    }
    setPendingTx(false);
  };

  // Cancel initiative (if allowed)
  const handleCancelInitiative = async (id) => {
    if (!factoryContract) return;
    setPendingTx(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = factoryContract.connect(signer);
      const tx = await contractWithSigner.cancelInitiative(id);
      await tx.wait();
      if (expandedInitiatives.includes(id)) {
        setExpandedInitiatives(expandedInitiatives.filter(i => i !== id));
      }
      // Refresh initiatives list after cancellation
      if (factoryContract) {
        const ids = await factoryContract.getInitiativeIds();
        const infos = await Promise.all(ids.map(async (id) => {
          const [iid, name, creator, partnerCount, exists] = await factoryContract.getInitiative(id);
          return { id: Number(iid), name, creator, partnerCount: Number(partnerCount), exists };
        }));
        setInitiatives(infos.filter(i => i.exists));
      }
    } catch (e) {
      alert(e?.message || "Failed to cancel initiative");
    }
    setPendingTx(false);
  };

  // UI
  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 0 0 0', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px rgba(44,62,80,0.07)', padding: 24, marginBottom: 32, textAlign: 'center' }}>
            <div style={{ marginBottom: 12, color: '#232946', fontSize: 16, fontStyle: 'italic' }}>
              In a Holacracy, all authority derives from the <a href="https://www.holacracy.org/constitution/5-0/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Constitution</a>, not from individuals.
            </div>
            <h2 style={{ marginTop: 24, marginBottom: 24 }}>Holacracy Organization Creation
              <a href="#contract-footnote" style={{ textDecoration: 'none' }}>
                <span style={{ color: '#4ecdc4', fontSize: 18, verticalAlign: 'super', cursor: 'pointer' }}>*</span>
              </a>
            </h2>
            <div style={{ color: '#232946', fontSize: 17, marginBottom: 18, lineHeight: 1.6, maxWidth: 650, padding: '0 24px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'justify' }}>
              This screen allows aspiring founding partners to create a new Holacratic organization. To do so, define a name for the new initiative, have all the co-founding partners join by signing the <a href="https://www.holacracy.org/constitution/5-0/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Holacracy Constitution 5.0.</a>, and finally launch the organization.
            </div>
            <div style={{ fontWeight: 400, fontSize: 15, color: '#bbb', margin: '10px auto 0 auto', maxWidth: 650, padding: '0 24px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'justify' }}>
              <b>Note:</b> According to the Holacracy Constitution, all partners in the organization are equal. Founding partners have no special rights compared to those who join later.
            </div>
            {!account && (
              <>
                <div style={{ color: '#232946', fontSize: 16, margin: '24px 0 8px 0' }}>
                  To get started, connect your wallet.
                </div>
                <div style={{ margin: '32px 0' }}>
                  <button onClick={handleConnectWallet} style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 8, padding: '16px 36px', fontWeight: 700, fontSize: 20, cursor: 'pointer', marginBottom: 8 }}>
                    Connect Wallet
                  </button>
                </div>
              </>
            )}
            {account && (
              <div style={{ margin: '18px 0 18px 0', color: '#888', fontSize: 14, textAlign: 'center' }}>
                Connected wallet: <span style={{ fontWeight: 500, color: '#232946' }}>{account}</span>
              </div>
            )}
          </div>
          {account && (
            <div style={{ margin: '32px 0' }}>
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12, color: '#232946', textAlign: 'left' }}>Initiatives</div>
              <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px rgba(44,62,80,0.07)', padding: 24, marginBottom: 18 }}>
                {loadingInitiatives ? (
                  <div>Loading initiatives...</div>
                ) : (
                  <>
                    {initiatives.length === 0 && <div>No initiatives yet. Start one below!</div>}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {initiatives.map(ini => {
                        const expanded = expandedInitiatives.includes(ini.id);
                        return (
                          <li key={ini.id} style={{ background: expanded ? '#e0f7fa' : '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8, margin: '8px 0', padding: 0, textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
                              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => {
                                setExpandedInitiatives(expanded ? expandedInitiatives.filter(id => id !== ini.id) : [...expandedInitiatives, ini.id]);
                              }}>
                                <b>{ini.name}</b> <span style={{ color: '#888', fontSize: 13 }}>({ini.partnerCount} partners)</span>
                              </div>
                              <button onClick={() => setExpandedInitiatives(expanded ? expandedInitiatives.filter(id => id !== ini.id) : [...expandedInitiatives, ini.id])} style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 10 }}>
                                {expanded ? 'Hide' : 'View'}
                              </button>
                            </div>
                            {expanded && (
                              <div style={{ background: '#fff', borderRadius: 0, boxShadow: 'none', padding: 24, borderTop: '1px solid #e0e0e0' }}>
                                <div style={{ color: '#888', fontSize: 15, marginBottom: 10 }}>Co-Founding Partners:</div>
                                <ul style={{ listStyle: 'none', padding: 0, marginTop: 8, marginBottom: 18 }}>
                                  {partners.length === 0 && <li>No partners yet. Be the first to join!</li>}
                                  {partners.map(addr => (
                                    <li key={addr} style={{ wordBreak: 'break-all', color: addr.toLowerCase() === account?.toLowerCase() ? '#4ecdc4' : '#232946' }}>
                                      {addr}
                                      {addr.toLowerCase() === account?.toLowerCase() && " (You)"}
                                    </li>
                                  ))}
                                </ul>
                                {!hasSigned && account && (
                                  <div style={{ marginBottom: 18 }}>
                                    <div style={{ color: '#232946', fontSize: 16, marginBottom: 10, fontWeight: 500 }}>
                                      To join as a co-founding partner for this initiative, you declare that you understand that in a Holacracy, all authority derives from the Constitution, not from individuals. You confirm your understanding by signing the <a href="https://www.holacracy.org/constitution/5-0/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Holacracy Constitution</a>.
                                    </div>
                                    <button
                                      onClick={handleSign}
                                      style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 32px', fontWeight: 700, fontSize: 18, cursor: 'pointer', marginBottom: 8, boxShadow: '0 2px 8px rgba(78,205,196,0.10)' }}
                                      title="By joining, you agree to the Holacracy Constitution and will be listed as a founding partner for this initiative."
                                    >
                                      Sign the Constitution
                                    </button>
                                  </div>
                                )}
                                {hasSigned && account && (
                                  <div style={{ color: '#4ecdc4', fontWeight: 600, fontSize: 16, marginBottom: 18 }}>
                                    You have already pre-registered as a founding partner for this initiative.
                                  </div>
                                )}
                                {hasSigned && !created && (
                                  <button
                                    style={{ marginTop: 12, background: '#232946', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                                    onClick={() => setCreated('wizard')}
                                  >
                                    Start Organization
                                  </button>
                                )}
                                {created === 'wizard' && (
                                  <NewHolacracyWizard initiativeId={ini.id} onClose={() => setCreated(false)} onCreated={() => setCreated('done')} />
                                )}
                                {created === 'done' && (
                                  <div style={{ color: '#4ecdc4', fontWeight: 700, fontSize: 22, marginTop: 40 }}>Holacracy created successfully!</div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
                <div style={{ marginTop: 24, textAlign: 'left' }}>
                  <input
                    type="text"
                    value={newInitiativeName}
                    onChange={e => setNewInitiativeName(e.target.value)}
                    placeholder="New initiative name"
                    style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15, width: 260, marginRight: 8 }}
                    disabled={creatingInitiative}
                  />
                  <button onClick={handleCreateInitiative} disabled={creatingInitiative || !newInitiativeName.trim()} style={{ background: '#232946', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                    {creatingInitiative ? 'Creating...' : 'Start New Initiative'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {pendingTx && <TransactionPendingOverlay />}
          <footer style={{ marginTop: 'auto', padding: '24px 0 12px 0', textAlign: 'center', color: '#888', fontSize: 14 }}>
            <div id="contract-footnote" style={{ color: '#888', fontSize: 15, textAlign: 'center' }}>
              <span style={{ color: '#4ecdc4', fontSize: 16, verticalAlign: 'super', marginRight: 4 }}>*</span>
              <a href="https://sepolia.etherscan.io/address/0xb324A8DC3a4488fc8333779828dF88e392731711#code" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline', fontSize: 15 }}>
                View Verified Contract Used for the Organisation Creation on Etherscan
              </a>
            </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default NewHolacracyApp; 