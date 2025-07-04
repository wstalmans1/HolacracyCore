// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HolacracyOrganization.sol";

contract HolacracyOrganizationFactory {
    struct Initiative {
        uint id;
        string name;
        address creator;
        address[] partners;
        mapping(address => bool) hasSigned;
        bool exists;
    }

    uint public nextInitiativeId;
    mapping(uint => Initiative) private initiatives;
    uint[] public initiativeIds;
    address[] public organizations;

    event InitiativeStarted(uint indexed id, string name, address indexed creator);
    event InitiativeCancelled(uint indexed id);
    event PreOrgConstitutionSigned(uint indexed initiativeId, address indexed partner);
    event OrganizationCreated(address indexed org, uint indexed initiativeId, address[] founders, string anchorPurpose);

    // Start a new pre-org initiative
    function startPreOrgInitiative(string memory name) public returns (uint) {
        uint id = nextInitiativeId++;
        Initiative storage ini = initiatives[id];
        ini.id = id;
        ini.name = name;
        ini.creator = msg.sender;
        ini.exists = true;
        initiativeIds.push(id);
        emit InitiativeStarted(id, name, msg.sender);
        return id;
    }

    // Cancel/delete an initiative (only creator or anyone if not yet signed by anyone)
    function cancelInitiative(uint id) public {
        Initiative storage ini = initiatives[id];
        require(ini.exists, "Initiative does not exist");
        require(msg.sender == ini.creator || ini.partners.length == 0, "Only creator or if no partners");
        delete initiatives[id];
        // Remove from initiativeIds array
        for (uint i = 0; i < initiativeIds.length; i++) {
            if (initiativeIds[i] == id) {
                initiativeIds[i] = initiativeIds[initiativeIds.length - 1];
                initiativeIds.pop();
                break;
            }
        }
        emit InitiativeCancelled(id);
    }

    // Sign the constitution for a specific initiative
    function signPreOrgConstitution(uint id) public {
        Initiative storage ini = initiatives[id];
        require(ini.exists, "Initiative does not exist");
        require(!ini.hasSigned[msg.sender], "Already signed");
        ini.hasSigned[msg.sender] = true;
        ini.partners.push(msg.sender);
        emit PreOrgConstitutionSigned(id, msg.sender);
    }

    // Get the list of pre-org partners for an initiative
    function getPreOrgPartners(uint id) public view returns (address[] memory) {
        Initiative storage ini = initiatives[id];
        require(ini.exists, "Initiative does not exist");
        return ini.partners;
    }

    // Get initiative info (id, name, creator, partner count, exists)
    function getInitiative(uint id) public view returns (
        uint, string memory, address, uint, bool
    ) {
        Initiative storage ini = initiatives[id];
        return (ini.id, ini.name, ini.creator, ini.partners.length, ini.exists);
    }

    // Get all open initiative ids
    function getInitiativeIds() public view returns (uint[] memory) {
        return initiativeIds;
    }

    // Create an organization from an initiative
    function createOrganization(
        uint id,
        string memory anchorPurpose,
        HolacracyOrganization.RoleInput[] memory initialRoles,
        HolacracyOrganization.RoleAssignment[] memory assignments
    ) public returns (address) {
        Initiative storage ini = initiatives[id];
        require(ini.exists, "Initiative does not exist");
        require(ini.partners.length > 0, "No pre-org partners");
        HolacracyOrganization org = new HolacracyOrganization(ini.partners, anchorPurpose);
        org.addInitialRoles(initialRoles);
        org.assignInitialRoles(assignments);
        organizations.push(address(org));
        emit OrganizationCreated(address(org), id, ini.partners, anchorPurpose);
        // Delete initiative after org creation
        delete initiatives[id];
        for (uint i = 0; i < initiativeIds.length; i++) {
            if (initiativeIds[i] == id) {
                initiativeIds[i] = initiativeIds[initiativeIds.length - 1];
                initiativeIds.pop();
                break;
            }
        }
        return address(org);
    }

    function getOrganizations() public view returns (address[] memory) {
        return organizations;
    }
} 