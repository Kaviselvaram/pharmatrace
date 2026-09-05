// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SupplyChainRegistry
 * @notice Role-Based Access Control and Node Identity Directory for Pharmaceutical Supply Chain
 * @dev Grounded in CBS3002 Information Security Principles (Confidentiality & Access Control)
 */
contract SupplyChainRegistry is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant CARRIER_ROLE = keccak256("CARRIER_ROLE");
    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    struct NodeInfo {
        address nodeAddress;
        string organizationName;
        bytes32 role;
        bool isActive;
        uint256 registeredAt;
    }

    mapping(address => NodeInfo) private _nodes;
    address[] private _nodeList;

    event NodeRegistered(address indexed nodeAddress, string organizationName, bytes32 indexed role);
    event NodeDeactivated(address indexed nodeAddress);

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Registry: invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
    }

    /**
     * @notice Registers a new node with an authorized supply chain role
     */
    function registerNode(
        address nodeAddress,
        string calldata organizationName,
        bytes32 role
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(nodeAddress != address(0), "Registry: invalid node address");
        require(bytes(organizationName).length > 0, "Registry: organization name required");
        require(
            role == MANUFACTURER_ROLE ||
            role == CARRIER_ROLE ||
            role == HOSPITAL_ROLE ||
            role == AUDITOR_ROLE,
            "Registry: invalid role"
        );

        if (!_nodes[nodeAddress].isActive && _nodes[nodeAddress].registeredAt == 0) {
            _nodeList.push(nodeAddress);
        }

        _nodes[nodeAddress] = NodeInfo({
            nodeAddress: nodeAddress,
            organizationName: organizationName,
            role: role,
            isActive: true,
            registeredAt: block.timestamp
        });

        _grantRole(role, nodeAddress);

        emit NodeRegistered(nodeAddress, organizationName, role);
    }

    /**
     * @notice Deactivates an active node
     */
    function deactivateNode(address nodeAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_nodes[nodeAddress].isActive, "Registry: node not active");
        _nodes[nodeAddress].isActive = false;
        _revokeRole(_nodes[nodeAddress].role, nodeAddress);

        emit NodeDeactivated(nodeAddress);
    }

    /**
     * @notice View helper to check if an account is authorized for a specific role
     */
    function isAuthorized(address account, bytes32 role) external view returns (bool) {
        return _nodes[account].isActive && hasRole(role, account);
    }

    /**
     * @notice Retrieve information for a registered node
     */
    function getNode(address account) external view returns (NodeInfo memory) {
        require(_nodes[account].registeredAt > 0, "Registry: node does not exist");
        return _nodes[account];
    }

    /**
     * @notice Returns total number of registered nodes
     */
    function totalNodes() external view returns (uint256) {
        return _nodeList.length;
    }

    /**
     * @notice Returns all node addresses
     */
    function getAllNodes() external view returns (address[] memory) {
        return _nodeList;
    }
}
