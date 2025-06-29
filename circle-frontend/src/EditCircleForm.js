import React, { useState, useEffect } from "react";

const EditCircleForm = ({ contract, circles, preSelectedCircleId, onSuccess, compact = false, setIsTransactionPending }) => {
  const [circleId, setCircleId] = useState(preSelectedCircleId || "");
  const [newPurpose, setNewPurpose] = useState("");
  const [newCircleType, setNewCircleType] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preSelectedCircleId !== undefined) {
      setCircleId(preSelectedCircleId);
      if (circles[preSelectedCircleId]) {
        setNewPurpose(circles[preSelectedCircleId].purpose);
        setNewCircleType(circles[preSelectedCircleId].circleType);
      }
    }
  }, [preSelectedCircleId, circles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return;
    setLoading(true);
    if (setIsTransactionPending) {
      setIsTransactionPending(true);
    }
    try {
      const tx = await contract.editCircle(circleId, newPurpose, newCircleType);
      await tx.wait();
      setCircleId("");
      setNewPurpose("");
      setNewCircleType(0);
      if (onSuccess) {
        onSuccess();
      } else {
        alert("Circle edited successfully!");
      }
    } catch (err) {
      alert("Error: " + (err?.info?.error?.message || err.message));
    } finally {
      setLoading(false);
      if (setIsTransactionPending) {
        setIsTransactionPending(false);
      }
    }
  };

  // Exclude root from being edited
  const editableCircles = Object.entries(circles).filter(([id]) => Number(id) !== 0);

  const handleCircleSelect = (selectedId) => {
    setCircleId(selectedId);
    if (selectedId && circles[selectedId]) {
      setNewPurpose(circles[selectedId].purpose);
      setNewCircleType(circles[selectedId].circleType);
    } else {
      setNewPurpose("");
      setNewCircleType(0);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit}>
        {!preSelectedCircleId && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              Circle to Edit:
            </label>
            <select 
              value={circleId} 
              onChange={e => handleCircleSelect(e.target.value)} 
              required
              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">Select Circle</option>
              {editableCircles.map(([id, c]) => (
                <option key={id} value={id}>
                  {c.purpose} [{c.circleType === 0 ? "Policy" : "Implementation"}] (ID: {id})
                </option>
              ))}
            </select>
          </div>
        )}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            New Purpose:
          </label>
          <input
            type="text"
            value={newPurpose}
            onChange={(e) => setNewPurpose(e.target.value)}
            required
            style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
            placeholder="Enter new purpose"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            New Circle Type:
          </label>
          <select
            value={newCircleType}
            onChange={(e) => setNewCircleType(Number(e.target.value))}
            required
            style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="0">Policy</option>
            <option value="1">Implementation</option>
          </select>
        </div>
        <button 
          type="submit" 
          disabled={loading || !circleId || !newPurpose} 
          style={{ 
            width: '100%', 
            padding: '8px', 
            fontSize: '12px', 
            backgroundColor: '#4ecdc4', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Editing..." : "Edit Circle"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: "#f8f9fa", padding: 16, borderRadius: 8 }}>
      <h2>Edit Circle</h2>
      <div>
        <label>Circle to Edit:&nbsp;
          <select 
            value={circleId} 
            onChange={e => handleCircleSelect(e.target.value)} 
            required
            style={{ width: 300, marginBottom: 8 }}
          >
            <option value="">Select Circle</option>
            {editableCircles.map(([id, c]) => (
              <option key={id} value={id}>
                {c.purpose} [{c.circleType === 0 ? "Policy" : "Implementation"}] (ID: {id})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>New Purpose:&nbsp;
          <input
            type="text"
            value={newPurpose}
            onChange={(e) => setNewPurpose(e.target.value)}
            required
            style={{ width: 300 }}
            placeholder="Enter new purpose for the circle"
          />
        </label>
      </div>
      <div>
        <label>New Circle Type:&nbsp;
          <select
            value={newCircleType}
            onChange={(e) => setNewCircleType(Number(e.target.value))}
            required
            style={{ width: 300 }}
          >
            <option value="0">Policy</option>
            <option value="1">Implementation</option>
          </select>
        </label>
      </div>
      <button 
        type="submit" 
        disabled={loading || !circleId || !newPurpose} 
        style={{ marginTop: 8 }}
      >
        {loading ? "Editing..." : "Edit Circle"}
      </button>
    </form>
  );
};

export default EditCircleForm; 