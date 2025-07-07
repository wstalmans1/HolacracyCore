const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const os = require('os');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Automatic Sourcify verification endpoint
app.post('/verify', async (req, res) => {
  try {
    const { contractAddress, constructorArgs } = req.body;
    
    // Paths
    const artifactPath = path.join(__dirname, '../../artifacts/packages/holacracy-dapp/contracts/HolacracyOrganization.sol/HolacracyOrganization.json');
    const metadataPath = path.join(__dirname, '../../artifacts/packages/holacracy-dapp/contracts/HolacracyOrganization.sol/HolacracyOrganization.metadata.json');
    const sourcePath = path.join(__dirname, 'contracts/HolacracyOrganization.sol');
    
    if (!fs.existsSync(artifactPath) || !fs.existsSync(metadataPath) || !fs.existsSync(sourcePath)) {
      return res.json({ 
        success: false, 
        message: 'Contract artifact, metadata, or source file not found. Please compile contracts first.' 
      });
    }

    // Read the source file directly
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    
    // Create minimal metadata
    const metadata = {
      "language": "Solidity",
      "sources": {
        "HolacracyOrganization.sol": {
          "content": sourceContent
        }
      },
      "settings": {
        "compiler": {
          "version": "0.8.28"
        }
      }
    };
    
    const tmpMetaPath = path.join(os.tmpdir(), `metadata-${Date.now()}.json`);
    fs.writeFileSync(tmpMetaPath, JSON.stringify(metadata, null, 2));

    // Prepare form-data
    const form = new FormData();
    form.append('address', contractAddress);
    form.append('chain', '11155111'); // Sepolia
    form.append('files', fs.createReadStream(metadataPath), { filename: 'metadata.json' });
    form.append('files', Buffer.from(sourceContent), { filename: 'HolacracyOrganization.sol' });

    // Send to Sourcify
    const sourcifyResponse = await fetch('https://sourcify.dev/server/verify', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const sourcifyResult = await sourcifyResponse.text();
    console.log('Sourcify response status:', sourcifyResponse.status);
    console.log('Sourcify response:', sourcifyResult);

    // Clean up temp file
    fs.unlinkSync(tmpMetaPath);

    if (sourcifyResponse.ok) {
      res.json({ 
        success: true, 
        message: 'Contract automatically verified on Sourcify',
        verified: true,
        sourcifyUrl: `https://sourcify.dev/#/lookup/${contractAddress}`
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Sourcify verification failed',
        sourcifyUrl: `https://sourcify.dev/#/lookup/${contractAddress}`,
        error: sourcifyResult
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Verification service running on port ${PORT}`);
}); 