// IPFS-based contract verification
import { create } from 'ipfs-http-client';

const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

export const uploadContractMetadata = async (contractAddress, contractSource, metadata) => {
  try {
    // Upload contract source to IPFS
    const sourceResult = await ipfs.add(JSON.stringify({
      address: contractAddress,
      source: contractSource,
      metadata: metadata,
      timestamp: Date.now()
    }));

    const ipfsHash = sourceResult.path;
    console.log('Contract metadata uploaded to IPFS:', ipfsHash);
    
    return {
      success: true,
      ipfsHash: ipfsHash,
      verificationUrl: `https://ipfs.io/ipfs/${ipfsHash}`
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    return { success: false, error: error.message };
  }
};

export const verifyContractOnIPFS = async (contractAddress, ipfsHash) => {
  try {
    // Fetch metadata from IPFS
    const chunks = [];
    for await (const chunk of ipfs.cat(ipfsHash)) {
      chunks.push(chunk);
    }
    
    const metadata = JSON.parse(Buffer.concat(chunks).toString());
    
    // Verify the contract address matches
    if (metadata.address.toLowerCase() === contractAddress.toLowerCase()) {
      return {
        success: true,
        verified: true,
        ipfsUrl: `https://ipfs.io/ipfs/${ipfsHash}`
      };
    } else {
      return { success: false, verified: false };
    }
  } catch (error) {
    console.error('IPFS verification error:', error);
    return { success: false, error: error.message };
  }
}; 