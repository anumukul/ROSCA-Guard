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
    uint256 public platformFeePercent = 100;
    uint256 public totalPlatformRevenue;
    address public treasury;
    address public yieldManager;
    bool public protocolPaused;

    mapping(uint256 => address) public circles;
    mapping(address => uint256[]) public userCircles;
    mapping(string => uint256[]) public circlesByCountry;
    mapping(string => bool) public supportedCountries;

    struct CircleInfo {
        address circleAddress;
        ROSCACircle.CircleParams params;
        address creator;
        uint256 createdAt;
        uint256 memberCount;
        bool isActive;
        bool isCompleted;
        uint256 currentRound;
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
    event PlatformFeeCollected(uint256 amount, uint256 circleId);
    event CountryAdded(string country);

    modifier onlyWhenNotPaused() {
        require(!protocolPaused, "Protocol is paused");
        _;
    }

    constructor(address _pyusd, address _kycVerifier) {
        require(_pyusd != address(0), "Invalid PYUSD address");
        require(_kycVerifier != address(0), "Invalid KYC verifier");
        PYUSD = _pyusd;
        kycVerifier = _kycVerifier;
        treasury = msg.sender;
        _transferOwnership(msg.sender);
        _addSupportedCountry("GLOBAL");
    }

    function createCircle(
        uint256 monthlyAmount,
        uint256 maxMembers,
        uint256 duration,
        string memory country,
        uint256 minAge,
        uint256 maxAge
    ) external onlyWhenNotPaused nonReentrant returns (uint256 circleId) {
        require(monthlyAmount >= 1e6, "Minimum 1 PYUSD");
        require(maxMembers >= 2 && maxMembers <= 20, "Invalid member count");
        require(minAge >= 18 && maxAge <= 100, "Invalid age range");
        require(minAge <= maxAge, "Invalid age range");
        require(duration >= 1 && duration <= 36, "Duration 1-36 months");

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
        require(
            _getUserActiveCircleCount(msg.sender) < 3,
            "Too many active circles"
        );
        ROSCACircle(circles[circleId]).joinCircle();
        userCircles[msg.sender].push(circleId);
        emit CircleJoined(circleId, msg.sender);
    }

    function collectPlatformFee(uint256 circleId, uint256 amount) external {
        require(circles[circleId] == msg.sender, "Only circle can call");
        IERC20(PYUSD).safeTransferFrom(msg.sender, treasury, amount);
        totalPlatformRevenue += amount;
        emit PlatformFeeCollected(amount, circleId);
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

        return
            CircleInfo({
                circleAddress: circles[circleId],
                params: params,
                creator: circle.owner(),
                createdAt: block.timestamp,
                memberCount: memberCount,
                isActive: isActive,
                isCompleted: isCompleted,
                currentRound: currentRound
            });
    }

    function getUserCircles(
        address user
    ) external view returns (uint256[] memory) {
        return userCircles[user];
    }

    function getCirclesByCountry(
        string memory country
    ) external view returns (uint256[] memory) {
        return circlesByCountry[bytes(country).length > 0 ? country : "GLOBAL"];
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
        require(_feePercent <= 500, "Fee too high");
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
}
