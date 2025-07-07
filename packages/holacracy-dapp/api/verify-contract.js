// Vercel serverless function for contract verification
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { contractAddress, chainId = 11155111 } = req.body;
    
    // In a real implementation, you'd include the contract source and metadata
    // For now, this is a placeholder that shows the structure
    const verificationData = {
      address: contractAddress,
      chain: chainId,
      files: {
        'HolacracyOrganization.sol': '// Contract source would be included here',
        'metadata.json': '{}' // Contract metadata would be included here
      },
      constructorArgs: []
    };

    const response = await fetch('https://sourcify.dev/server/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData)
    });

    if (response.ok) {
      res.json({ success: true, message: 'Contract verified on Sourcify' });
    } else {
      res.json({ success: false, message: 'Sourcify verification failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
} 