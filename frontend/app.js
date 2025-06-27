document.addEventListener('DOMContentLoaded', () => {
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const connectionStatus = document.getElementById('connectionStatus');
    const accountInfo = document.getElementById('accountInfo');
    const contractOwner = document.getElementById('contractOwner');
    const ownerControls = document.getElementById('ownerControls');
    const circlesContainer = document.getElementById('circlesContainer');

    const createCircleBtn = document.getElementById('createCircleBtn');
    const createRoleBtn = document.getElementById('createRoleBtn');
    const assignRoleBtn = document.getElementById('assignRoleBtn');
    const unassignRoleBtn = document.getElementById('unassignRoleBtn');

    const contractAddress = '0x13552427cee733C4a03dB0F77F356843d1492737';
    const requiredChainId = '11155111'; // Sepolia testnet
    const requiredChainIdHex = '0xaa36a7'; // Hex for 11155111
    
    const contractABI = [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "circleId",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "purpose",
              "type": "string"
            }
          ],
          "name": "CircleCreated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "roleId",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "person",
              "type": "address"
            }
          ],
          "name": "RoleAssigned",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "roleId",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "circleId",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "purpose",
              "type": "string"
            }
          ],
          "name": "RoleCreated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "roleId",
              "type": "uint256"
            }
          ],
          "name": "RoleUnassigned",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_roleId",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "_person",
              "type": "address"
            }
          ],
          "name": "assignRole",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "circles",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "purpose",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_purpose",
              "type": "string"
            }
          ],
          "name": "createCircle",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_circleId",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "_purpose",
              "type": "string"
            }
          ],
          "name": "createRole",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_circleId",
              "type": "uint256"
            }
          ],
          "name": "getCircleRoles",
          "outputs": [
            {
              "internalType": "uint256[]",
              "name": "",
              "type": "uint256[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "owner",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "roleFillers",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "roles",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "purpose",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "circleId",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_roleId",
              "type": "uint256"
            }
          ],
          "name": "unassignRole",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
    ];

    let provider;
    let signer;
    let contract;
    let currentUserAddress;

    connectWalletBtn.addEventListener('click', connectWallet);

    async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            connectionStatus.textContent = 'Status: MetaMask is not installed!';
            return;
        }

        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);

            const { chainId } = await provider.getNetwork();
            if (chainId.toString() !== requiredChainId) {
                connectionStatus.textContent = `Status: Please switch to Sepolia Testnet.`;
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: requiredChainIdHex }],
                    });
                    // Re-initialize provider after network switch
                    provider = new ethers.providers.Web3Provider(window.ethereum);
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                         alert('This network is not available in your MetaMask, please add it manually.');
                    } else {
                        alert(`Failed to switch network: ${switchError.message}`);
                    }
                    console.error("Failed to switch network", switchError);
                    return;
                }
            }
            
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            currentUserAddress = await signer.getAddress();
            contract = new ethers.Contract(contractAddress, contractABI, provider);

            connectionStatus.textContent = 'Status: Connected';
            accountInfo.textContent = `Account: ${currentUserAddress}`;
            connectWalletBtn.textContent = 'Connected';
            connectWalletBtn.disabled = true;

            await initialLoad();

        } catch (error) {
            console.error("Could not connect to wallet:", error);
            connectionStatus.textContent = `Status: Connection Failed. ${error.message}`;
        }
    }

    async function initialLoad() {
        await loadContractOwner();
        await loadAllCirclesAndRoles();
        setupEventListeners();
    }

    async function loadContractOwner() {
        try {
            const ownerAddress = await contract.owner();
            contractOwner.textContent = ownerAddress;
            if (currentUserAddress && currentUserAddress.toLowerCase() === ownerAddress.toLowerCase()) {
                ownerControls.style.display = 'block';
            }
        } catch (error) {
            console.error("Error loading contract owner:", error);
        }
    }

    async function loadAllCirclesAndRoles() {
        circlesContainer.innerHTML = '';
        try {
            let i = 0;
            while (true) {
                try {
                    const circle = await contract.circles(i);
                    const circleElement = document.createElement('div');
                    circleElement.classList.add('circle');
                    
                    let rolesHTML = '';
                    const roleIds = await contract.getCircleRoles(circle.id);

                    for (const roleId of roleIds) {
                        const role = await contract.roles(roleId);
                        const filler = await contract.roleFillers(roleId);
                        rolesHTML += `
                            <div class="role">
                                <p><strong>Role ID:</strong> ${role.id}</p>
                                <p><strong>Purpose:</strong> ${role.purpose}</p>
                                <p><strong>Filler:</strong> ${filler === '0x0000000000000000000000000000000000000000' ? 'Unassigned' : filler}</p>
                            </div>
                        `;
                    }

                    circleElement.innerHTML = `
                        <h3>${circle.purpose} (ID: ${circle.id})</h3>
                        ${rolesHTML}
                    `;

                    circlesContainer.appendChild(circleElement);
                    i++;
                } catch (e) {
                    // This is how we know we've reached the end of the circles array
                    break; 
                }
            }
        } catch (error) {
            console.error("Error loading circles and roles:", error);
        }
    }
    
    function setupEventListeners() {
        if (!signer) return;
        
        const contractWithSigner = contract.connect(signer);

        createCircleBtn.addEventListener('click', async () => {
            const purpose = document.getElementById('circlePurpose').value;
            if (!purpose) return alert('Please provide a purpose for the circle.');
            try {
                const tx = await contractWithSigner.createCircle(purpose);
                await tx.wait();
                alert('Circle created successfully!');
                loadAllCirclesAndRoles();
            } catch (error) {
                console.error("Error creating circle:", error);
                alert('Error creating circle.');
            }
        });

        createRoleBtn.addEventListener('click', async () => {
            const circleId = document.getElementById('roleCircleId').value;
            const purpose = document.getElementById('rolePurpose').value;
            if (!circleId || !purpose) return alert('Please provide all fields for the role.');
            try {
                const tx = await contractWithSigner.createRole(circleId, purpose);
                await tx.wait();
                alert('Role created successfully!');
                loadAllCirclesAndRoles();
            } catch (error) {
                console.error("Error creating role:", error);
                alert('Error creating role.');
            }
        });

        assignRoleBtn.addEventListener('click', async () => {
            const roleId = document.getElementById('assignRoleId').value;
            const person = document.getElementById('assignPersonAddress').value;
            if (!roleId || !person) return alert('Please provide all fields for assignment.');
            try {
                const tx = await contractWithSigner.assignRole(roleId, person);
                await tx.wait();
                alert('Role assigned successfully!');
                loadAllCirclesAndRoles();
            } catch (error) {
                console.error("Error assigning role:", error);
                alert('Error assigning role.');
            }
        });

        unassignRoleBtn.addEventListener('click', async () => {
            const roleId = document.getElementById('unassignRoleId').value;
            if (!roleId) return alert('Please provide a role ID to unassign.');
            try {
                const tx = await contractWithSigner.unassignRole(roleId);
                await tx.wait();
                alert('Role unassigned successfully!');
                loadAllCirclesAndRoles();
            } catch (error) {
                console.error("Error unassigning role:", error);
                alert('Error unassigning role.');
            }
        });
    }
}); 