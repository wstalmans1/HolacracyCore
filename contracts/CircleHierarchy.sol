// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CircleHierarchy is Ownable {
    struct Role {
        string name;
        string purpose;
        address assignedTo;
    }

    struct Circle {
        string name;
        string purpose;
        uint256 parentId;
        uint256[] subCircles;
        uint256[] roles;
        bool exists;
        address creator;
    }

    mapping(address => bool) public isPartner;
    uint256 public nextCircleId = 1;
    uint256 public nextRoleId = 1;
    mapping(uint256 => Circle) public circles;
    mapping(uint256 => Role) public roles;

    event CircleCreated(uint256 indexed circleId, string name, uint256 parentId, address creator);
    event RoleCreated(uint256 indexed roleId, string name, uint256 circleId);
    event RoleAssigned(uint256 indexed roleId, address indexed assignedTo);
    event PartnerJoined(address indexed user);

    constructor() Ownable(msg.sender) {
        // Create the root circle
        circles[0] = Circle({
            name: "Root Circle",
            purpose: "The root of all circles",
            parentId: 0,
            subCircles: new uint256[](0),
            roles: new uint256[](0),
            exists: true,
            creator: msg.sender
        });
    }

    function joinAsPartner() external {
        require(!isPartner[msg.sender], "Already a partner");
        isPartner[msg.sender] = true;
        emit PartnerJoined(msg.sender);
    }

    function createCircle(string memory name, string memory purpose, uint256 parentId) public onlyOwner returns (uint256) {
        require(circles[parentId].exists, "Parent circle does not exist");
        uint256 circleId = nextCircleId++;
        circles[circleId] = Circle({
            name: name,
            purpose: purpose,
            parentId: parentId,
            subCircles: new uint256[](0),
            roles: new uint256[](0),
            exists: true,
            creator: msg.sender
        });
        circles[parentId].subCircles.push(circleId);
        emit CircleCreated(circleId, name, parentId, msg.sender);
        return circleId;
    }

    function createRole(string memory name, string memory purpose, uint256 circleId) public onlyOwner returns (uint256) {
        require(circles[circleId].exists, "Circle does not exist");
        uint256 roleId = nextRoleId++;
        roles[roleId] = Role({
            name: name,
            purpose: purpose,
            assignedTo: address(0)
        });
        circles[circleId].roles.push(roleId);
        emit RoleCreated(roleId, name, circleId);
        return roleId;
    }

    function assignRole(uint256 roleId, address user) public onlyOwner {
        require(bytes(roles[roleId].name).length > 0, "Role does not exist");
        roles[roleId].assignedTo = user;
        emit RoleAssigned(roleId, user);
    }

    // View functions for frontend
    function getCircle(uint256 circleId) public view returns (
        string memory name,
        string memory purpose,
        uint256 parentId,
        uint256[] memory subCircles,
        uint256[] memory roleIds,
        address creator
    ) {
        Circle storage c = circles[circleId];
        require(c.exists, "Circle does not exist");
        return (c.name, c.purpose, c.parentId, c.subCircles, c.roles, c.creator);
    }

    function getRole(uint256 roleId) public view returns (
        string memory name,
        string memory purpose,
        address assignedTo
    ) {
        Role storage r = roles[roleId];
        require(bytes(r.name).length > 0, "Role does not exist");
        return (r.name, r.purpose, r.assignedTo);
    }
} 