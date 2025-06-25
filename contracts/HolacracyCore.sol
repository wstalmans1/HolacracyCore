// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HolacracyCore
 * @dev A foundational contract for a Holacracy-based organization.
 * It defines Circles, Roles, and Assignments. Governance for creating
 * and assigning roles is initially centralized to an owner for simplicity.
 */
contract HolacracyCore {
    address public owner;

    struct Role {
        uint256 id;
        string purpose;
        uint256 circleId;
    }

    struct Circle {
        uint256 id;
        string purpose;
        uint256[] roleIds;
    }

    // --- State Variables ---

    Circle[] public circles;
    Role[] public roles;

    // Mapping from a Role ID to the address of the person filling it.
    mapping(uint256 => address) public roleFillers;

    uint256 private nextCircleId;
    uint256 private nextRoleId;

    // --- Events ---

    event CircleCreated(uint256 indexed circleId, string purpose);
    event RoleCreated(uint256 indexed roleId, uint256 indexed circleId, string purpose);
    event RoleAssigned(uint256 indexed roleId, address indexed person);
    event RoleUnassigned(uint256 indexed roleId);

    // --- Modifiers ---

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // --- Constructor ---

    constructor() {
        owner = msg.sender;
        // Create the top-level "Anchor" circle for the organization
        _createCircle("Anchor circle for the entire organization.");
    }

    // --- Governance Functions (Owner-only) ---

    /**
     * @notice Creates a new Circle.
     * @param _purpose The purpose of the new Circle.
     */
    function createCircle(string memory _purpose) public onlyOwner {
        _createCircle(_purpose);
    }

    /**
     * @notice Creates a new Role within a specific Circle.
     * @param _circleId The ID of the Circle this Role belongs to.
     * @param _purpose The purpose of the new Role.
     */
    function createRole(uint256 _circleId, string memory _purpose) public onlyOwner {
        require(_circleId < circles.length, "Circle does not exist");

        uint256 roleId = nextRoleId++;
        roles.push(Role(roleId, _purpose, _circleId));
        circles[_circleId].roleIds.push(roleId);

        emit RoleCreated(roleId, _circleId, _purpose);
    }

    /**
     * @notice Assigns a person (address) to fill a Role.
     * @param _roleId The ID of the Role to assign.
     * @param _person The address of the person to assign to the Role.
     */
    function assignRole(uint256 _roleId, address _person) public onlyOwner {
        require(_roleId < roles.length, "Role does not exist");
        require(_person != address(0), "Cannot assign to the zero address");

        roleFillers[_roleId] = _person;
        emit RoleAssigned(_roleId, _person);
    }

    /**
     * @notice Removes a person from a Role.
     * @param _roleId The ID of the Role to unassign.
     */
    function unassignRole(uint256 _roleId) public onlyOwner {
        require(_roleId < roles.length, "Role does not exist");
        require(roleFillers[_roleId] != address(0), "Role is not assigned");

        delete roleFillers[_roleId];
        emit RoleUnassigned(_roleId);
    }


    // --- View Functions ---

    /**
     * @notice Gets all Role IDs associated with a Circle.
     * @param _circleId The ID of the Circle.
     * @return An array of Role IDs.
     */
    function getCircleRoles(uint256 _circleId) public view returns (uint256[] memory) {
        require(_circleId < circles.length, "Circle does not exist");
        return circles[_circleId].roleIds;
    }

    // --- Internal Functions ---
    
    function _createCircle(string memory _purpose) internal {
        uint256 circleId = nextCircleId++;
        circles.push(Circle({
            id: circleId,
            purpose: _purpose,
        // Initialize an empty dynamic array for roleIds
            roleIds: new uint256[](0)
        }));
        emit CircleCreated(circleId, _purpose);
    }
}