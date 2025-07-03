// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HolacracyOrganization {
    string public constant constitutionURI = "https://www.holacracy.org/constitution/5-0/";
    address[] public founders;
    mapping(address => bool) public hasSignedConstitution;
    mapping(address => bool) public isPartner;
    uint256 public nextCircleId;
    uint256 public nextRoleId;
    uint256 public anchorCircleId;
    bool public initialSetupDone;

    struct Role {
        string name;
        string purpose;
        string[] domains;
        string[] accountabilities;
        address assignedTo;
    }
    struct Circle {
        uint256 id;
        string purpose;
        address[] leads;
        uint256[] roles;
        bool exists;
    }
    struct RoleInput {
        string name;
        string purpose;
        string[] domains;
        string[] accountabilities;
    }
    struct RoleAssignment {
        uint256 roleIndex;
        address assignedTo;
    }

    mapping(uint256 => Circle) public circles;
    mapping(uint256 => Role) public roles;

    event ConstitutionSigned(address indexed partner);
    event PartnerAdded(address indexed partner);
    event CircleCreated(uint256 indexed id, string purpose, address[] leads);
    event RoleCreated(uint256 indexed id, string name, address assignedTo);

    constructor(
        address[] memory _founders,
        string memory anchorPurpose
    ) {
        require(_founders.length > 0, "At least one founder required");
        founders = _founders;
        anchorCircleId = 0;
        nextCircleId = 1;
        nextRoleId = 1;
        // Create anchor circle
        Circle storage anchor = circles[anchorCircleId];
        anchor.id = anchorCircleId;
        anchor.purpose = anchorPurpose;
        anchor.leads = _founders;
        anchor.exists = true;
        emit CircleCreated(anchorCircleId, anchorPurpose, _founders);
        // Register founders as partners (but require explicit signature)
        for (uint256 k = 0; k < _founders.length; k++) {
            isPartner[_founders[k]] = true;
        }
        initialSetupDone = false;
    }

    function addInitialRoles(RoleInput[] memory initialRoles) external {
        require(!initialSetupDone, "Initial setup already done");
        Circle storage anchor = circles[anchorCircleId];
        for (uint256 i = 0; i < initialRoles.length; i++) {
            RoleInput memory input = initialRoles[i];
            roles[nextRoleId] = Role({
                name: input.name,
                purpose: input.purpose,
                domains: input.domains,
                accountabilities: input.accountabilities,
                assignedTo: address(0)
            });
            anchor.roles.push(nextRoleId);
            emit RoleCreated(nextRoleId, input.name, address(0));
            nextRoleId++;
        }
    }

    function assignInitialRoles(RoleAssignment[] memory assignments) external {
        require(!initialSetupDone, "Initial setup already done");
        Circle storage anchor = circles[anchorCircleId];
        for (uint256 j = 0; j < assignments.length; j++) {
            uint256 roleId = anchor.roles[assignments[j].roleIndex];
            roles[roleId].assignedTo = assignments[j].assignedTo;
            emit RoleCreated(roleId, roles[roleId].name, assignments[j].assignedTo);
        }
        initialSetupDone = true;
    }

    function signConstitution() external {
        require(isPartner[msg.sender], "Not a partner");
        require(!hasSignedConstitution[msg.sender], "Already signed");
        hasSignedConstitution[msg.sender] = true;
        emit ConstitutionSigned(msg.sender);
    }

    function addPartner(address newPartner) external {
        // Only founders can add partners (could be extended to governance)
        require(isFounder(msg.sender), "Only founder can add");
        require(!isPartner[newPartner], "Already a partner");
        isPartner[newPartner] = true;
        emit PartnerAdded(newPartner);
    }

    function isFounder(address user) public view returns (bool) {
        for (uint256 i = 0; i < founders.length; i++) {
            if (founders[i] == user) return true;
        }
        return false;
    }

    // Add more governance, circle, and role management functions as needed
} 