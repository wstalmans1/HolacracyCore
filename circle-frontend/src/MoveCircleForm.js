import React, { useState, useEffect } from "react";

const CustomDropdown = ({ value, onChange, options, placeholder, label, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };
  
  const selectedOption = options.find(opt => opt.value === value);
  
  return (
    <div style={{ position: 'relative', marginBottom: '12px' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
        {label}:
      </label>
      <div 
        onClick={handleToggle}
        style={{
          width: '100%',
          padding: '6px',
          fontSize: '12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: 'pointer',
          minHeight: '20px'
        }}
      >
        {selectedOption ? selectedOption.label : placeholder}
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          maxHeight: '150px',
          overflowY: 'auto',
          zIndex: 1001
        }}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{
                padding: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MoveCircleForm = ({ contract, circles, preSelectedCircleId, onSuccess, compact = false, setIsTransactionPending }) => {
  const [circleId, setCircleId] = useState(preSelectedCircleId || "");
  const [newParentId, setNewParentId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preSelectedCircleId !== undefined) {
      setCircleId(preSelectedCircleId);
    }
  }, [preSelectedCircleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return;
    setLoading(true);
    if (setIsTransactionPending) {
      setIsTransactionPending(true);
    }
    try {
      const tx = await contract.moveCircle(circleId, newParentId);
      await tx.wait();
      setCircleId("");
      setNewParentId("");
      if (onSuccess) {
        onSuccess();
      } else {
        alert("Circle moved!");
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

  // Exclude root from being moved
  const movableCircles = Object.entries(circles).filter(([id]) => Number(id) !== 0);

  if (compact) {
    return (
      <form onSubmit={handleSubmit}>
        {!preSelectedCircleId && (
          <CustomDropdown
            value={circleId}
            onChange={setCircleId}
            options={[
              { value: "", label: "Select Circle" },
              ...movableCircles.map(([id, c]) => ({
                value: id,
                label: `${c.purpose} [${c.circleType === 0 ? "Policy" : "Implementation"}] (ID: ${id})`
              }))
            ]}
            placeholder="Select Circle"
            label="Circle to Move"
            required
          />
        )}
        <CustomDropdown
          value={newParentId}
          onChange={setNewParentId}
          options={[
            { value: "", label: "Select Parent" },
            ...Object.entries(circles).map(([id, c]) => ({
              value: id,
              label: `${c.purpose} [${c.circleType === 0 ? "Policy" : "Implementation"}] (ID: ${id})`
            }))
          ]}
          placeholder="Select Parent"
          label="New Parent"
          required
        />
        <button 
          type="submit" 
          disabled={loading || !circleId || !newParentId} 
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
          {loading ? "Moving..." : "Move Circle"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: "#f8f9fa", padding: 16, borderRadius: 8 }}>
      <h2>Move Circle</h2>
      <div>
        <label>Circle to Move:&nbsp;
          <select value={circleId} onChange={e => setCircleId(e.target.value)} required>
            <option value="">Select Circle</option>
            {movableCircles.map(([id, c]) => (
              <option key={id} value={id}>
                {c.purpose} [{c.circleType === 0 ? "Policy" : "Implementation"}] (ID: {id})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>New Parent:&nbsp;
          <select value={newParentId} onChange={e => setNewParentId(e.target.value)} required>
            <option value="">Select Parent</option>
            {Object.entries(circles).map(([id, c]) => (
              <option key={id} value={id}>
                {c.purpose} [{c.circleType === 0 ? "Policy" : "Implementation"}] (ID: {id})
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" disabled={loading || !circleId || !newParentId} style={{ marginTop: 8 }}>
        {loading ? "Moving..." : "Move Circle"}
      </button>
    </form>
  );
};

export default MoveCircleForm; 