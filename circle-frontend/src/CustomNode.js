import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import CircleDropdown from './CircleDropdown';

const CustomNode = ({ nodeDatum, toggleNode, onCircleAction, selectedCircle, setSelectedCircle, circles, contract, onSuccess, setIsTransactionPending }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef(null);
  const nodeRef = useRef(null);

  const handleMouseEnter = (event) => {
    // Do nothing on mouse enter - we'll use click instead
  };

  const handleMouseLeave = (event) => {
    // Do nothing - let the dropdown stay open
    // Only close via explicit user actions
  };

  const handleCircleClick = (event) => {
    // Prevent the toggleNode from firing when we want to show dropdown
    event.stopPropagation();
    
    // Capture mouse position for dropdown positioning
    setDropdownPosition({ x: event.clientX, y: event.clientY });
    
    // Show dropdown
    setSelectedCircle(nodeDatum.attributes.id);
    setShowDropdown(true);
  };

  const handleDropdownMouseEnter = () => {
    // Do nothing - dropdown stays open
  };

  const handleDropdownMouseLeave = (event) => {
    // Completely disable mouse leave closing when dropdown is open
    // Only allow closing via explicit user actions
    return;
  };

  // Add click outside handler to close dropdown
  const handleClickOutside = React.useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
      setSelectedCircle(null);
    }
  }, [setSelectedCircle]);

  // Add event listener for clicks outside dropdown
  React.useEffect(() => {
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown, handleClickOutside]);

  const isRootCircle = nodeDatum.attributes.id === 0;
  const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
  
  // Color coding based on circle type and expansion state
  let circleColor;
  if (isRootCircle) {
    circleColor = '#ff6b6b'; // Red for root circle
  } else if (hasChildren) {
    // For now, all circles with children will be teal (expanded)
    // We need to implement proper collapse detection
    circleColor = '#4ecdc4'; // Teal for circles with sub-circles
  } else {
    circleColor = '#95a5a6'; // Gray for leaf circles (no sub-circles)
  }

  return (
    <g>
      <circle
        ref={nodeRef}
        r={15}
        style={{
          fill: circleColor,
          stroke: '#2c3e50',
          strokeWidth: 2,
          cursor: 'pointer'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCircleClick}
        onDoubleClick={toggleNode}
      />
      
      {/* HTML label for better typography */}
      <foreignObject
        x={isRootCircle ? -100 : (nodeDatum.children ? -200 : 20)}
        y={isRootCircle ? -50 : -15}
        width={isRootCircle ? 200 : 180}
        height={isRootCircle ? 40 : 30}
        style={{ overflow: 'visible', cursor: 'default' }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            fontSize: isRootCircle ? '24px' : '20px',
            fontWeight: '400',
            color: '#000000',
            fontFamily: 'Arial, Helvetica, sans-serif',
            lineHeight: '1.2',
            textAlign: isRootCircle ? 'center' : (nodeDatum.children ? 'right' : 'left'),
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
            cursor: 'default'
          }}
        >
          {nodeDatum.name}
        </div>
      </foreignObject>

      {/* Render dropdown as portal */}
      {showDropdown && selectedCircle === nodeDatum.attributes.id && 
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: `${dropdownPosition.x + 20}px`,
              top: `${dropdownPosition.y - 50}px`,
              zIndex: 1000
            }}
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          >
            <CircleDropdown
              circleId={nodeDatum.attributes.id}
              circleName={nodeDatum.name}
              circles={circles}
              contract={contract}
              onClose={() => {
                setShowDropdown(false);
                setSelectedCircle(null);
              }}
              onSuccess={onSuccess}
              onEnter={handleDropdownMouseEnter}
              setIsTransactionPending={setIsTransactionPending}
            />
          </div>,
          document.querySelector('.tree-container') || document.body
        )
      }
    </g>
  );
};

export default CustomNode; 