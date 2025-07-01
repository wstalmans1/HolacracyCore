import React, { useState, useEffect } from "react";
import CustomDropdown from "./CustomDropdown";

const CreateCircleForm = ({ contract, circles, preSelectedParentId, onSuccess, compact = false, setIsTransactionPending }) => {
  const [purpose, setPurpose] = useState("");
  const [circleType, setCircleType] = useState(0); // 0: Policy, 1: Implementation
  const [parentId, setParentId] = useState(preSelectedParentId || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preSelectedParentId !== undefined) {
      setParentId(preSelectedParentId);
    }
  }, [preSelectedParentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return;
    setLoading(true);
    if (setIsTransactionPending) {
      setIsTransactionPending(true);
    }
    try {
      const tx = await contract.createCircle(purpose, circleType, parentId);
      await tx.wait();
      setPurpose("");
      setCircleType(0);
      if (!preSelectedParentId) {
        setParentId(0);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        alert("Circle created!");
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

  const circleTypeOptions = [
    { value: 0, label: "Policy" },
    { value: 1, label: "Implementation" }
  ];

  const parentCircleOptions = Object.entries(circles).map(([id, c]) => ({
    value: Number(id),
    label: `${c.purpose} [${Number(c.circleType) === 0 ? "Policy" : "Implementation"}] (ID: ${id})`
  }));

  if (compact) {
    return (
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            Purpose:
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
            style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
            placeholder="Enter circle purpose"
          />
        </div>
        <CustomDropdown
          options={circleTypeOptions}
          value={circleType}
          onChange={setCircleType}
          label="Type"
          required
          compact={true}
        />
        {!preSelectedParentId && (
          <CustomDropdown
            options={parentCircleOptions}
            value={parentId}
            onChange={setParentId}
            label="Parent Circle"
            required
            compact={true}
          />
        )}
        <button 
          type="submit" 
          disabled={loading || !purpose} 
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
          {loading ? "Creating..." : "Create Circle"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: "#f8f9fa", padding: 16, borderRadius: 8 }}>
      <h2>Create New Circle</h2>
      <div>
        <label>Purpose:&nbsp;
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
            style={{ width: 300 }}
          />
        </label>
      </div>
      <div>
        <CustomDropdown
          options={circleTypeOptions}
          value={circleType}
          onChange={setCircleType}
          label="Type"
          required
        />
      </div>
      <div>
        <CustomDropdown
          options={parentCircleOptions}
          value={parentId}
          onChange={setParentId}
          label="Parent Circle"
          required
        />
      </div>
      <button type="submit" disabled={loading || !purpose} style={{ marginTop: 8 }}>
        {loading ? "Creating..." : "Create Circle"}
      </button>
    </form>
  );
};

export default CreateCircleForm; 