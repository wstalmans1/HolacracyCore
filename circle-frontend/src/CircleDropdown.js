import React, { useState } from 'react';
import CreateCircleForm from './CreateCircleForm';
import EditCircleForm from './EditCircleForm';
import MoveCircleForm from './MoveCircleForm';

const CircleDropdown = ({ 
  circleId, 
  circleName,
  circles, 
  contract, 
  onClose, 
  onSuccess,
  onEnter,
  setIsTransactionPending
}) => {
  const [activeTab, setActiveTab] = useState('create');

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const tabs = [
    { id: 'create', label: 'Create Child', component: CreateCircleForm },
    { id: 'edit', label: 'Edit', component: EditCircleForm },
    { id: 'move', label: 'Move', component: MoveCircleForm }
  ];

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '2px solid #4ecdc4',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '300px',
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'auto'
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onClose}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          color: '#666'
        }}
      >
        ×
      </button>

      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>
          {circleName || 'Circle'}
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
          ID: {circleId} - {circles && circles[circleId]?.circleType === 0 ? "Policy" : "Implementation"}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              background: activeTab === tab.id ? '#4ecdc4' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div style={{ padding: '12px' }}>
        {activeTab === 'create' && (
          <CreateCircleForm 
            contract={contract} 
            circles={circles}
            preSelectedParentId={circleId}
            onSuccess={handleSuccess}
            compact={true}
            setIsTransactionPending={setIsTransactionPending}
          />
        )}
        {activeTab === 'edit' && circleId !== 0 && (
          <EditCircleForm 
            contract={contract} 
            circles={circles}
            preSelectedCircleId={circleId}
            onSuccess={handleSuccess}
            compact={true}
            setIsTransactionPending={setIsTransactionPending}
          />
        )}
        {activeTab === 'move' && circleId !== 0 && (
          <MoveCircleForm 
            contract={contract} 
            circles={circles}
            preSelectedCircleId={circleId}
            onSuccess={handleSuccess}
            compact={true}
            setIsTransactionPending={setIsTransactionPending}
          />
        )}
        {activeTab === 'edit' && circleId === 0 && (
          <p style={{ color: '#666', fontSize: '14px', textAlign: 'center' }}>
            Root circle cannot be edited
          </p>
        )}
        {activeTab === 'move' && circleId === 0 && (
          <p style={{ color: '#666', fontSize: '14px', textAlign: 'center' }}>
            Root circle cannot be moved
          </p>
        )}
      </div>
    </div>
  );
};

export default CircleDropdown; 