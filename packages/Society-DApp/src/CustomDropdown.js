import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  required = false,
  style = {},
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const baseStyles = compact ? {
    container: {
      position: 'relative',
      width: '100%',
      marginBottom: '12px'
    },
    label: {
      display: 'block',
      marginBottom: '4px',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    trigger: {
      width: '100%',
      padding: '6px',
      fontSize: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'white',
      cursor: 'pointer',
      textAlign: 'left'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      maxHeight: '400px',
      overflowY: 'auto',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      zIndex: 1000,
      marginTop: '2px'
    },
    option: {
      padding: '6px',
      fontSize: '12px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#f5f5f5'
      }
    }
  } : {
    container: {
      position: 'relative',
      width: '300px',
      marginBottom: '8px'
    },
    label: {
      marginRight: '8px'
    },
    trigger: {
      width: '100%',
      padding: '8px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'white',
      cursor: 'pointer',
      textAlign: 'left'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      maxHeight: '400px',
      overflowY: 'auto',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      zIndex: 1000,
      marginTop: '2px'
    },
    option: {
      padding: '8px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#f5f5f5'
      }
    }
  };

  return (
    <div ref={dropdownRef} style={{ ...baseStyles.container, ...style }}>
      {label && (
        <label style={baseStyles.label}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={baseStyles.trigger}
      >
        {selectedOption ? selectedOption.label : placeholder}
      </button>
      {isOpen && (
        <div style={baseStyles.dropdown}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                ...baseStyles.option,
                backgroundColor: option.value === value ? '#f5f5f5' : 'white'
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown; 