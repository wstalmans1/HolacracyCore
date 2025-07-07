const fs = require('fs');
const path = require('path');

// Directory containing contract artifacts
const artifactsDir = path.join(__dirname, 'artifacts/packages/holacracy-dapp/contracts');

function extractMetadataFiles(dir) {
  fs.readdirSync(dir).forEach((subdir) => {
    const subdirPath = path.join(dir, subdir);
    if (fs.statSync(subdirPath).isDirectory()) {
      // Look for .json files in this subdir
      fs.readdirSync(subdirPath).forEach((file) => {
        if (file.endsWith('.json') && !file.endsWith('.dbg.json') && !file.endsWith('.metadata.json')) {
          const artifactPath = path.join(subdirPath, file);
          const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
          if (artifact.metadata) {
            const metadataPath = path.join(subdirPath, file.replace('.json', '.metadata.json'));
            fs.writeFileSync(metadataPath, artifact.metadata, 'utf8');
            console.log(`Extracted metadata to: ${metadataPath}`);
          }
        }
      });
    }
  });
}

extractMetadataFiles(artifactsDir); 