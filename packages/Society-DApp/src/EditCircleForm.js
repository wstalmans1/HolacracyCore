import React, { useState, useEffect } from "react";
import CustomDropdown from "./CustomDropdown";

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
  const circleOptions = editableCircles.map(([id, c]) => ({
    value: id,
    label: `${c.purpose} [${Number(c.circleType) === 0 ? "Policy" : "Implementation"}] (ID: ${id})`
  }));

  const circleTypeOptions = [
    { value: 0, label: "Policy" },
    { value: 1, label: "Implementation" }
  ];

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
          <CustomDropdown
            options={circleOptions}
            value={circleId}
            onChange={handleCircleSelect}
            placeholder="Select Circle"
            label="Circle to Edit"
            required
            compact={true}
          />
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
        <CustomDropdown
          options={circleTypeOptions}
          value={newCircleType}
          onChange={setNewCircleType}
          label="New Circle Type"
          required
          compact={true}
        />
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
        <CustomDropdown
          options={circleOptions}
          value={circleId}
          onChange={handleCircleSelect}
          placeholder="Select Circle"
          label="Circle to Edit"
          required
        />
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
        <CustomDropdown
          options={circleTypeOptions}
          value={newCircleType}
          onChange={setNewCircleType}
          label="New Circle Type"
          required
        />
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