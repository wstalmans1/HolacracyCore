const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Blockscout automatic verification endpoint
app.post('/verify-blockscout', async (req, res) => {
  try {
    const { contractAddress } = req.body;
    
    // Read contract artifacts
    const artifactPath = path.join(__dirname, '../contracts/artifacts/contracts/HolacracyOrganization.sol/HolacracyOrganization.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Blockscout verification endpoint (for Sepolia testnet)
    const blockscoutUrl = 'https://sepolia.blockscout.com/api/v2/smart-contracts';
    
    const verificationData = {
      address_hash: contractAddress,
      compiler_version: '0.8.28',
      contract_source_code: artifact.source,
      constructor_arguments: '',
      optimization: false,
      optimization_runs: 200
    };

    const response = await fetch(blockscoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData)
    });

    if (response.ok) {
      res.json({ 
        success: true, 
        message: 'Contract automatically verified on Blockscout',
        verified: true,
        blockscoutUrl: `https://sepolia.blockscout.com/address/${contractAddress}`
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Blockscout verification failed',
        blockscoutUrl: `https://sepolia.blockscout.com/address/${contractAddress}`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Blockscout verification service running on port ${PORT}`);
}); 