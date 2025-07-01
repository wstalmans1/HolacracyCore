import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import CircleDropdown from './CircleDropdown';

const CustomNode = ({ nodeDatum, onCircleAction, selectedCircle, setSelectedCircle, circles, contract, onSuccess, setIsTransactionPending }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const dropdownRef = useRef(null);
  const nodeRef = useRef(null);

  const handleMouseEnter = (event) => {
    // Clear any existing timeout when entering the circle
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    // Capture mouse position for dropdown positioning
    setDropdownPosition({ x: event.clientX, y: event.clientY });
    
    // Show dropdown on hover
    setSelectedCircle(nodeDatum.attributes.id);
    setShowDropdown(true);
  };

  const handleMouseLeave = (event) => {
    // Close dropdown when mouse leaves the circle dot
    const timeout = setTimeout(() => {
      setShowDropdown(false);
      setSelectedCircle(null);
    }, 200);
    
    setHoverTimeout(timeout);
  };

  const handleCircleClick = (event) => {
    // Do nothing on click
  };

  const handleDropdownMouseEnter = () => {
    // Clear any existing timeout when entering the dropdown
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleDropdownMouseLeave = (event) => {
    // Simple timeout to close dropdown when mouse leaves
    const timeout = setTimeout(() => {
      setShowDropdown(false);
      setSelectedCircle(null);
    }, 200);
    
    setHoverTimeout(timeout);
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
  const circleType = nodeDatum.attributes.type;
  
  // Color coding based on circle type and expansion state
  let circleColor;
  if (isRootCircle) {
    circleColor = '#e74c3c'; // A nice red for the root circle
  } else if (circleType === 'Policy') {
    circleColor = '#3498db'; // A nice blue for Policy circles
  } else if (circleType === 'Implementation') {
    circleColor = '#2ecc71'; // A nice green for Implementation circles
  } else {
    circleColor = '#95a5a6'; // A fallback gray
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
          cursor: 'default'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCircleClick}
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
            data-dropdown-container="true"
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