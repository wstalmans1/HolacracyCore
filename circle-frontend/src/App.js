import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import Tree from "react-d3-tree";
import { CIRCLE_HIERARCHY_ADDRESS, CIRCLE_HIERARCHY_ABI } from "./contractInfo";
import CustomNode from "./CustomNode";
import "./App.css";

const ROOT_ID = 0;

function App() {
  const [contract, setContract] = useState();
  const [account, setAccount] = useState();
  const [treeData, setTreeData] = useState(null);
  const [circles, setCircles] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [animationState, setAnimationState] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(0.4);
  const [panPosition, setPanPosition] = useState({ x: 600, y: 100 });
  const [selectedCircle, setSelectedCircle] = useState(null);

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    const _provider = new ethers.BrowserProvider(window.ethereum);
    await _provider.send("eth_requestAccounts", []);
    const _signer = await _provider.getSigner();
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

  // Calculate optimal zoom and position to show entire tree
  const calculateOptimalView = useCallback((treeData) => {
    if (!treeData) return { zoom: 0.6, pan: { x: 400, y: 50 } };

    // Count total nodes and max depth to estimate tree size
    const countNodes = (node, depth = 0) => {
      let totalNodes = 1;
      let maxDepth = depth;
      
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          const childResult = countNodes(child, depth + 1);
          totalNodes += childResult.totalNodes;
          maxDepth = Math.max(maxDepth, childResult.maxDepth);
        });
      }
      
      return { totalNodes, maxDepth };
    };

    const { totalNodes, maxDepth } = countNodes(treeData);
    
    // Estimate tree dimensions based on react-d3-tree defaults
    const nodeSize = { x: 200, y: 100 }; // From Tree component props
    const separation = { siblings: 1.2, nonSiblings: 1.5 }; // From Tree component props
    
    // Estimate width: assume a balanced tree structure
    const estimatedWidth = Math.max(totalNodes * nodeSize.x * 0.6, 400);
    const estimatedHeight = maxDepth * nodeSize.y * separation.nonSiblings;
    
    // Container dimensions (approximate)
    const containerWidth = 1200;
    const containerHeight = 800;
    
    // Calculate zoom to fit the tree
    const zoomX = containerWidth / (estimatedWidth + 200);
    const zoomY = containerHeight / (estimatedHeight + 200);
    
    const optimalZoom = Math.min(zoomX, zoomY, 1.0);
    
    // Center the tree
    const centerX = containerWidth / 2;
    const centerY = 150; // Start a bit from the top
    
    return {
      zoom: Math.max(optimalZoom, 0.2), // Lower minimum zoom
      pan: { x: centerX, y: centerY }
    };
  }, []);

  // Apply optimal view when tree data changes
  useEffect(() => {
    if (treeData && !loading) {
      // Add a longer delay to ensure the tree is fully rendered
      const timer = setTimeout(() => {
        const optimalView = calculateOptimalView(treeData);
        // Use a more conservative zoom to ensure everything is visible
        const conservativeZoom = Math.min(optimalView.zoom * 0.8, 0.8);
        setZoomLevel(conservativeZoom);
        setPanPosition(optimalView.pan);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [treeData, loading, calculateOptimalView]);

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
  };

  const fitToView = () => {
    if (treeData) {
      const optimalView = calculateOptimalView(treeData);
      // Use a more conservative zoom to ensure everything is visible
      const conservativeZoom = Math.min(optimalView.zoom * 0.7, 0.6);
      setZoomLevel(conservativeZoom);
      setPanPosition(optimalView.pan);
    }
  };

  // Handle circle actions (create, edit, move)
  const handleCircleAction = async (action, data) => {
    if (!contract) return;
    setLoading(true);
    setIsTransactionPending(true);
    setAnimationState(0);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CIRCLE_HIERARCHY_ADDRESS, CIRCLE_HIERARCHY_ABI, signer);

      let transaction;

      switch (action) {
        case 'create':
          transaction = await contract.createCircle(data.purpose, data.circleType || 0, data.parentId || 0);
          break;
        case 'edit':
          transaction = await contract.editCircle(data.circleId, data.purpose, data.circleType || 0);
          break;
        case 'move':
          // For now, just log the move action
          console.log('Move action:', data);
          break;
        default:
          throw new Error('Unknown action');
      }

      if (transaction) {
        await transaction.wait();
        console.log('Transaction successful:', transaction);
        await fetchAllCircles();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Transaction failed: ' + error.message);
    } finally {
      setIsTransactionPending(false);
      setLoading(false);
      setRefresh((r) => r + 1);
    }
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
        <div 
          className="tree-container"
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: 'calc(100vh - 200px)', // Extended height to accommodate dropdowns
            overflow: 'hidden' // Prevent scrolling issues
          }}
        >
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              Loading...
            </div>
          ) : (
            <Tree
              data={treeData}
              orientation="vertical"
              pathFunc="step"
              translate={{ x: panPosition.x, y: panPosition.y }}
              scaleExtent={{ min: 0.1, max: 2.0 }}
              zoom={zoomLevel}
              onZoom={(zoom) => setZoomLevel(zoom)}
              onUpdate={(update) => setPanPosition(update.translate)}
              nodeSize={{ x: 200, y: 100 }}
              separation={{ siblings: 1.2, nonSiblings: 1.5 }}
              collapsible={false}
              renderCustomNodeElement={({ nodeDatum }) => (
                <CustomNode
                  nodeDatum={nodeDatum}
                  onCircleAction={handleCircleAction}
                  selectedCircle={selectedCircle}
                  setSelectedCircle={setSelectedCircle}
                  circles={circles}
                  contract={contract}
                  onSuccess={() => setRefresh((r) => r + 1)}
                  setIsTransactionPending={setIsTransactionPending}
                />
              )}
            />
          )}
          
          {/* Zoom Controls */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 100
          }}>
            <button
              onClick={handleZoomIn}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid #4ecdc4',
                backgroundColor: 'white',
                color: '#4ecdc4',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid #4ecdc4',
                backgroundColor: 'white',
                color: '#4ecdc4',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              title="Zoom Out"
            >
              −
            </button>
            <button
              onClick={fitToView}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid #4ecdc4',
                backgroundColor: 'white',
                color: '#4ecdc4',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              title="Fit to View"
            >
              ⊞
            </button>
          </div>
        </div>
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
