// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {AttestationId} from "@selfxyz/contracts/contracts/constants/AttestationId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./DateParser.sol";

contract KYCVerifier is SelfVerificationRoot, Ownable {
    using DateParser for string;

    struct VerifiedUser {
        bool isVerified;
        string nationality;
        uint256 ageAtVerification;
        uint256 verificationTimestamp;
        bytes32 userIdentifier;
        bool isHuman;
        bool passedOFACCheck;
        bytes32 attestationId;
        string originalDateOfBirth;
    }

    struct CountryStats {
        uint256 userCount;
        bool isSupported;
        uint256 lastUpdate;
    }

    struct VerificationMetrics {
        uint256 totalVerifications;
        uint256 passportVerifications;
        uint256 idCardVerifications;
        uint256 uniqueCountries;
        uint256 avgAge;
        uint256 lastUpdated;
    }

    bytes32 public configId;
    string public scopeSeed;
    bool public isConfigured;
    bool public emergencyPaused;

    mapping(address => VerifiedUser) public verifiedUsers;
    mapping(bytes32 => address) public identifierToAddress;
    mapping(string => CountryStats) public countryStats;
    mapping(bytes32 => bool) public supportedAttestations;
    mapping(address => bool) public blacklistedUsers;

    uint256 public totalVerifiedUsers;
    uint256 public minAge = 18;
    uint256 public maxAge = 100;
    VerificationMetrics public metrics;

    // Events - renamed to avoid conflict
    event UserVerified(
        address indexed userAddress,
        bytes32 indexed userIdentifier,
        string nationality,
        uint256 age,
        bytes32 attestationId,
        uint256 timestamp
    );

    event ConfigUpdated(bytes32 newConfigId);
    event KYCScopeUpdated(uint256 newScope); // Renamed to avoid conflict
    event CountryAdded(string country);
    event AttestationSupported(bytes32 attestationId);
    event UserBlacklisted(address indexed user, string reason);
    event EmergencyPaused(bool paused);
    event VerificationRevoked(address indexed user, string reason);

    modifier whenNotPaused() {
        require(!emergencyPaused, "Contract is paused");
        _;
    }

    modifier onlyConfigured() {
        require(isConfigured, "Contract not configured");
        _;
    }

    constructor(
        address _identityVerificationHubV2,
        uint256 _scope // Changed to uint256 instead of string
    ) SelfVerificationRoot(_identityVerificationHubV2, _scope) {
        _transferOwnership(msg.sender);
        scopeSeed = "rosca-kyc-v1"; // Set default scope seed

        // Support multiple attestation types - using bytes32
        supportedAttestations[AttestationId.E_PASSPORT] = true;
        supportedAttestations[AttestationId.EU_ID_CARD] = true;

        // Initialize metrics
        metrics = VerificationMetrics({
            totalVerifications: 0,
            passportVerifications: 0,
            idCardVerifications: 0,
            uniqueCountries: 0,
            avgAge: 0,
            lastUpdated: block.timestamp
        });

        emit AttestationSupported(AttestationId.E_PASSPORT);
        emit AttestationSupported(AttestationId.EU_ID_CARD);
    }

    function getConfigId(
        bytes32 destinationChainId,
        bytes32 userIdentifier,
        bytes memory userDefinedData
    ) public view override returns (bytes32) {
        require(isConfigured, "Contract not configured yet");
        return configId;
    }

    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal virtual override whenNotPaused {
        require(bytes(output.nationality).length > 0, "Nationality required");
        require(output.userIdentifier != 0, "User identifier required");
        require(!blacklistedUsers[tx.origin], "User is blacklisted");

        // Verify attestation is supported
        require(
            supportedAttestations[output.attestationId],
            "Attestation not supported"
        );

        address userAddress = tx.origin;
        require(userAddress != address(0), "Invalid user address");
        require(
            !verifiedUsers[userAddress].isVerified,
            "User already verified"
        );

        // Calculate age using enhanced date parsing
        uint256 age = _calculateAgeFromDateString(output.dateOfBirth);
        require(age >= minAge && age <= maxAge, "Age not in valid range");

        bytes32 userIdBytes32 = bytes32(output.userIdentifier);
        require(
            identifierToAddress[userIdBytes32] == address(0),
            "User identifier already used"
        );

        // Store comprehensive verification data
        verifiedUsers[userAddress] = VerifiedUser({
            isVerified: true,
            nationality: output.nationality,
            ageAtVerification: age,
            verificationTimestamp: block.timestamp,
            userIdentifier: userIdBytes32,
            isHuman: true,
            passedOFACCheck: true,
            attestationId: output.attestationId,
            originalDateOfBirth: output.dateOfBirth
        });

        identifierToAddress[userIdBytes32] = userAddress;

        // Update statistics
        _updateCountryStats(output.nationality);
        _updateMetrics(output.attestationId, age);

        totalVerifiedUsers++;

        emit UserVerified(
            userAddress,
            userIdBytes32,
            output.nationality,
            age,
            output.attestationId,
            block.timestamp
        );
    }

    function _calculateAgeFromDateString(
        string memory dateOfBirth
    ) internal view returns (uint256) {
        return DateParser.calculateAgeFromDateString(dateOfBirth);
    }

    function _updateCountryStats(string memory country) internal {
        if (!countryStats[country].isSupported) {
            countryStats[country].isSupported = true;
            metrics.uniqueCountries++;
            emit CountryAdded(country);
        }
        countryStats[country].userCount++;
        countryStats[country].lastUpdate = block.timestamp;
    }

    function _updateMetrics(bytes32 attestationId, uint256 age) internal {
        metrics.totalVerifications++;

        if (attestationId == AttestationId.E_PASSPORT) {
            metrics.passportVerifications++;
        } else if (attestationId == AttestationId.EU_ID_CARD) {
            metrics.idCardVerifications++;
        }

        // Update average age
        if (metrics.totalVerifications == 1) {
            metrics.avgAge = age;
        } else {
            metrics.avgAge =
                ((metrics.avgAge * (metrics.totalVerifications - 1)) + age) /
                metrics.totalVerifications;
        }

        metrics.lastUpdated = block.timestamp;
    }

    // Configuration functions
    function configureContract(bytes32 _configId) external onlyOwner {
        require(_configId != bytes32(0), "Invalid config ID");
        configId = _configId;
        isConfigured = true;
        emit ConfigUpdated(_configId);
    }

    function updateScope(uint256 _scope) external onlyOwner {
        _setScope(_scope);
        emit KYCScopeUpdated(_scope);
    }

    function addSupportedAttestation(bytes32 attestationId) external onlyOwner {
        supportedAttestations[attestationId] = true;
        emit AttestationSupported(attestationId);
    }

    function setAgeRange(uint256 _minAge, uint256 _maxAge) external onlyOwner {
        require(
            _minAge >= 18 && _maxAge <= 100 && _minAge <= _maxAge,
            "Invalid age range"
        );
        minAge = _minAge;
        maxAge = _maxAge;
    }

    // Enhanced eligibility checking for ROSCA integration
    function isEligibleForROSCA(
        address user,
        string memory requiredCountry,
        uint256 circleMinAge,
        uint256 circleMaxAge
    ) external view returns (bool eligible, string memory reason) {
        if (emergencyPaused) {
            return (false, "KYC system paused");
        }

        if (blacklistedUsers[user]) {
            return (false, "User blacklisted");
        }

        VerifiedUser memory userData = verifiedUsers[user];

        if (!userData.isVerified) {
            return (false, "User not KYC verified");
        }

        if (!userData.isHuman) {
            return (false, "Humanity verification failed");
        }

        if (!userData.passedOFACCheck) {
            return (false, "OFAC check failed");
        }

        // Check country eligibility (empty string means global)
        if (
            bytes(requiredCountry).length > 0 &&
            keccak256(bytes(userData.nationality)) !=
            keccak256(bytes(requiredCountry))
        ) {
            return (false, "Country restriction");
        }

        // Check age eligibility with current age calculation
        uint256 currentAge = _getCurrentAge(user);
        if (currentAge < circleMinAge || currentAge > circleMaxAge) {
            return (false, "Age restriction");
        }

        return (true, "Eligible");
    }

    function _getCurrentAge(address user) internal view returns (uint256) {
        VerifiedUser memory userData = verifiedUsers[user];
        if (!userData.isVerified) return 0;

        // Calculate current age considering time passed since verification
        uint256 timeElapsed = block.timestamp - userData.verificationTimestamp;
        uint256 yearsElapsed = timeElapsed / (365 days);

        return userData.ageAtVerification + yearsElapsed;
    }

    // Enhanced query functions
    function getUserVerificationDetails(
        address user
    )
        external
        view
        returns (
            bool isVerified,
            string memory nationality,
            uint256 ageAtVerification,
            uint256 verificationTimestamp,
            bool isHuman,
            bool passedOFACCheck
        )
    {
        VerifiedUser memory userData = verifiedUsers[user];
        return (
            userData.isVerified,
            userData.nationality,
            userData.ageAtVerification,
            userData.verificationTimestamp,
            userData.isHuman,
            userData.passedOFACCheck
        );
    }

    function isUserVerified(address user) external view returns (bool) {
        return verifiedUsers[user].isVerified && !blacklistedUsers[user];
    }

    function getTotalStats()
        external
        view
        returns (
            uint256 totalUsers,
            uint256 totalCountries,
            uint256 configScope
        )
    {
        return (totalVerifiedUsers, metrics.uniqueCountries, scope());
    }

    function getCountryStats(
        string memory country
    )
        external
        view
        returns (uint256 userCount, bool isSupported, uint256 lastUpdate)
    {
        CountryStats memory stats = countryStats[country];
        return (stats.userCount, stats.isSupported, stats.lastUpdate);
    }

    function getCurrentScope() external view returns (uint256) {
        return scope();
    }

    function getScopeSeed() external view returns (string memory) {
        return scopeSeed;
    }

    function isContractConfigured() external view returns (bool) {
        return isConfigured;
    }

    // Admin functions
    function blacklistUser(
        address user,
        string memory reason
    ) external onlyOwner {
        blacklistedUsers[user] = true;
        emit UserBlacklisted(user, reason);
    }

    function removeFromBlacklist(address user) external onlyOwner {
        blacklistedUsers[user] = false;
    }

    function revokeVerification(
        address user,
        string memory reason
    ) external onlyOwner {
        require(verifiedUsers[user].isVerified, "User not verified");

        bytes32 identifier = verifiedUsers[user].userIdentifier;
        string memory country = verifiedUsers[user].nationality;

        delete verifiedUsers[user];
        delete identifierToAddress[identifier];

        // Update stats
        if (countryStats[country].userCount > 0) {
            countryStats[country].userCount--;
        }
        if (totalVerifiedUsers > 0) {
            totalVerifiedUsers--;
            metrics.totalVerifications--;
        }

        emit VerificationRevoked(user, reason);
    }

    function emergencyPause() external onlyOwner {
        emergencyPaused = true;
        emit EmergencyPaused(true);
    }

    function emergencyUnpause() external onlyOwner {
        emergencyPaused = false;
        emit EmergencyPaused(false);
    }
}
