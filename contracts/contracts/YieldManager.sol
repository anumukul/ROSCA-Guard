// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IROSCACircle {
    function addYield(uint256 amount, string memory source) external;

    function owner() external view returns (address);
}

interface ICompoundV3 {
    function supply(address asset, uint256 amount) external;

    function withdraw(address asset, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);

    function accrueAccount(address account) external;
}

interface IAaveV3Pool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

contract YieldManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct YieldSource {
        string name;
        address contractAddress;
        bool isActive;
        uint256 allocatedAmount;
        uint256 totalYieldGenerated;
        uint256 aprBasisPoints; // APR in basis points (100 = 1%)
    }

    struct CircleYieldInfo {
        uint256 totalDeposited;
        uint256 totalYieldEarned;
        uint256 lastYieldDistribution;
        bool isActive;
    }

    IERC20 public immutable PYUSD;
    address public immutable factory;

    mapping(uint256 => YieldSource) public yieldSources;
    mapping(address => CircleYieldInfo) public circleYieldInfo;
    mapping(address => bool) public authorizedCircles;

    uint256 public totalYieldSources;
    uint256 public totalManagedFunds;
    uint256 public totalYieldGenerated;
    uint256 public platformYieldShare = 1000; // 10% in basis points
    uint256 public constant MAX_PLATFORM_SHARE = 2000; // 20% max

    address public treasury;
    uint256 public treasuryBalance;
    bool public yieldGenerationPaused;

    event YieldSourceAdded(
        uint256 indexed sourceId,
        string name,
        address contractAddress
    );
    event YieldSourceUpdated(
        uint256 indexed sourceId,
        bool isActive,
        uint256 newAPR
    );
    event FundsDeposited(address indexed circle, uint256 amount);
    event FundsWithdrawn(address indexed circle, uint256 amount);
    event YieldDistributed(
        address indexed circle,
        uint256 amount,
        uint256 platformFee
    );
    event YieldHarvested(uint256 indexed sourceId, uint256 amount);
    event EmergencyWithdrawal(address indexed circle, uint256 amount);

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    modifier onlyAuthorizedCircle() {
        require(authorizedCircles[msg.sender], "Only authorized circles");
        _;
    }

    modifier whenYieldNotPaused() {
        require(!yieldGenerationPaused, "Yield generation paused");
        _;
    }

    constructor(address _pyusd, address _factory, address _treasury) {
        require(_pyusd != address(0), "Invalid PYUSD address");
        require(_factory != address(0), "Invalid factory address");
        require(_treasury != address(0), "Invalid treasury address");

        PYUSD = IERC20(_pyusd);
        factory = _factory;
        treasury = _treasury;
        _transferOwnership(msg.sender);

        _initializeYieldSources();
    }

    function _initializeYieldSources() internal {
        // Add Compound V3 as yield source
        _addYieldSource(
            "Compound V3",
            address(0), // Would be actual Compound contract
            true,
            300 // 3% APR
        );

        // Add Aave V3 as yield source
        _addYieldSource(
            "Aave V3",
            address(0), // Would be actual Aave contract
            true,
            250 // 2.5% APR
        );

        // Add simple savings yield (for demo)
        _addYieldSource(
            "Platform Savings",
            address(this),
            true,
            200 // 2% APR
        );
    }

    function authorizeCircle(address circle) external onlyFactory {
        authorizedCircles[circle] = true;
        circleYieldInfo[circle] = CircleYieldInfo({
            totalDeposited: 0,
            totalYieldEarned: 0,
            lastYieldDistribution: block.timestamp,
            isActive: true
        });
    }

    function deauthorizeCircle(address circle) external onlyFactory {
        authorizedCircles[circle] = false;
        circleYieldInfo[circle].isActive = false;
    }

    function depositFunds(
        uint256 amount
    ) external onlyAuthorizedCircle whenYieldNotPaused nonReentrant {
        require(amount > 0, "Amount must be positive");

        PYUSD.safeTransferFrom(msg.sender, address(this), amount);

        circleYieldInfo[msg.sender].totalDeposited += amount;
        totalManagedFunds += amount;

        // Allocate funds to best yielding source
        _allocateToYieldSources(amount);

        emit FundsDeposited(msg.sender, amount);
    }

    function withdrawFunds(
        uint256 amount
    ) external onlyAuthorizedCircle nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(
            circleYieldInfo[msg.sender].totalDeposited >= amount,
            "Insufficient balance"
        );

        // Withdraw from yield sources if needed
        _withdrawFromYieldSources(amount);

        PYUSD.safeTransfer(msg.sender, amount);

        circleYieldInfo[msg.sender].totalDeposited -= amount;
        totalManagedFunds -= amount;

        emit FundsWithdrawn(msg.sender, amount);
    }

    function harvestYield() external onlyOwner nonReentrant {
        uint256 totalHarvested = 0;

        for (uint256 i = 0; i < totalYieldSources; i++) {
            if (yieldSources[i].isActive) {
                uint256 harvested = _harvestFromSource(i);
                totalHarvested += harvested;

                if (harvested > 0) {
                    emit YieldHarvested(i, harvested);
                }
            }
        }

        if (totalHarvested > 0) {
            totalYieldGenerated += totalHarvested;
        }
    }

    function distributeYieldToCircle(
        address circle
    ) external onlyOwner nonReentrant {
        require(authorizedCircles[circle], "Circle not authorized");
        require(circleYieldInfo[circle].isActive, "Circle not active");

        uint256 yieldAmount = _calculateCircleYield(circle);

        if (yieldAmount > 0) {
            uint256 platformFee = (yieldAmount * platformYieldShare) / 10000;
            uint256 circleYield = yieldAmount - platformFee;

            // Transfer yield to circle
            PYUSD.safeTransfer(circle, circleYield);

            // Add to treasury
            treasuryBalance += platformFee;

            // Update circle info
            circleYieldInfo[circle].totalYieldEarned += circleYield;
            circleYieldInfo[circle].lastYieldDistribution = block.timestamp;

            // Notify circle of yield
            try IROSCACircle(circle).addYield(circleYield, "Yield Manager") {
                emit YieldDistributed(circle, circleYield, platformFee);
            } catch {
                // If circle can't receive yield, add to treasury
                treasuryBalance += circleYield;
            }
        }
    }

    function _calculateCircleYield(
        address circle
    ) internal view returns (uint256) {
        CircleYieldInfo memory info = circleYieldInfo[circle];

        if (info.totalDeposited == 0) return 0;

        // Calculate time since last distribution
        uint256 timeSinceLastDistribution = block.timestamp -
            info.lastYieldDistribution;

        // Calculate yield based on deposited amount and time
        // Using average APR of 2.5% for simplification
        uint256 annualYield = (info.totalDeposited * 250) / 10000; // 2.5%
        uint256 yieldAmount = (annualYield * timeSinceLastDistribution) /
            (365 days);

        return yieldAmount;
    }

    function _allocateToYieldSources(uint256 amount) internal {
        // Simple allocation: find best APR source
        uint256 bestSourceId = 0;
        uint256 bestAPR = 0;

        for (uint256 i = 0; i < totalYieldSources; i++) {
            if (
                yieldSources[i].isActive &&
                yieldSources[i].aprBasisPoints > bestAPR
            ) {
                bestAPR = yieldSources[i].aprBasisPoints;
                bestSourceId = i;
            }
        }

        if (bestAPR > 0) {
            yieldSources[bestSourceId].allocatedAmount += amount;
            _depositToSource(bestSourceId, amount);
        }
    }

    function _withdrawFromYieldSources(uint256 amount) internal {
        uint256 remaining = amount;

        // Withdraw from sources in reverse order of APR (lowest first)
        for (uint256 i = 0; i < totalYieldSources && remaining > 0; i++) {
            YieldSource storage source = yieldSources[i];

            if (source.allocatedAmount > 0) {
                uint256 toWithdraw = remaining > source.allocatedAmount
                    ? source.allocatedAmount
                    : remaining;

                _withdrawFromSource(i, toWithdraw);
                source.allocatedAmount -= toWithdraw;
                remaining -= toWithdraw;
            }
        }

        require(remaining == 0, "Insufficient funds in yield sources");
    }

    function _depositToSource(uint256 sourceId, uint256 amount) internal {
        YieldSource memory source = yieldSources[sourceId];

        if (source.contractAddress == address(this)) {
            // Platform savings - just hold the funds
            return;
        }

        // Add integration with external protocols here
        // For now, just track the allocation
    }

    function _withdrawFromSource(uint256 sourceId, uint256 amount) internal {
        YieldSource memory source = yieldSources[sourceId];

        if (source.contractAddress == address(this)) {
            // Platform savings - funds are already here
            return;
        }

        // Add integration with external protocols here
    }

    function _harvestFromSource(uint256 sourceId) internal returns (uint256) {
        // Simplified yield calculation for demo
        YieldSource storage source = yieldSources[sourceId];

        if (source.allocatedAmount == 0) return 0;

        // Calculate yield based on APR and time
        uint256 timeElapsed = 30 days; // Assume monthly harvest
        uint256 yieldAmount = (source.allocatedAmount *
            source.aprBasisPoints *
            timeElapsed) / (10000 * 365 days);

        source.totalYieldGenerated += yieldAmount;
        return yieldAmount;
    }

    function _addYieldSource(
        string memory name,
        address contractAddress,
        bool isActive,
        uint256 aprBasisPoints
    ) internal {
        yieldSources[totalYieldSources] = YieldSource({
            name: name,
            contractAddress: contractAddress,
            isActive: isActive,
            allocatedAmount: 0,
            totalYieldGenerated: 0,
            aprBasisPoints: aprBasisPoints
        });

        emit YieldSourceAdded(totalYieldSources, name, contractAddress);
        totalYieldSources++;
    }

    // Admin functions
    function addYieldSource(
        string memory name,
        address contractAddress,
        bool isActive,
        uint256 aprBasisPoints
    ) external onlyOwner {
        require(aprBasisPoints <= 5000, "APR too high"); // Max 50%
        _addYieldSource(name, contractAddress, isActive, aprBasisPoints);
    }

    function updateYieldSource(
        uint256 sourceId,
        bool isActive,
        uint256 newAPR
    ) external onlyOwner {
        require(sourceId < totalYieldSources, "Invalid source ID");
        require(newAPR <= 5000, "APR too high");

        yieldSources[sourceId].isActive = isActive;
        yieldSources[sourceId].aprBasisPoints = newAPR;

        emit YieldSourceUpdated(sourceId, isActive, newAPR);
    }

    function setPlatformYieldShare(uint256 newShare) external onlyOwner {
        require(newShare <= MAX_PLATFORM_SHARE, "Share too high");
        platformYieldShare = newShare;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasury = newTreasury;
    }

    function pauseYieldGeneration() external onlyOwner {
        yieldGenerationPaused = true;
    }

    function unpauseYieldGeneration() external onlyOwner {
        yieldGenerationPaused = false;
    }

    function withdrawTreasuryFunds() external onlyOwner {
        require(treasuryBalance > 0, "No treasury balance");

        uint256 amount = treasuryBalance;
        treasuryBalance = 0;

        PYUSD.safeTransfer(treasury, amount);
    }

    function emergencyWithdrawCircleFunds(address circle) external onlyOwner {
        require(authorizedCircles[circle], "Circle not authorized");

        uint256 amount = circleYieldInfo[circle].totalDeposited;
        if (amount > 0) {
            _withdrawFromYieldSources(amount);
            PYUSD.safeTransfer(circle, amount);

            circleYieldInfo[circle].totalDeposited = 0;
            totalManagedFunds -= amount;

            emit EmergencyWithdrawal(circle, amount);
        }
    }

    // View functions
    function getCircleYieldInfo(
        address circle
    ) external view returns (CircleYieldInfo memory) {
        return circleYieldInfo[circle];
    }

    function getYieldSource(
        uint256 sourceId
    ) external view returns (YieldSource memory) {
        require(sourceId < totalYieldSources, "Invalid source ID");
        return yieldSources[sourceId];
    }

    function getAllYieldSources() external view returns (YieldSource[] memory) {
        YieldSource[] memory sources = new YieldSource[](totalYieldSources);
        for (uint256 i = 0; i < totalYieldSources; i++) {
            sources[i] = yieldSources[i];
        }
        return sources;
    }

    function getPlatformStats()
        external
        view
        returns (
            uint256 totalFunds,
            uint256 totalYield,
            uint256 activeCircles,
            uint256 activeSources
        )
    {
        uint256 activeCircleCount = 0;
        uint256 activeSourceCount = 0;

        // Count would be implemented with proper tracking
        // Simplified for this implementation

        return (
            totalManagedFunds,
            totalYieldGenerated,
            activeCircleCount,
            activeSourceCount
        );
    }

    function estimateYieldForAmount(
        uint256 amount,
        uint256 timeInSeconds
    ) external view returns (uint256) {
        if (totalYieldSources == 0) return 0;

        // Use average APR across active sources
        uint256 totalAPR = 0;
        uint256 activeCount = 0;

        for (uint256 i = 0; i < totalYieldSources; i++) {
            if (yieldSources[i].isActive) {
                totalAPR += yieldSources[i].aprBasisPoints;
                activeCount++;
            }
        }

        if (activeCount == 0) return 0;

        uint256 avgAPR = totalAPR / activeCount;
        return (amount * avgAPR * timeInSeconds) / (10000 * 365 days);
    }
}
