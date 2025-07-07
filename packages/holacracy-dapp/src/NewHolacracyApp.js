import React, { useState, useEffect, useRef } from 'react';
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractInfo";
import NewHolacracyWizard from './NewHolacracyWizard';
import { TransactionPendingOverlay } from './NewHolacracyWizard';
import HolacracyOrganizationABI from './HolacracyOrganizationABI.json'; // You may need to export ABI for HolacracyOrganization

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
  const [partners, setPartners] = useState({}); // {initiativeId: [partnerAddresses]}
  const [loadingPartners, setLoadingPartners] = useState({}); // {initiativeId: boolean}

  const [created, setCreated] = useState({}); // {initiativeId: 'wizard' | 'done' | false}
  const [newInitiativeName, setNewInitiativeName] = useState("");
  const [newInitiativePurpose, setNewInitiativePurpose] = useState("");
  const [creatingInitiative, setCreatingInitiative] = useState(false);
  const [loadingInitiatives, setLoadingInitiatives] = useState(true);
  const [pendingTx, setPendingTx] = useState(false);
  const detailsRef = useRef(null);

  const [organizations, setOrganizations] = useState([]); // [{address, anchorPurpose, founders}]
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);

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

  // Connect wallet and refresh partner data if already connected
  const handleConnectWalletAndRefresh = async () => {
    if (account) {
      // If already connected, just refresh partner data for expanded initiatives
      if (factoryContract && expandedInitiatives.length > 0) {
        const newPartners = {};
        try {
          for (const id of expandedInitiatives) {
            const addrs = await factoryContract.getPreOrgPartners(id);
            newPartners[id] = addrs;
          }
          setPartners(newPartners);
          

        } catch (e) {
          console.error('Error refreshing partner data:', e);
        }
      }
    } else {
      // If not connected, connect wallet
      await handleConnectWallet();
    }
  };

  // Initialize contract
  useEffect(() => {
    if (window.ethereum) {
          console.log('Initializing contract with address:', CONTRACT_ADDRESS);
    const provider = new ethers.BrowserProvider(window.ethereum);
    setFactoryContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider));
      console.log('Contract initialized');
    } else {
      console.log('No ethereum provider found');
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
      if (!factoryContract) {
        console.log('No factory contract available');
        return;
      }
      setLoadingInitiatives(true);
      try {
        console.log('Fetching initiative IDs...');
        const ids = await factoryContract.getInitiativeIds();
        console.log('Initiative IDs:', ids);
        const infos = await Promise.all(ids.map(async (id) => {
          const [iid, name, purpose, creator, partnerCount, exists] = await factoryContract.getInitiative(id);
          return { id: Number(iid), name, purpose, creator, partnerCount: Number(partnerCount), exists };
        }));
        console.log('Initiative infos:', infos);
        setInitiatives(infos.filter(i => i.exists));
      } catch (e) {
        console.error('Error fetching initiatives:', e);
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
        setPartners({});
        setLoadingPartners({});
        return;
      }
      // Fetch partners for all expanded initiatives
      const newPartners = {};
      const newLoadingPartners = {};
      
      // Set loading state for all expanded initiatives
      expandedInitiatives.forEach(id => {
        newLoadingPartners[id] = true;
      });
      setLoadingPartners(newLoadingPartners);
      
      try {
        for (const id of expandedInitiatives) {
          const addrs = await factoryContract.getPreOrgPartners(id);
          newPartners[id] = addrs;
          newLoadingPartners[id] = false;
        }
        setPartners(newPartners);
        setLoadingPartners(newLoadingPartners);
      } catch (e) {
        console.error('Error fetching partners:', e);
        setPartners({});
        setLoadingPartners({});
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
    if (!factoryContract || !newInitiativeName.trim() || !newInitiativePurpose.trim()) return;
    setCreatingInitiative(true);
    setPendingTx(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = factoryContract.connect(signer);
      const tx = await contractWithSigner.startPreOrgInitiative(newInitiativeName.trim(), newInitiativePurpose.trim());
      await tx.wait();
      setNewInitiativeName("");
      setNewInitiativePurpose("");
      setExpandedInitiatives([]);
      setCreated({});
    } catch (e) {
      alert(e?.message || "Failed to create initiative");
    }
    setCreatingInitiative(false);
    setPendingTx(false);
  };

  // Sign as pre-org partner for selected initiative
  const handleSign = async (initiativeId) => {
    console.log('handleSign called with initiativeId:', initiativeId);
    console.log('factoryContract:', factoryContract);
    console.log('account:', account);
    
    if (!factoryContract || !account || initiativeId === null || initiativeId === undefined) {
      console.log('Early return - missing required parameters');
      return;
    }
    
    setPendingTx(true);
    try {
      console.log('Getting provider and signer...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = factoryContract.connect(signer);
      
      console.log('Calling signPreOrgConstitution...');
      const tx = await contractWithSigner.signPreOrgConstitution(initiativeId);
      console.log('Transaction sent:', tx.hash);
      
      console.log('Waiting for transaction...');
      await tx.wait();
      console.log('Transaction confirmed');
      
      // Refresh partners for this specific initiative
      console.log('Refreshing partners...');
      const addrs = await factoryContract.getPreOrgPartners(initiativeId);
      console.log('New partners:', addrs);
      
      setPartners(prev => ({
        ...prev,
        [initiativeId]: addrs
      }));

      // Refresh initiatives list so partner count updates
      if (factoryContract) {
        const ids = await factoryContract.getInitiativeIds();
        const infos = await Promise.all(ids.map(async (id) => {
          const [iid, name, purpose, creator, partnerCount, exists] = await factoryContract.getInitiative(id);
          return { id: Number(iid), name, purpose, creator, partnerCount: Number(partnerCount), exists };
        }));
        setInitiatives(infos.filter(i => i.exists));
      }
    } catch (e) {
      console.error('Error in handleSign:', e);
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
          const [iid, name, purpose, creator, partnerCount, exists] = await factoryContract.getInitiative(id);
          return { id: Number(iid), name, purpose, creator, partnerCount: Number(partnerCount), exists };
        }));
        setInitiatives(infos.filter(i => i.exists));
      }
    } catch (e) {
      alert(e?.message || "Failed to cancel initiative");
    }
    setPendingTx(false);
  };

  // Fetch all deployed organizations
  useEffect(() => {
    async function fetchOrganizations() {
      if (!factoryContract) return;
      setLoadingOrganizations(true);
      try {
        const orgAddresses = await factoryContract.getOrganizations();
        // Fetch mapping from org address to initiative ID
        const orgToInitiativeIds = await Promise.all(orgAddresses.map(async (orgAddr) => {
          try {
            // If the contract has getOrganizationInitiative, use it:
            const initiativeId = await factoryContract.getOrganizationInitiative(orgAddr);
            return { orgAddr, initiativeId: Number(initiativeId) };
          } catch {
            return { orgAddr, initiativeId: null };
          }
        }));
        // Build a map for quick lookup
        const orgToInitiativeMap = {};
        orgToInitiativeIds.forEach(({ orgAddr, initiativeId }) => {
          orgToInitiativeMap[orgAddr] = initiativeId;
        });
        // Fetch all initiatives (already in state, but ensure up-to-date)
        const ids = await factoryContract.getInitiativeIds();
        const initiativesList = await Promise.all(ids.map(async (id) => {
          const [iid, name, purpose, creator, partnerCount, exists] = await factoryContract.getInitiative(id);
          return { id: Number(iid), name, purpose, creator, partnerCount: Number(partnerCount), exists };
        }));
        // Build a map for quick lookup
        const initiativeMap = {};
        initiativesList.forEach(ini => {
          initiativeMap[ini.id] = ini;
        });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const orgs = await Promise.all(orgAddresses.map(async (orgAddr) => {
          try {
            const orgContract = new ethers.Contract(orgAddr, HolacracyOrganizationABI, provider);
            const anchorPurpose = await orgContract.circles(0).then(c => c.purpose);
            let founders = [];
            let i = 0;
            while (true) {
              try {
                const f = await orgContract.founders(i);
                founders.push(f);
                i++;
              } catch {
                break;
              }
            }
            const initiativeId = orgToInitiativeMap[orgAddr];
            const initiative = initiativeMap[initiativeId] || {};
            return {
              address: orgAddr,
              anchorPurpose,
              founders,
              initiativeName: initiative.name || '(Unknown)',
              initiativePurpose: initiative.purpose || anchorPurpose,
            };
          } catch (e) {
            return { address: orgAddr, anchorPurpose: 'N/A', founders: [], initiativeName: '(Unknown)', initiativePurpose: 'N/A' };
          }
        }));
        setOrganizations(orgs);
      } catch (e) {
        setOrganizations([]);
      }
      setLoadingOrganizations(false);
    }
    fetchOrganizations();
  }, [factoryContract, created]);

  // UI
  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 0 0 0', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px rgba(44,62,80,0.07)', padding: 24, marginBottom: 32, textAlign: 'center' }}>
            <div style={{ marginBottom: 12, color: '#232946', fontSize: 16, fontStyle: 'italic' }}>
              In a Holacracy, all authority derives from the <a href="https://www.holacracy.org/constitution/5-0/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Constitution</a>, not from individuals.
            </div>
            <h2 style={{ marginTop: 24, marginBottom: 24 }}>Holacracy Organization Launch
              <a href="#contract-footnote" style={{ textDecoration: 'none' }}>
                <span style={{ color: '#4ecdc4', fontSize: 18, verticalAlign: 'super', cursor: 'pointer' }}>*</span>
              </a>
            </h2>
            <div style={{ color: '#232946', fontSize: 17, marginBottom: 18, lineHeight: 1.6, maxWidth: 650, padding: '0 24px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'justify' }}>
              To launch a Holacracy Organisation, first define its name and its purpose and have the co-founding partners join by signing the constitution. Note that all partners in a Holacracy organization are equal and founding partners have no special rights compared to those who join later. Once all co-founding partners have joined, the initiative can be launched as an active Holacracy organization.
            </div>
            {!account && (
              <>
                <div style={{ color: '#232946', fontSize: 16, margin: '24px 0 8px 0' }}>
                  To get started, connect your wallet or explore initiatives.
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
          <div style={{ margin: '32px 0' }}>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12, color: '#232946', textAlign: 'left' }}>Initiatives</div>
            <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px rgba(44,62,80,0.07)', padding: 24, marginBottom: 18 }}>
              {loadingInitiatives ? (
                <div style={{ color: '#888', fontSize: 14 }}>Loading initiatives...</div>
              ) : (
                <>
                  {initiatives.length === 0 && (
                    <div style={{ color: '#888', fontSize: 14 }}>
                      No initiatives yet. {account ? 'Start one below!' : 'Connect your wallet to start one!'}
                      <br />
                      <button 
                        onClick={() => {
                          // Force refresh of initiatives
                          if (factoryContract) {
                            setLoadingInitiatives(true);
                            factoryContract.getInitiativeIds()
                              .then(ids => {
                                console.log('Retry - Initiative IDs:', ids);
                                return Promise.all(ids.map(async (id) => {
                                  const [iid, name, purpose, creator, partnerCount, exists] = await factoryContract.getInitiative(id);
                                  return { id: Number(iid), name, purpose, creator, partnerCount: Number(partnerCount), exists };
                                }));
                              })
                              .then(infos => {
                                console.log('Retry - Initiative infos:', infos);
                                setInitiatives(infos.filter(i => i.exists));
                                setLoadingInitiatives(false);
                              })
                              .catch(e => {
                                console.error('Retry - Error fetching initiatives:', e);
                                setInitiatives([]);
                                setLoadingInitiatives(false);
                              });
                          }
                        }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#4ecdc4', 
                          textDecoration: 'underline', 
                          cursor: 'pointer',
                          fontSize: 12,
                          marginTop: 4
                        }}
                      >
                        Retry loading initiatives
                      </button>
                    </div>
                  )}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {initiatives.map(ini => {
                      const expanded = expandedInitiatives.includes(ini.id);
                      return (
                        <li key={ini.id} style={{ background: expanded ? '#e0f7fa' : '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8, margin: '8px 0', padding: 0, textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => {
                              setExpandedInitiatives(expanded ? expandedInitiatives.filter(id => id !== ini.id) : [...expandedInitiatives, ini.id]);
                            }}>
                              <div>
                                <b>{ini.name}</b> <span style={{ color: '#888', fontSize: 13 }}>({ini.partnerCount} partners)</span>
                                <div style={{ color: '#666', fontSize: 13, marginTop: 2, fontStyle: 'italic' }}>
                                  {ini.purpose}
                                </div>
                                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                                  Created by: <span style={{ fontFamily: 'monospace', color: '#666' }}>{ini.creator}</span>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => setExpandedInitiatives(expanded ? expandedInitiatives.filter(id => id !== ini.id) : [...expandedInitiatives, ini.id])} style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 10 }}>
                              {expanded ? 'Hide' : 'View'}
                            </button>
                          </div>
                          {expanded && (
                            <div style={{ background: '#fff', borderRadius: 0, boxShadow: 'none', padding: 24, borderTop: '1px solid #e0e0e0' }}>
                              <div style={{ color: '#888', fontSize: 15, marginBottom: 10 }}>Co-Founding Partners:</div>
                              {loadingPartners[ini.id] ? (
                                <div style={{ color: '#888', fontSize: 14, marginBottom: 18 }}>
                                  Loading partners...
                                </div>
                              ) : (
                                <ul style={{ listStyle: 'none', padding: 0, marginTop: 8, marginBottom: 18 }}>
                                  {(!partners[ini.id] || partners[ini.id].length === 0) && (
                                    <li style={{ color: '#888', fontSize: 14 }}>
                                      {account ? 'No partners yet. Be the first to join!' : 'No partners yet. Connect your wallet to join!'}
                                      <br />
                                      <button 
                                        onClick={() => {
                                          // Trigger a refresh of partner data for this specific initiative
                                          if (factoryContract) {
                                            setLoadingPartners(prev => ({ ...prev, [ini.id]: true }));
                                            factoryContract.getPreOrgPartners(ini.id)
                                              .then(addrs => {
                                                setPartners(prev => ({ ...prev, [ini.id]: addrs }));
                                                setLoadingPartners(prev => ({ ...prev, [ini.id]: false }));
                                              })
                                              .catch(e => {
                                                console.error('Error refreshing partners:', e);
                                                setLoadingPartners(prev => ({ ...prev, [ini.id]: false }));
                                              });
                                          }
                                        }}
                                        style={{ 
                                          background: 'none', 
                                          border: 'none', 
                                          color: '#4ecdc4', 
                                          textDecoration: 'underline', 
                                          cursor: 'pointer',
                                          fontSize: 12,
                                          marginTop: 4
                                        }}
                                      >
                                        Retry
                                      </button>
                                    </li>
                                  )}
                                  {partners[ini.id] && partners[ini.id].map(addr => (
                                    <li key={addr} style={{ wordBreak: 'break-all', color: addr.toLowerCase() === account?.toLowerCase() ? '#4ecdc4' : '#232946' }}>
                                      {addr}
                                      {account && addr.toLowerCase() === account?.toLowerCase() && " (You)"}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {!account && (
                                <div style={{ marginBottom: 18 }}>
                                  <div style={{ color: '#232946', fontSize: 16, marginBottom: 10, fontWeight: 500 }}>
                                    Connect your wallet to join this initiative as a co-founding partner.
                                  </div>
                                  <button
                                    onClick={handleConnectWalletAndRefresh}
                                    style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 32px', fontWeight: 700, fontSize: 18, cursor: 'pointer', marginBottom: 8, boxShadow: '0 2px 8px rgba(78,205,196,0.10)' }}
                                  >
                                    Connect Wallet to Join
                                  </button>
                                </div>
                              )}
                              {(() => {
                                const shouldShowButton = account && (!partners[ini.id] || !partners[ini.id].map(a => a.toLowerCase()).includes(account.toLowerCase()));
                                console.log(`Initiative ${ini.id} - account:`, account, 'partners:', partners[ini.id], 'shouldShowButton:', shouldShowButton);
                                if (shouldShowButton) {
                                  console.log('Rendering Sign the Constitution button for initiative:', ini.id);
                                }
                                return shouldShowButton;
                              })() && (
                                <div style={{ marginBottom: 18 }}>
                                  <div style={{ color: '#232946', fontSize: 16, marginBottom: 10, fontWeight: 500 }}>
                                    To join as a co-founding partner for this initiative, you declare that you understand that <span style={{ color: '#1a5f7a', fontWeight: 600 }}>In a Holacracy, all authority derives from the Constitution, not from individuals</span>. You confirm your understanding by signing the <a href="https://www.holacracy.org/constitution/5.0/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Holacracy Constitution</a>.
                                  </div>
                                  <button
                                    onClick={() => {
                                      console.log('Sign the Constitution button clicked for initiative:', ini.id);
                                      handleSign(ini.id);
                                    }}
                                    disabled={pendingTx}
                                    style={{ 
                                      background: pendingTx ? '#ccc' : '#4ecdc4', 
                                      color: '#fff', 
                                      border: 'none', 
                                      borderRadius: 8, 
                                      padding: '14px 32px', 
                                      fontWeight: 700, 
                                      fontSize: 18, 
                                      cursor: pendingTx ? 'not-allowed' : 'pointer', 
                                      marginBottom: 8, 
                                      boxShadow: '0 2px 8px rgba(78,205,196,0.10)' 
                                    }}
                                    title="By joining, you agree to the Holacracy Constitution and will be listed as a founding partner for this initiative."
                                  >
                                    {pendingTx ? 'Signing...' : 'Sign the Constitution'}
                                  </button>
                                </div>
                              )}
                              {account && partners[ini.id] && partners[ini.id].map(a => a.toLowerCase()).includes(account.toLowerCase()) && (
                                <div style={{ color: '#4ecdc4', fontWeight: 600, fontSize: 16, marginBottom: 18 }}>
                                  You have already pre-registered as a founding partner for this initiative.
                                </div>
                              )}
                              {(() => {
                                const shouldShowStartButton = account && partners[ini.id] && partners[ini.id].map(a => a.toLowerCase()).includes(account.toLowerCase()) && !created[ini.id];
                                console.log(`Initiative ${ini.id} - shouldShowStartButton:`, shouldShowStartButton, 'account:', account, 'partners:', partners[ini.id], 'created:', created[ini.id]);
                                return shouldShowStartButton;
                              })() && (
                                <button
                                  style={{ marginTop: 12, background: '#232946', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                                  onClick={() => {
                                    console.log('Start Organization button clicked for initiative:', ini.id);
                                    setCreated(prev => ({ ...prev, [ini.id]: 'wizard' }));
                                  }}
                                >
                                  Launch Holacracy Organization
                                </button>
                              )}
                              {(() => {
                                const shouldShowWizard = created[ini.id] === 'wizard';
                                console.log(`Initiative ${ini.id} - shouldShowWizard:`, shouldShowWizard, 'created[ini.id]:', created[ini.id]);
                                return shouldShowWizard;
                              })() && (
                                <NewHolacracyWizard 
                                  initiativeId={ini.id} 
                                  initiativePurpose={ini.purpose}
                                  account={account}
                                  onClose={() => setCreated(prev => ({ ...prev, [ini.id]: false }))} 
                                  onCreated={() => setCreated(prev => ({ ...prev, [ini.id]: 'done' }))} 
                                />
                              )}
                              {created[ini.id] === 'done' && (
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
              {account && (
                <div style={{ marginTop: 24, textAlign: 'left' }}>
                  <input
                    type="text"
                    value={newInitiativeName}
                    onChange={e => setNewInitiativeName(e.target.value)}
                    placeholder="New initiative name"
                    style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15, width: 260, marginRight: 8 }}
                    disabled={creatingInitiative}
                  />
                  <input
                    type="text"
                    value={newInitiativePurpose}
                    onChange={e => setNewInitiativePurpose(e.target.value)}
                    placeholder="New initiative purpose"
                    style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15, width: 260, marginRight: 8 }}
                    disabled={creatingInitiative}
                  />
                  <div style={{ marginTop: 12 }}>
                    <button onClick={handleCreateInitiative} disabled={creatingInitiative || !newInitiativeName.trim() || !newInitiativePurpose.trim()} style={{ background: '#232946', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                      {creatingInitiative ? 'Creating...' : 'Launch Initiative'}
                    </button>
                  </div>
                </div>
              )}
              {!account && (
                <div style={{ marginTop: 24, textAlign: 'left', color: '#888', fontSize: 14 }}>
                  Connect your wallet to create a new initiative.
                </div>
              )}
            </div>
          </div>
          {/* Organizations List */}
          <div style={{ marginTop: 48 }}>
            <h3 style={{ color: '#232946', marginBottom: 16, textAlign: 'left' }}>Deployed Holacracy Organizations</h3>
            {loadingOrganizations ? (
              <div>Loading organizations...</div>
            ) : organizations.length === 0 ? (
              <div style={{ color: '#888' }}>No organizations deployed yet.</div>
            ) : (
              <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(44,62,80,0.07)', marginBottom: 32 }}>
                <thead>
                  <tr style={{ background: '#e3eaf2' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Purpose</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Founders</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org, idx) => (
                    <tr key={org.address} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px', wordBreak: 'break-all' }}>{org.initiativeName}</td>
                      <td style={{ padding: '8px 12px' }}>{org.initiativePurpose}</td>
                      <td style={{ padding: '8px 12px' }}>{org.founders.length}</td>
                      <td style={{ padding: '8px 12px', wordBreak: 'break-all' }}>
                        <a href={`https://sourcify.dev/#/lookup/${org.address}`} target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>{org.address}</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {pendingTx && <TransactionPendingOverlay />}
          <footer style={{ marginTop: 'auto', padding: '24px 0 12px 0', textAlign: 'center', color: '#888', fontSize: 14 }}>
            <div id="contract-footnote" style={{ color: '#888', fontSize: 15, textAlign: 'center' }}>
              <span style={{ color: '#4ecdc4', fontSize: 16, verticalAlign: 'super', marginRight: 4 }}>*</span>
              <a href="https://sepolia.etherscan.io/address/0x5caB957beDD933cfBaE532a706Cf55cdEbe07765#code" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline', fontSize: 15 }}>
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