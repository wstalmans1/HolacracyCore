// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HolacracyOrganization.sol";

contract HolacracyOrganizationFactory {
    address[] public organizations;
    event OrganizationCreated(address indexed org, address[] founders, string anchorPurpose);

    function createOrganization(
        address[] memory founders,
        string memory anchorPurpose,
        HolacracyOrganization.RoleInput[] memory initialRoles,
        HolacracyOrganization.RoleAssignment[] memory assignments
    ) public returns (address) {
        HolacracyOrganization org = new HolacracyOrganization(founders, anchorPurpose);
        org.addInitialRoles(initialRoles);
        org.assignInitialRoles(assignments);
        organizations.push(address(org));
        emit OrganizationCreated(address(org), founders, anchorPurpose);
        return address(org);
    }

    function getOrganizations() public view returns (address[] memory) {
        return organizations;
    }
} 