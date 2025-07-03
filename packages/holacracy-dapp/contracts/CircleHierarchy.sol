// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CircleHierarchy
 * @dev Hierarchical circles with Policy/Implementation types. Anyone can create/move circles. The root (Constitution) is fixed.
 */
contract CircleHierarchy is Ownable {
    enum CircleType { Policy, Implementation }

    struct Role {
        string name;
        string purpose;
        string[] domains;
        string[] accountabilities;
        address assignedTo;
    }

    struct Circle {
        uint256 id;
        string name;
        string purpose;
        CircleType circleType;
        uint256 parentId;
        uint256[] children;
        uint256[] subCircles;
        uint256[] roles;
        bool exists;
    }

    uint256 public nextCircleId;
    uint256 public nextRoleId;
    mapping(uint256 => Circle) public circles;
    mapping(uint256 => Role) public roles;
    uint256 public constant ROOT_ID = 0;

    // Events
    event CircleCreated(uint256 indexed circleId, string name, uint256 parentId);
    event RoleCreated(uint256 indexed roleId, string name, uint256 circleId);
    event RoleAssigned(uint256 indexed roleId, address indexed assignedTo);
    event CircleMoved(uint256 indexed id, uint256 oldParentId, uint256 newParentId);
    event CircleEdited(uint256 indexed id, string oldPurpose, string newPurpose, CircleType oldType, CircleType newType);

    constructor(address initialOwner) Ownable(initialOwner) {
        // Create the root circle (Constitution)
        circles[ROOT_ID] = Circle({
            id: ROOT_ID,
            name: "Root Circle",
            purpose: "The root of all circles",
            circleType: CircleType.Policy,
            parentId: ROOT_ID,
            children: new uint256[](0),
            subCircles: new uint256[](0),
            roles: new uint256[](0),
            exists: true
        });
        nextCircleId = 1;
        nextRoleId = 1;
        emit CircleCreated(ROOT_ID, "Root Circle", ROOT_ID);
    }

    /**
     * @dev Create a new circle under a parent.
     * @param name The name of the circle.
     * @param purpose The purpose/name of the circle.
     * @param parentId The parent circle's ID.
     */
    function createCircle(string memory name, string memory purpose, uint256 parentId) public onlyOwner returns (uint256) {
        require(parentId == ROOT_ID || circles[parentId].exists, "Parent does not exist");
        uint256 circleId = nextCircleId++;
        circles[circleId] = Circle({
            id: circleId,
            name: name,
            purpose: purpose,
            circleType: CircleType.Policy,
            parentId: parentId,
            children: new uint256[](0),
            subCircles: new uint256[](0),
            roles: new uint256[](0),
            exists: true
        });
        circles[parentId].children.push(circleId);
        circles[parentId].subCircles.push(circleId);
        emit CircleCreated(circleId, name, parentId);
        return circleId;
    }

    /**
     * @dev Move a circle to a new parent (cannot move root).
     * @param _id The circle to move.
     * @param _newParentId The new parent circle.
     */
    function moveCircle(uint256 _id, uint256 _newParentId) external {
        require(_id != ROOT_ID, "Cannot move root");
        require(circles[_id].exists, "Circle does not exist");
        require(circles[_newParentId].exists, "New parent does not exist");
        require(_id != _newParentId, "Cannot move to self");
        // Prevent cycles
        require(!_isDescendant(_newParentId, _id), "Cannot move to descendant");
        uint256 oldParent = circles[_id].parentId;
        // Remove from old parent's children
        _removeChild(oldParent, _id);
        // Add to new parent's children
        circles[_newParentId].children.push(_id);
        circles[_newParentId].subCircles.push(_id);
        circles[_id].parentId = _newParentId;
        emit CircleMoved(_id, oldParent, _newParentId);
    }

    /**
     * @dev Get a circle's children.
     */
    function getChildren(uint256 _id) external view returns (uint256[] memory) {
        require(circles[_id].exists, "Circle does not exist");
        return circles[_id].children;
    }

    /**
     * @dev Edit a circle's purpose and type (cannot edit root).
     * @param _id The circle to edit.
     * @param _newPurpose The new purpose/name of the circle.
     * @param _newCircleType The new circle type (0 for Policy, 1 for Implementation).
     */
    function editCircle(uint256 _id, string memory _newPurpose, uint8 _newCircleType) external {
        require(_id != ROOT_ID, "Cannot edit root circle");
        require(circles[_id].exists, "Circle does not exist");
        require(bytes(_newPurpose).length > 0, "Purpose cannot be empty");
        require(_newCircleType <= uint8(CircleType.Implementation), "Invalid type");
        
        string memory oldPurpose = circles[_id].purpose;
        CircleType oldType = circles[_id].circleType;
        
        circles[_id].purpose = _newPurpose;
        circles[_id].circleType = CircleType(_newCircleType);
        
        emit CircleEdited(_id, oldPurpose, _newPurpose, oldType, CircleType(_newCircleType));
    }

    function createRole(
        string memory name,
        string memory purpose,
        string[] memory domains,
        string[] memory accountabilities,
        uint256 circleId
    ) public onlyOwner returns (uint256) {
        require(circles[circleId].exists, "Circle does not exist");
        uint256 roleId = nextRoleId++;
        roles[roleId] = Role({
            name: name,
            purpose: purpose,
            domains: domains,
            accountabilities: accountabilities,
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
        uint256[] memory roleIds
    ) {
        Circle storage c = circles[circleId];
        require(c.exists, "Circle does not exist");
        return (c.name, c.purpose, c.parentId, c.subCircles, c.roles);
    }

    function getRole(uint256 roleId) public view returns (
        string memory name,
        string memory purpose,
        string[] memory domains,
        string[] memory accountabilities,
        address assignedTo
    ) {
        Role storage r = roles[roleId];
        require(bytes(r.name).length > 0, "Role does not exist");
        return (r.name, r.purpose, r.domains, r.accountabilities, r.assignedTo);
    }

    // Internal: Remove a child from parent's children array
    function _removeChild(uint256 parentId, uint256 childId) internal {
        uint256[] storage arr = circles[parentId].children;
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == childId) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    // Internal: Prevent cycles in hierarchy
    function _isDescendant(uint256 ancestor, uint256 descendant) internal view returns (bool) {
        if (ancestor == descendant) return true;
        uint256[] storage children = circles[ancestor].children;
        for (uint256 i = 0; i < children.length; i++) {
            if (_isDescendant(children[i], descendant)) return true;
        }
        return false;
    }
} 