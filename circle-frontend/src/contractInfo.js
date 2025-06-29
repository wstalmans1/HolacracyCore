export const CIRCLE_HIERARCHY_ADDRESS = "0x272b742BA562752868a7fA4E30c48F965DCf91CC";

export const CIRCLE_HIERARCHY_ABI = [
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
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "purpose",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "enum CircleHierarchy.CircleType",
        "name": "circleType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "parentId",
        "type": "uint256"
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
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "oldPurpose",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newPurpose",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "enum CircleHierarchy.CircleType",
        "name": "oldType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum CircleHierarchy.CircleType",
        "name": "newType",
        "type": "uint8"
      }
    ],
    "name": "CircleEdited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "oldParentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newParentId",
        "type": "uint256"
      }
    ],
    "name": "CircleMoved",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "ROOT_ID",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
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
      },
      {
        "internalType": "enum CircleHierarchy.CircleType",
        "name": "circleType",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "parentId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
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
      },
      {
        "internalType": "uint8",
        "name": "_circleType",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_parentId",
        "type": "uint256"
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
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "getChildren",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_newParentId",
        "type": "uint256"
      }
    ],
    "name": "moveCircle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextCircleId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
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
        "name": "_id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_newPurpose",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "_newCircleType",
        "type": "uint8"
      }
    ],
    "name": "editCircle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]; 