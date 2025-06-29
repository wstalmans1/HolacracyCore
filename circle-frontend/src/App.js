import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import Tree from "react-d3-tree";
import { CIRCLE_HIERARCHY_ADDRESS, CIRCLE_HIERARCHY_ABI } from "./contractInfo";
import CustomNode from "./CustomNode";
import CircleDropdown from "./CircleDropdown";
import "./App.css";

const ROOT_ID = 0;

function App() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [contract, setContract] = useState();
  const [account, setAccount] = useState();
  const [treeData, setTreeData] = useState(null);
  const [circles, setCircles] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hoveredCircle, setHoveredCircle] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [animationState, setAnimationState] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(0.6);

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    const _provider = new ethers.BrowserProvider(window.ethereum);
    await _provider.send("eth_requestAccounts", []);
    const _signer = await _provider.getSigner();
    setProvider(_provider);
    setSigner(_signer);
    setAccount(await _signer.getAddress());
    const _contract = new ethers.Contract(
      CIRCLE_HIERARCHY_ADDRESS,
      CIRCLE_HIERARCHY_ABI,
      _signer
    );
    setContract(_contract);
  };

  // Load all circles recursively
  const fetchCircleTree = useCallback(
    async (id = ROOT_ID) => {
      if (!contract) return null;
      console.log('Fetching circle', id);
      let circle;
      try {
        circle = await contract.circles(id);
        console.log('Fetched circle', id, circle);
      } catch (err) {
        console.error('Error fetching circle', id, err);
        return null;
      }
      let childrenIds = [];
      try {
        childrenIds = await contract.getChildren(id);
        console.log('Circle', id, 'children:', childrenIds);
      } catch (err) {
        console.error('Error fetching children for circle', id, err);
      }
      const children = await Promise.all(
        childrenIds.map((childId) => fetchCircleTree(childId))
      );
      return {
        name: circle.purpose,
        attributes: {
          id: id,
          type: circle.circleType === 0 ? "Policy" : "Implementation",
          parentId: circle.parentId,
        },
        children: children,
      };
    },
    [contract]
  );

  // Load all circles as a flat map for forms
  const fetchAllCircles = useCallback(
    async () => {
      if (!contract) return;
      let all = {};
      let queue = [ROOT_ID];
      while (queue.length > 0) {
        const id = queue.shift();
        const circle = await contract.circles(id);
        all[id] = circle;
        const childrenIds = await contract.getChildren(id);
        queue.push(...childrenIds);
      }
      setCircles(all);
    },
    [contract]
  );

  // Load tree and flat map
  useEffect(() => {
    if (!contract) return;
    setLoading(true);
    fetchCircleTree().then((tree) => {
      setTreeData(tree);
      setLoading(false);
    });
    fetchAllCircles();
  }, [contract, refresh, fetchCircleTree, fetchAllCircles]);

  // Handle circle hover events
  const handleCircleHover = (event, circleId) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setHoveredCircle(circleId);
    setShowDropdown(true);
  };

  const handleCircleLeave = () => {
    // Set a timeout to close the dropdown after a delay
    const timeout = setTimeout(() => {
      setShowDropdown(false);
      setHoveredCircle(null);
    }, 300); // 300ms delay
    setHoverTimeout(timeout);
  };

  const handleDropdownEnter = () => {
    // Clear the timeout when hovering over the dropdown
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleDropdownLeave = () => {
    setShowDropdown(false);
    setHoveredCircle(null);
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  // Listen for events to refresh
  useEffect(() => {
    if (!contract) return;
    const onCircleCreated = () => setRefresh((r) => r + 1);
    const onCircleMoved = () => setRefresh((r) => r + 1);
    const onCircleEdited = () => setRefresh((r) => r + 1);
    contract.on("CircleCreated", onCircleCreated);
    contract.on("CircleMoved", onCircleMoved);
    contract.on("CircleEdited", onCircleEdited);
    return () => {
      contract.off("CircleCreated", onCircleCreated);
      contract.off("CircleMoved", onCircleMoved);
      contract.off("CircleEdited", onCircleEdited);
    };
  }, [contract]);

  // Animation effect for transaction pending
  useEffect(() => {
    if (isTransactionPending) {
      const interval = setInterval(() => {
        setAnimationState(prev => prev + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isTransactionPending]);

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Circle Hierarchy DApp</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>Connected: {account}</div>
      )}
      <hr />
      {loading && <div>Loading hierarchy...</div>}
      {treeData && (
        <div style={{ position: 'relative' }}>
          {/* Tree Container */}
          <div style={{ width: "100%", height: "500px", border: "1px solid #ccc", borderRadius: 8, background: "#fafbfc", marginBottom: 20 }}>
            <Tree 
              data={treeData} 
              orientation="vertical" 
              translate={{ x: 400, y: 50 }} 
              zoomable={true} 
              zoom={zoomLevel}
              separation={{ siblings: 2, nonSiblings: 2.5 }}
              nodeSize={{ x: 200, y: 100 }}
              renderCustomNodeElement={(rd3tProps) => (
                <CustomNode 
                  {...rd3tProps} 
                  onHover={handleCircleHover}
                  onLeave={handleCircleLeave}
                />
              )}
            />
            
            {/* Zoom Controls - Bottom Right Corner */}
            <div style={{
              position: 'absolute',
              bottom: '15px',
              right: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.1)'
            }}>
              <button
                onClick={handleZoomIn}
                style={{
                  width: '28px',
                  height: '28px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: '#4ecdc4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Zoom In"
              >
                +
              </button>
              <span style={{
                fontSize: '11px',
                color: '#666',
                textAlign: 'center',
                padding: '2px 0'
              }}>
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomOut}
                style={{
                  width: '28px',
                  height: '28px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: '#4ecdc4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Zoom Out"
              >
                −
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Dropdown for circle actions */}
      {showDropdown && hoveredCircle !== null && (
        <CircleDropdown
          position={dropdownPosition}
          circleId={hoveredCircle}
          circles={circles}
          contract={contract}
          onClose={handleDropdownLeave}
          onEnter={handleDropdownEnter}
          onSuccess={() => setRefresh((r) => r + 1)}
          setIsTransactionPending={setIsTransactionPending}
        />
      )}

      {/* Transaction Pending Overlay */}
      {isTransactionPending && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          color: 'white'
        }}>
          <div style={{
            backgroundColor: '#2c3e50',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center',
            maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '6px solid #4ecdc4',
              borderTop: '6px solid transparent',
              borderRadius: '50%',
              transform: `rotate(${animationState * 36}deg)`,
              margin: '0 auto 20px',
              boxShadow: '0 0 20px rgba(78, 205, 196, 0.5)',
              transition: 'transform 0.1s ease-out'
            }}></div>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: '#4ecdc4',
              opacity: 0.7 + Math.sin(animationState * 0.2) * 0.3,
              transition: 'opacity 0.1s ease-out'
            }}>
              Transaction Pending
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: '14px',
              opacity: 0.9
            }}>
              Please wait while your transaction is being processed on the blockchain...
            </p>
            <div style={{
              marginTop: '15px',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#4ecdc4',
                borderRadius: '50%',
                opacity: 0.5 + Math.sin(animationState * 0.3) * 0.5,
                transition: 'opacity 0.1s ease-out'
              }}></div>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#4ecdc4',
                borderRadius: '50%',
                opacity: 0.5 + Math.sin((animationState + 10) * 0.3) * 0.5,
                transition: 'opacity 0.1s ease-out'
              }}></div>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#4ecdc4',
                borderRadius: '50%',
                opacity: 0.5 + Math.sin((animationState + 20) * 0.3) * 0.5,
                transition: 'opacity 0.1s ease-out'
              }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
