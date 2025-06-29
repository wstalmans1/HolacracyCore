import React from 'react';

const CustomNode = ({ nodeDatum, toggleNode, onHover, onLeave }) => {
  const handleMouseEnter = (event) => {
    onHover(event, nodeDatum.attributes.id);
  };

  const isRootCircle = nodeDatum.attributes.id === 0;

  return (
    <g>
      <circle
        r={15}
        style={{
          fill: isRootCircle ? '#ff6b6b' : '#4ecdc4',
          stroke: '#2c3e50',
          strokeWidth: 2,
          cursor: 'pointer'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onLeave}
        onClick={toggleNode}
      />
      
      {/* HTML label for better typography */}
      <foreignObject
        x={nodeDatum.children ? -200 : 20}
        y={-15}
        width={180}
        height={30}
        style={{ overflow: 'visible' }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            fontSize: '14px',
            fontWeight: '400',
            color: '#000000',
            fontFamily: 'Arial, Helvetica, sans-serif',
            lineHeight: '1.2',
            textAlign: nodeDatum.children ? 'right' : 'left',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none'
          }}
        >
          {nodeDatum.name}
        </div>
      </foreignObject>
    </g>
  );
};

export default CustomNode; 