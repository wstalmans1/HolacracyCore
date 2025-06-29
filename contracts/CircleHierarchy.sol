// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CircleHierarchy
 * @dev Hierarchical circles with Policy/Implementation types. Anyone can create/move circles. The root (Constitution) is fixed.
 */
contract CircleHierarchy {
    enum CircleType { Policy, Implementation }

    struct Circle {
        uint256 id;
        string purpose;
        CircleType circleType;
        uint256 parentId;
        uint256[] children;
        bool exists;
    }

    uint256 public nextCircleId;
    mapping(uint256 => Circle) public circles;
    uint256 public constant ROOT_ID = 0;

    // Events
    event CircleCreated(uint256 indexed id, string purpose, CircleType circleType, uint256 parentId);
    event CircleMoved(uint256 indexed id, uint256 oldParentId, uint256 newParentId);
    event CircleEdited(uint256 indexed id, string oldPurpose, string newPurpose, CircleType oldType, CircleType newType);

    constructor() {
        // Create the root circle (Constitution)
        circles[ROOT_ID] = Circle({
            id: ROOT_ID,
            purpose: "Constitution Circle",
            circleType: CircleType.Policy,
            parentId: ROOT_ID,
            children: new uint256[](0),
            exists: true
        });
        nextCircleId = 1;
        emit CircleCreated(ROOT_ID, "Constitution Circle", CircleType.Policy, ROOT_ID);
    }

    /**
     * @dev Create a new circle under a parent.
     * @param _purpose The purpose/name of the circle.
     * @param _circleType 0 for Policy, 1 for Implementation.
     * @param _parentId The parent circle's ID.
     */
    function createCircle(string memory _purpose, uint8 _circleType, uint256 _parentId) external {
        require(_parentId == ROOT_ID || circles[_parentId].exists, "Parent does not exist");
        require(_circleType <= uint8(CircleType.Implementation), "Invalid type");
        uint256 id = nextCircleId++;
        circles[id] = Circle({
            id: id,
            purpose: _purpose,
            circleType: CircleType(_circleType),
            parentId: _parentId,
            children: new uint256[](0),
            exists: true
        });
        circles[_parentId].children.push(id);
        emit CircleCreated(id, _purpose, CircleType(_circleType), _parentId);
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