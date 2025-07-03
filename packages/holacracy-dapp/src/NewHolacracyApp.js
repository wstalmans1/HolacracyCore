import React, { useState } from 'react';
import NewHolacracyWizard from './NewHolacracyWizard';

function NewHolacracyApp() {
  const [created, setCreated] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 0 0 0', textAlign: 'center' }}>
        <div style={{ fontStyle: 'italic', color: '#232946', fontSize: 18, marginBottom: 32, borderLeft: '4px solid #4ecdc4', paddingLeft: 18 }}>
          A Holacracy is governed by the <a href="https://www.holacracy.org/constitution/5-0/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Holacracy Constitution 5.0</a>. All authority derives from this Constitution, not from individuals.
        </div>
        {!created ? (
          <NewHolacracyWizard onClose={() => {}} onCreated={() => setCreated(true)} />
        ) : (
          <div style={{ color: '#4ecdc4', fontWeight: 700, fontSize: 22, marginTop: 60 }}>Holacracy created successfully!</div>
        )}
      </div>
    </div>
  );
}

export default NewHolacracyApp; 