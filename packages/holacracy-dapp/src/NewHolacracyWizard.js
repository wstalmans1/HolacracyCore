import React, { useState, useEffect, useRef } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractInfo';
import { ethers } from 'ethers';

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function NewHolacracyWizard({ initiativeId, initiativePurpose, account: parentAccount, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [founders, setFounders] = useState([]);
  const [roles, setRoles] = useState([
    { name: '', purpose: '', domains: [''], accountabilities: [''] }
  ]);
  const [assignments, setAssignments] = useState([]);
  const [account, setAccount] = useState(parentAccount || '');
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [preOrgPartners, setPreOrgPartners] = useState([]);
  const [factoryContract, setFactoryContract] = useState(null);
  const [hasSigned, setHasSigned] = useState(false);

  // For focusing new domain/accountability fields
  const domainRefs = useRef({});
  const accRefs = useRef({});
  const [focusField, setFocusField] = useState(null); // { type: 'domain'|'acc', roleIdx, fieldIdx }



  // Focus effect for new domain/accountability
  useEffect(() => {
    if (focusField) {
      if (focusField.type === 'domain' && domainRefs.current[focusField.roleIdx]?.[focusField.fieldIdx]) {
        domainRefs.current[focusField.roleIdx][focusField.fieldIdx].focus();
      } else if (focusField.type === 'acc' && accRefs.current[focusField.roleIdx]?.[focusField.fieldIdx]) {
        accRefs.current[focusField.roleIdx][focusField.fieldIdx].focus();
      }
      setFocusField(null);
    }
  }, [roles, focusField]);

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setFactoryContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider));
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount("");
          setHasSigned(false);
          setFactoryContract(null);
        } else {
          setAccount(accounts[0]);
          // Fetch pre-org partners when account changes
          if (factoryContract) {
            factoryContract.getPreOrgPartners(initiativeId).then(setPreOrgPartners);
          }
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [factoryContract]);

  useEffect(() => {
    if (!factoryContract) return;
    const interval = setInterval(async () => {
      try {
        const partners = await factoryContract.getPreOrgPartners(initiativeId);
        setPreOrgPartners(partners);
        // Set founders to all partners if not already set
        if (partners.length > 0 && founders.length === 0) {
          setFounders(partners);
        }
      } catch (e) {
        // ignore
      }
    }, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, [factoryContract, founders.length]);

  console.log('NewHolacracyWizard render - account:', account, 'parentAccount:', parentAccount, 'initiativeId:', initiativeId);

  const handleSign = async () => {
    if (factoryContract) {
      await factoryContract.signPreOrgConstitution();
      // ... rest of your logic ...
    }
  };

  // Function to verify contract on Sourcify
  const verifyOnSourcify = async (contractAddress, constructorArgs) => {
    try {
      // Call our verification service
      const response = await fetch('http://localhost:3001/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contractAddress,
          constructorArgs: constructorArgs || []
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('Contract verification initiated');
        return result.sourcifyUrl;
      } else {
        console.log('Verification failed:', result.message);
        return null;
      }
    } catch (error) {
      console.error('Verification error:', error);
      return null;
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,62,80,0.25)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(44,62,80,0.18)', padding: 0, minWidth: 340, maxWidth: 420, width: '90%', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ padding: 36, overflowY: 'auto', flex: 1, minHeight: 120 }}>
          {deploying && <TransactionPendingOverlay />}
          <h2 style={{ color: '#232946', marginBottom: 18 }}>Create New Holacracy</h2>
          {step === 0 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Step 1: Define Initial Roles</div>
              <div style={{ fontSize: 15, color: '#555', marginBottom: 10 }}>
                In Holacracy, all work is organized through clear roles, not job titles or people.<br/>
                <br/>
                <b>Each role</b> should have a clear name and a purpose—what it exists to achieve.<br/>
                <br/>
                You can also specify:<br/>
                <b>Domains:</b> What assets or resources this role controls.<br/>
                <b>Accountabilities:</b> Ongoing activities or responsibilities for the role.<br/>
                <br/>
                Start with the key roles needed to get your organization moving. You can always add or evolve roles later through governance.
              </div>
              {roles.map((role, idx) => (
                <div key={idx} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, marginBottom: 14, background: '#f8f9fa' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
                    <input
                      type="text"
                      value={role.name}
                      onChange={e => setRoles(r => r.map((ro, i) => i === idx ? { ...ro, name: e.target.value } : ro))}
                      placeholder="Role name"
                      style={{ width: '100%', padding: 7, border: '1px solid #ccc', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      value={role.purpose}
                      onChange={e => setRoles(r => r.map((ro, i) => i === idx ? { ...ro, purpose: e.target.value } : ro))}
                      placeholder="Purpose"
                      style={{ width: '100%', padding: 7, border: '1px solid #ccc', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
                    />
                    {roles.length > 1 && (
                      <button onClick={() => setRoles(r => r.filter((_, i) => i !== idx))} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#ee6c4d', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>×</button>
                    )}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 14, color: '#888' }}>Domains:</label>
                    {role.domains.map((domain, dIdx) => (
                      <div key={dIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <input
                          type="text"
                          value={domain}
                          onChange={e => setRoles(r => r.map((ro, i) => i === idx ? { ...ro, domains: ro.domains.map((d, j) => j === dIdx ? e.target.value : d) } : ro))}
                          placeholder="Domain"
                          style={{ flex: 1, padding: 6, border: '1px solid #ccc', borderRadius: 6, fontSize: 14 }}
                          ref={el => {
                            if (!domainRefs.current) domainRefs.current = {};
                            if (!domainRefs.current[idx]) domainRefs.current[idx] = [];
                            domainRefs.current[idx][dIdx] = el;
                          }}
                        />
                        {role.domains.length > 1 && (
                          <button onClick={() => setRoles(r => r.map((ro, i) => i === idx ? { ...ro, domains: ro.domains.filter((_, j) => j !== dIdx) } : ro))} style={{ marginLeft: 6, background: 'none', border: 'none', color: '#ee6c4d', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => {
                      setRoles(r => r.map((ro, i) => i === idx ? { ...ro, domains: [...ro.domains, ''] } : ro));
                      setFocusField({ type: 'domain', roleIdx: idx, fieldIdx: role.domains.length });
                    }} style={{ marginTop: 2, background: '#e0e0e0', color: '#232946', border: 'none', borderRadius: 6, padding: '3px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Domain</button>
                  </div>
                  <div>
                    <label style={{ fontSize: 14, color: '#888' }}>Accountabilities:</label>
                    {role.accountabilities.map((acc, aIdx) => (
                      <div key={aIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <input
                          type="text"
                          value={acc}
                          onChange={e => setRoles(r => r.map((ro, i) => i === idx ? { ...ro, accountabilities: ro.accountabilities.map((a, j) => j === aIdx ? e.target.value : a) } : ro))}
                          placeholder="Accountability"
                          style={{ flex: 1, padding: 6, border: '1px solid #ccc', borderRadius: 6, fontSize: 14 }}
                          ref={el => {
                            if (!accRefs.current) accRefs.current = {};
                            if (!accRefs.current[idx]) accRefs.current[idx] = [];
                            accRefs.current[idx][aIdx] = el;
                          }}
                        />
                        {role.accountabilities.length > 1 && (
                          <button onClick={() => setRoles(r => r.map((ro, i) => i === idx ? { ...ro, accountabilities: ro.accountabilities.filter((_, j) => j !== aIdx) } : ro))} style={{ marginLeft: 6, background: 'none', border: 'none', color: '#ee6c4d', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => {
                      setRoles(r => r.map((ro, i) => i === idx ? { ...ro, accountabilities: [...ro.accountabilities, ''] } : ro));
                      setFocusField({ type: 'acc', roleIdx: idx, fieldIdx: role.accountabilities.length });
                    }} style={{ marginTop: 2, background: '#e0e0e0', color: '#232946', border: 'none', borderRadius: 6, padding: '3px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Accountability</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setRoles(r => [...r, { name: '', purpose: '', domains: [''], accountabilities: [''] }])} style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 8 }}>+ Add Role</button>
              <div style={{ color: '#ee6c4d', fontSize: 13, minHeight: 18 }}>
                {roles.length === 0 || roles.some(r => !r.name || !r.purpose) ? 'Each role must have a name and purpose.' : ''}
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Step 2: Assign Founders to Roles</div>
              <div style={{ fontSize: 15, color: '#555', marginBottom: 10 }}>
                Assign each role to a founder. You can leave roles unassigned if you wish to assign them later.
              </div>
              {roles.map((role, idx) => (
                <div key={idx} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, marginBottom: 14, background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontWeight: 500, color: '#232946', marginBottom: 2 }}>{role.name || `Role ${idx + 1}`}</div>
                  <select
                    value={assignments[idx] || ''}
                    onChange={e => setAssignments(a => {
                      const copy = [...a];
                      copy[idx] = e.target.value;
                      return copy;
                    })}
                    style={{ width: '100%', padding: 7, border: '1px solid #ccc', borderRadius: 6, fontSize: 15 }}
                  >
                    <option value="">Unassigned</option>
                    {founders.map((f, fIdx) => (
                      <option key={fIdx} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Step 3: Review & Deploy</div>
              <div style={{ fontSize: 15, color: '#555', marginBottom: 16 }}>
                <b>Founders:</b>
                <ul style={{ textAlign: 'left', margin: '8px 0 12px 18px', padding: 0 }}>
                  {founders.map((f, i) => <li key={i} style={{ fontSize: 14 }}>{f}</li>)}
                </ul>
                <b>Organization Purpose:</b>
                <div style={{ fontSize: 14, margin: '6px 0 12px 0' }}>{initiativePurpose}</div>
                <b>Roles:</b>
                <ul style={{ textAlign: 'left', margin: '8px 0 12px 18px', padding: 0 }}>
                  {roles.map((r, i) => (
                    <li key={i} style={{ fontSize: 14 }}>
                      <b>{r.name}</b> — {r.purpose}
                      {assignments[i] && <span style={{ color: '#4ecdc4' }}> (Assigned: {assignments[i]})</span>}
                      {r.domains.filter(Boolean).length > 0 && <div style={{ fontSize: 13, color: '#888' }}>Domains: {r.domains.filter(Boolean).join(', ')}</div>}
                      {r.accountabilities.filter(Boolean).length > 0 && <div style={{ fontSize: 13, color: '#888' }}>Accountabilities: {r.accountabilities.filter(Boolean).join(', ')}</div>}
                    </li>
                  ))}
                </ul>
              </div>
              {deployError && <div style={{ color: '#ee6c4d', fontSize: 14, marginBottom: 10 }}>{deployError}</div>}
              {orgAddress ? (
                <div style={{ color: '#4ecdc4', fontWeight: 700, fontSize: 17, marginTop: 18, wordBreak: 'break-all', maxWidth: '100%' }}>
                  🎉 Organization deployed!<br/>
                  Address: <a href={`https://sepolia.etherscan.io/address/${orgAddress}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3a86ff', wordBreak: 'break-all', display: 'inline-block', maxWidth: '100%' }}>{orgAddress}</a>
                  <button onClick={() => navigator.clipboard.writeText(orgAddress)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#4ecdc4', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>Copy</button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    setDeploying(true);
                    setDeployError('');
                    try {
                      const provider = new ethers.BrowserProvider(window.ethereum);
                      const signer = await provider.getSigner();
                      const factory = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                      // Prepare roles and assignments for contract
                      const roleInputs = roles.map(r => ({
                        name: r.name,
                        purpose: r.purpose,
                        domains: r.domains.filter(Boolean),
                        accountabilities: r.accountabilities.filter(Boolean)
                      }));
                      const assignmentInputs = assignments.map((a, i) => a ? { roleIndex: i, assignedTo: a } : null).filter(Boolean);
                      const tx = await factory.createOrganization(initiativeId, initiativePurpose, roleInputs, assignmentInputs);
                      const receipt = await tx.wait();
                      // Find the OrganizationCreated event
                      let orgAddr = '';
                      for (const log of receipt.logs) {
                        try {
                          const parsed = factory.interface.parseLog(log);
                          if (parsed && parsed.name === 'OrganizationCreated') {
                            orgAddr = parsed.args.org;
                            break;
                          }
                        } catch {}
                      }
                      setOrgAddress(orgAddr || 'Deployed (address not found in logs)');
                      
                      // Attempt to verify the contract
                      if (orgAddr) {
                        try {
                          // Prepare constructor arguments
                          const constructorArgs = [
                            founders, // founders array
                            initiativePurpose // anchor purpose string
                          ];
                          const sourcifyUrl = await verifyOnSourcify(orgAddr, constructorArgs);
                          if (sourcifyUrl) {
                            console.log('Verification initiated:', sourcifyUrl);
                          }
                        } catch (verificationError) {
                          console.log('Verification attempt failed:', verificationError);
                        }
                      }
                    } catch (e) {
                      console.error("Wallet/contract error:", e);
                      alert(e?.message || "An error occurred. Please reconnect your wallet.");
                    }
                    setDeploying(false);
                  }}
                  disabled={deploying}
                  style={{ background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 8 }}
                >
                  {deploying ? 'Deploying...' : 'Deploy Organization'}
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 36px', borderTop: '1px solid #eee', background: '#fff', position: 'sticky', bottom: 0, zIndex: 2, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 0 && (roles.length === 0 || roles.some(r => !r.name || !r.purpose)))
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

function TransactionPendingOverlay() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(44,62,80,0.65)',
      zIndex: 3000,
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
        <h3 style={{ color: '#4ecdc4', marginBottom: 12, fontWeight: 700, letterSpacing: 1 }}>Blockchain Transaction Pending</h3>
        <p style={{ color: '#fff', fontSize: 17, marginBottom: 0, opacity: 0.92 }}>
          Please wait while your transaction is being confirmed on the blockchain. This may take a few moments...
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

export default NewHolacracyWizard;
export { TransactionPendingOverlay }; 