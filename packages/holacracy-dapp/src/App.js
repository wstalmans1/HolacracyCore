import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        alert('Connection to MetaMask was rejected.');
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask and try again.');
    }
  };

  return (
    <div className="App" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Holacracy DApp</h1>
      {account ? (
        <div>
          <p>Connected wallet:</p>
          <p style={{ fontWeight: 'bold' }}>{account}</p>
        </div>
      ) : (
        <button onClick={connectWallet} style={{ fontSize: '1.2em', padding: '10px 20px', cursor: 'pointer' }}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}

export default App;
