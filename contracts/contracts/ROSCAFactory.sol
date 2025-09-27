// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ROSCACircle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ROSCAFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable PYUSD;
    address public kycVerifier;

    uint256 public totalCircles;
    uint256 public platformFeePercent = 100; // 1% in basis points
    uint256 public totalPlatformRevenue;
    uint256 public totalValueLocked;

    address public treasury;
    address public yieldManager;
    bool public protocolPaused;

    mapping(uint256 => address) public circles;
    mapping(address => uint256[]) public userCircles;
    mapping(string => uint256[]) public circlesByCountry;
    mapping(address => uint256) public userReputationScores;
    mapping(string => bool) public supportedCountries;

    struct CircleInfo {
        address circleAddress;
        ROSCACircle.CircleParams params;
        address creator;
        uint256 createdAt;
        uint256 memberCount;
        bool isActive;
        bool isCompleted;
        uint256 totalVolume;
        uint256 currentRound;
    }

    struct PlatformStats {
        uint256 totalCircles;
        uint256 activeCircles;
        uint256 completedCircles;
        uint256 totalMembers;
        uint256 totalValueLocked;
        uint256 totalRevenue;
        uint256 avgSuccessRate;
        uint256 totalCountries;
    }

    event CircleCreated(
        uint256 indexed circleId,
        address indexed creator,
        address circleAddress,
        uint256 monthlyAmount,
        string country,
        uint256 maxMembers
    );

    event CircleJoined(uint256 indexed circleId, address indexed member);
    event CircleCompleted(uint256 indexed circleId, uint256 totalVolume);
    event PlatformFeeCollected(uint256 amount, uint256 circleId);
    event YieldDistributed(address indexed circle, uint256 amount);
    event CountryAdded(string country);
    event ReputationUpdated(address indexed user, uint256 newScore);

    modifier onlyWhenNotPaused() {
        require(!protocolPaused, "Protocol is paused");
        _;
    }

    modifier onlyValidKYC(address user) {
        require(kycVerifier != address(0), "KYC verifier not set");
        // Additional KYC checks handled in ROSCACircle
        _;
    }

    constructor(address _pyusd, address _kycVerifier) {
        require(_pyusd != address(0), "Invalid PYUSD address");
        require(_kycVerifier != address(0), "Invalid KYC verifier");

        PYUSD = _pyusd;
        kycVerifier = _kycVerifier;
        treasury = msg.sender;
        _transferOwnership(msg.sender);

        // Initialize supported countries
        _addSupportedCountry("GLOBAL"); // Global circles
    }

    function createCircle(
        uint256 monthlyAmount,
        uint256 maxMembers,
        uint256 duration,
        string memory country,
        uint256 minAge,
        uint256 maxAge
    ) external onlyWhenNotPaused nonReentrant returns (uint256 circleId) {
        require(monthlyAmount >= 1e6, "Minimum 1 PYUSD"); // 1 PYUSD minimum (6 decimals)
        require(maxMembers >= 2 && maxMembers <= 20, "Invalid member count");
        require(minAge >= 18 && maxAge <= 100, "Invalid age range");
        require(minAge <= maxAge, "Invalid age range");
        require(duration >= 1 && duration <= 36, "Duration 1-36 months");

        // Validate country
        if (bytes(country).length > 0) {
            require(supportedCountries[country], "Country not supported");
        }

        circleId = totalCircles++;

        ROSCACircle.CircleParams memory params = ROSCACircle.CircleParams({
            monthlyAmount: monthlyAmount,
            maxMembers: maxMembers,
            duration: duration,
            country: country,
            minAge: minAge,
            maxAge: maxAge,
            platformFeePercent: platformFeePercent
        });

        ROSCACircle newCircle = new ROSCACircle(
            PYUSD,
            kycVerifier,
            address(this),
            params,
            msg.sender
        );

        circles[circleId] = address(newCircle);
        userCircles[msg.sender].push(circleId);

        // Add to country tracking
        if (bytes(country).length > 0) {
            circlesByCountry[country].push(circleId);
        } else {
            circlesByCountry["GLOBAL"].push(circleId);
        }

        emit CircleCreated(
            circleId,
            msg.sender,
            address(newCircle),
            monthlyAmount,
            country,
            maxMembers
        );

        return circleId;
    }

    function joinCircle(
        uint256 circleId
    ) external onlyWhenNotPaused nonReentrant {
        require(circleId < totalCircles, "Circle does not exist");

        ROSCACircle circle = ROSCACircle(circles[circleId]);

        // Check if user is already in too many active circles
        require(
            _getUserActiveCircleCount(msg.sender) < 3,
            "Too many active circles"
        );

        circle.joinCircle();

        userCircles[msg.sender].push(circleId);

        emit CircleJoined(circleId, msg.sender);
    }

    function _getUserActiveCircleCount(
        address user
    ) internal view returns (uint256 count) {
        uint256[] memory userCircleIds = userCircles[user];

        for (uint256 i = 0; i < userCircleIds.length; i++) {
            ROSCACircle circle = ROSCACircle(circles[userCircleIds[i]]);
            (, , , bool isActive, bool isCompleted) = circle.getCircleInfo();

            if (isActive && !isCompleted) {
                count++;
            }
        }
    }

    function collectPlatformFee(uint256 circleId, uint256 amount) external {
        require(circles[circleId] == msg.sender, "Only circle can call");

        IERC20(PYUSD).safeTransferFrom(msg.sender, treasury, amount);
        totalPlatformRevenue += amount;

        emit PlatformFeeCollected(amount, circleId);
    }

    function distributeYield(
        uint256 circleId,
        uint256 yieldAmount
    ) external onlyOwner {
        require(circleId < totalCircles, "Circle does not exist");
        require(yieldManager != address(0), "Yield manager not set");

        address circleAddress = circles[circleId];
        IERC20(PYUSD).safeTransferFrom(
            yieldManager,
            circleAddress,
            yieldAmount
        );

        ROSCACircle(circleAddress).addYield(yieldAmount, "Platform Yield");

        emit YieldDistributed(circleAddress, yieldAmount);
    }

    function getCircleInfo(
        uint256 circleId
    ) external view returns (CircleInfo memory) {
        require(circleId < totalCircles, "Circle does not exist");

        ROSCACircle circle = ROSCACircle(circles[circleId]);
        (
            ROSCACircle.CircleParams memory params,
            uint256 memberCount,
            uint256 currentRound,
            bool isActive,
            bool isCompleted
        ) = circle.getCircleInfo();

        // Calculate total volume
        uint256 totalVolume = 0;
        if (isCompleted) {
            totalVolume =
                params.monthlyAmount *
                params.maxMembers *
                params.maxMembers;
        } else if (isActive) {
            totalVolume =
                params.monthlyAmount *
                memberCount *
                (currentRound + 1);
        }

        return
            CircleInfo({
                circleAddress: circles[circleId],
                params: params,
                creator: circle.owner(),
                createdAt: block.timestamp, // Would store actual creation time in production
                memberCount: memberCount,
                isActive: isActive,
                isCompleted: isCompleted,
                totalVolume: totalVolume,
                currentRound: currentRound
            });
    }

    function getAvailableCircles(
        string memory country
    ) external view returns (uint256[] memory) {
        string memory searchCountry = bytes(country).length > 0
            ? country
            : "GLOBAL";
        uint256[] memory countryCircles = circlesByCountry[searchCountry];
        uint256 availableCount = 0;

        // Count available circles
        for (uint256 i = 0; i < countryCircles.length; i++) {
            ROSCACircle circle = ROSCACircle(circles[countryCircles[i]]);
            (
                ROSCACircle.CircleParams memory params,
                uint256 memberCount,
                ,
                bool isActive,
                bool isCompleted
            ) = circle.getCircleInfo();

            if (!isActive && !isCompleted && memberCount < params.maxMembers) {
                availableCount++;
            }
        }

        // Build available circles array
        uint256[] memory availableCircles = new uint256[](availableCount);
        uint256 index = 0;

        for (uint256 i = 0; i < countryCircles.length; i++) {
            ROSCACircle circle = ROSCACircle(circles[countryCircles[i]]);
            (
                ROSCACircle.CircleParams memory params,
                uint256 memberCount,
                ,
                bool isActive,
                bool isCompleted
            ) = circle.getCircleInfo();

            if (!isActive && !isCompleted && memberCount < params.maxMembers) {
                availableCircles[index] = countryCircles[i];
                index++;
            }
        }

        return availableCircles;
    }

    function getUserCircles(
        address user
    ) external view returns (uint256[] memory) {
        return userCircles[user];
    }

    function getUserActiveCircles(
        address user
    ) external view returns (uint256[] memory) {
        uint256[] memory allUserCircles = userCircles[user];
        uint256 activeCount = 0;

        // Count active circles
        for (uint256 i = 0; i < allUserCircles.length; i++) {
            ROSCACircle circle = ROSCACircle(circles[allUserCircles[i]]);
            (, , , bool isActive, bool isCompleted) = circle.getCircleInfo();

            if (isActive && !isCompleted) {
                activeCount++;
            }
        }

        // Build active circles array
        uint256[] memory activeCircles = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allUserCircles.length; i++) {
            ROSCACircle circle = ROSCACircle(circles[allUserCircles[i]]);
            (, , , bool isActive, bool isCompleted) = circle.getCircleInfo();

            if (isActive && !isCompleted) {
                activeCircles[index] = allUserCircles[i];
                index++;
            }
        }

        return activeCircles;
    }

    function getAllCircles() external view returns (uint256[] memory) {
        uint256[] memory allCircles = new uint256[](totalCircles);
        for (uint256 i = 0; i < totalCircles; i++) {
            allCircles[i] = i;
        }
        return allCircles;
    }

    function getActiveCircles() external view returns (uint256[] memory) {
        uint256 activeCount = 0;

        // Count active circles
        for (uint256 i = 0; i < totalCircles; i++) {
            ROSCACircle circle = ROSCACircle(circles[i]);
            (, , , bool isActive, bool isCompleted) = circle.getCircleInfo();

            if (isActive && !isCompleted) {
                activeCount++;
            }
        }

        // Build active circles array
        uint256[] memory activeCircles = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < totalCircles; i++) {
            ROSCACircle circle = ROSCACircle(circles[i]);
            (, , , bool isActive, bool isCompleted) = circle.getCircleInfo();

            if (isActive && !isCompleted) {
                activeCircles[index] = i;
                index++;
            }
        }

        return activeCircles;
    }

    function getPlatformStats() external view returns (PlatformStats memory) {
        uint256 activeCount = 0;
        uint256 completedCount = 0;
        uint256 totalMembers = 0;
        uint256 currentTVL = 0;

        for (uint256 i = 0; i < totalCircles; i++) {
            ROSCACircle circle = ROSCACircle(circles[i]);
            (, uint256 memberCount, , bool isActive, bool isCompleted) = circle
                .getCircleInfo();

            totalMembers += memberCount;
            currentTVL += IERC20(PYUSD).balanceOf(address(circle));

            if (isActive && !isCompleted) {
                activeCount++;
            } else if (isCompleted) {
                completedCount++;
            }
        }

        uint256 successRate = totalCircles > 0
            ? (completedCount * 100) / totalCircles
            : 0;

        return
            PlatformStats({
                totalCircles: totalCircles,
                activeCircles: activeCount,
                completedCircles: completedCount,
                totalMembers: totalMembers,
                totalValueLocked: currentTVL,
                totalRevenue: totalPlatformRevenue,
                avgSuccessRate: successRate,
                totalCountries: _getCountryCount()
            });
    }

    function _getCountryCount() internal view returns (uint256) {
        // Basic implementation for demonstration
        return 5; // Placeholder
    }

    function updateUserReputation(address user, uint256 newScore) external {
        // Only circles can update reputation
        bool isValidCircle = false;
        for (uint256 i = 0; i < totalCircles; i++) {
            if (circles[i] == msg.sender) {
                isValidCircle = true;
                break;
            }
        }
        require(isValidCircle, "Only circles can update reputation");

        userReputationScores[user] = newScore;
        emit ReputationUpdated(user, newScore);
    }

    function getUserReputation(address user) external view returns (uint256) {
        return userReputationScores[user];
    }

    // Admin functions
    function addSupportedCountry(string memory country) external onlyOwner {
        _addSupportedCountry(country);
    }

    function _addSupportedCountry(string memory country) internal {
        supportedCountries[country] = true;
        emit CountryAdded(country);
    }

    function setKYCVerifier(address _kycVerifier) external onlyOwner {
        require(_kycVerifier != address(0), "Invalid address");
        kycVerifier = _kycVerifier;
    }

    function setYieldManager(address _yieldManager) external onlyOwner {
        require(_yieldManager != address(0), "Invalid address");
        yieldManager = _yieldManager;
    }

    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 500, "Fee too high"); // Max 5%
        platformFeePercent = _feePercent;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    function pauseProtocol() external onlyOwner {
        protocolPaused = true;
    }

    function unpauseProtocol() external onlyOwner {
        protocolPaused = false;
    }

    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    // Receive platform fees
    receive() external payable {
        revert("Use PYUSD transfers only");
    }
}
