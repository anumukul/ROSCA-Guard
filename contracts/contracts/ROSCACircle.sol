// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IKYCVerifier {
    function isEligibleForROSCA(
        address user,
        string memory requiredCountry,
        uint256 circleMinAge,
        uint256 circleMaxAge
    ) external view returns (bool eligible, string memory reason);

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
        );
}

contract ROSCACircle is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Member {
        address memberAddress;
        bool hasContributedCurrentRound;
        bool hasReceivedPayout;
        uint256 reputationScore;
        uint256 joinedAt;
        uint256 totalContributions;
        uint256 missedContributions;
        string nationality;
        uint256 currentAge;
    }

    struct CircleParams {
        uint256 monthlyAmount;
        uint256 maxMembers;
        uint256 duration;
        string country;
        uint256 minAge;
        uint256 maxAge;
        uint256 platformFeePercent;
    }

    struct RoundInfo {
        uint256 roundNumber;
        address recipient;
        uint256 totalCollected;
        uint256 payoutAmount;
        uint256 contributorCount;
        uint256 startTime;
        uint256 endTime;
        bool isCompleted;
        uint256 yieldEarned;
    }

    IERC20 public immutable PYUSD;
    IKYCVerifier public immutable kycVerifier;
    address public immutable factory;

    CircleParams public circleParams;
    Member[] public members;
    RoundInfo[] public rounds;

    mapping(address => uint256) public memberIndex;
    mapping(address => bool) public isMember;
    mapping(address => bool) public hasReceivedPayout;
    mapping(uint256 => mapping(address => bool)) public roundContributions;
    mapping(uint256 => mapping(address => uint256))
        public contributionTimestamps;

    uint256 public currentRound;
    uint256 public circleStartTime;
    uint256 public totalYieldEarned;
    uint256 public totalFeesCollected;

    bool public isActive;
    bool public isCompleted;
    bool public emergencyPaused;

    event MemberJoined(
        address indexed member,
        uint256 memberCount,
        string nationality
    );
    event ContributionMade(
        address indexed contributor,
        uint256 amount,
        uint256 round,
        uint256 timestamp
    );
    event PayoutDistributed(
        address indexed recipient,
        uint256 amount,
        uint256 round,
        uint256 fees
    );
    event CircleStarted(uint256 startTime, uint256 expectedEndTime);
    event CircleCompleted(
        uint256 totalRounds,
        uint256 totalVolume,
        uint256 totalYield
    );
    event EmergencyExit(
        address indexed member,
        uint256 refundAmount,
        uint256 penalty
    );
    event YieldEarned(uint256 amount, string source);
    event ReputationUpdated(address indexed member, uint256 newScore);

    modifier onlyKYCVerified() {
        (bool eligible, string memory reason) = kycVerifier.isEligibleForROSCA(
            msg.sender,
            circleParams.country,
            circleParams.minAge,
            circleParams.maxAge
        );
        require(eligible, reason);
        _;
    }

    modifier onlyActiveCircle() {
        require(
            isActive && !isCompleted && !emergencyPaused,
            "Circle not active"
        );
        _;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "Not a circle member");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call");
        _;
    }

    constructor(
        address _pyusd,
        address _kycVerifier,
        address _factory,
        CircleParams memory _params,
        address _creator
    ) {
        require(_pyusd != address(0), "Invalid PYUSD address");
        require(_kycVerifier != address(0), "Invalid KYC verifier");
        require(_params.monthlyAmount > 0, "Invalid monthly amount");
        require(
            _params.maxMembers >= 2 && _params.maxMembers <= 20,
            "Invalid member count"
        );
        require(_params.platformFeePercent <= 500, "Fee too high");

        PYUSD = IERC20(_pyusd);
        kycVerifier = IKYCVerifier(_kycVerifier);
        factory = _factory;
        circleParams = _params;

        _transferOwnership(_creator);
    }

    function joinCircle() external onlyKYCVerified nonReentrant {
        require(!isActive, "Circle already started");
        require(members.length < circleParams.maxMembers, "Circle full");
        require(!isMember[msg.sender], "Already a member");

        // Get user nationality and age for records - fixed tuple unpacking
        (
            bool isVerified,
            string memory nationality,
            uint256 ageAtVerification,
            ,
            ,

        ) = kycVerifier.getUserVerificationDetails(msg.sender);
        require(isVerified, "User not verified");

        // Transfer initial deposit (first month contribution)
        PYUSD.safeTransferFrom(
            msg.sender,
            address(this),
            circleParams.monthlyAmount
        );

        members.push(
            Member({
                memberAddress: msg.sender,
                hasContributedCurrentRound: false,
                hasReceivedPayout: false,
                reputationScore: 100, // Starting reputation
                joinedAt: block.timestamp,
                totalContributions: circleParams.monthlyAmount,
                missedContributions: 0,
                nationality: nationality,
                currentAge: ageAtVerification
            })
        );

        memberIndex[msg.sender] = members.length - 1;
        isMember[msg.sender] = true;

        emit MemberJoined(msg.sender, members.length, nationality);

        // Start circle when full
        if (members.length == circleParams.maxMembers) {
            _startCircle();
        }
    }

    function makeContribution()
        external
        onlyMember
        onlyActiveCircle
        nonReentrant
    {
        require(_isContributionPeriod(), "Outside contribution period");
        require(
            !roundContributions[currentRound][msg.sender],
            "Already contributed this round"
        );

        PYUSD.safeTransferFrom(
            msg.sender,
            address(this),
            circleParams.monthlyAmount
        );

        roundContributions[currentRound][msg.sender] = true;
        contributionTimestamps[currentRound][msg.sender] = block.timestamp;
        members[memberIndex[msg.sender]].hasContributedCurrentRound = true;
        members[memberIndex[msg.sender]].totalContributions += circleParams
            .monthlyAmount;

        // Update current round info
        rounds[currentRound].contributorCount++;
        rounds[currentRound].totalCollected += circleParams.monthlyAmount;

        emit ContributionMade(
            msg.sender,
            circleParams.monthlyAmount,
            currentRound,
            block.timestamp
        );

        // Check if round is ready for payout
        if (rounds[currentRound].contributorCount == members.length) {
            _prepareRoundPayout();
        }
    }

    function distributePayout() external onlyOwner onlyActiveCircle {
        require(
            rounds[currentRound].contributorCount == members.length,
            "Not all contributions received"
        );
        require(
            rounds[currentRound].recipient != address(0),
            "No recipient selected"
        );
        require(!rounds[currentRound].isCompleted, "Round already completed");

        address recipient = rounds[currentRound].recipient;
        uint256 totalAmount = rounds[currentRound].totalCollected;

        // Calculate platform fee and yield bonus
        uint256 platformFee = (totalAmount * circleParams.platformFeePercent) /
            10000;
        uint256 yieldBonus = rounds[currentRound].yieldEarned;
        uint256 payoutAmount = totalAmount - platformFee + yieldBonus;

        // Transfer payout to recipient
        PYUSD.safeTransfer(recipient, payoutAmount);

        // Transfer fee to factory
        if (platformFee > 0) {
            PYUSD.safeTransfer(factory, platformFee);
            totalFeesCollected += platformFee;
        }

        // Update member status
        members[memberIndex[recipient]].hasReceivedPayout = true;
        hasReceivedPayout[recipient] = true;

        // Complete round
        rounds[currentRound].payoutAmount = payoutAmount;
        rounds[currentRound].endTime = block.timestamp;
        rounds[currentRound].isCompleted = true;

        emit PayoutDistributed(
            recipient,
            payoutAmount,
            currentRound,
            platformFee
        );

        // Update reputation scores
        _updateReputationScores();

        // Prepare next round or complete circle
        if (currentRound + 1 >= members.length) {
            _completeCircle();
        } else {
            _startNextRound();
        }
    }

    function _startCircle() internal {
        isActive = true;
        circleStartTime = block.timestamp;
        currentRound = 0;

        // Initialize first round
        rounds.push(
            RoundInfo({
                roundNumber: 0,
                recipient: address(0),
                totalCollected: 0,
                payoutAmount: 0,
                contributorCount: 0,
                startTime: block.timestamp,
                endTime: 0,
                isCompleted: false,
                yieldEarned: 0
            })
        );

        // Select first recipient
        _selectRoundRecipient();

        emit CircleStarted(
            block.timestamp,
            block.timestamp + (circleParams.duration * 30 days)
        );
    }

    function addYield(uint256 amount, string memory source) external {
        require(msg.sender == factory, "Only factory can add yield");

        totalYieldEarned += amount;

        // Add yield to current round
        if (currentRound < rounds.length && !rounds[currentRound].isCompleted) {
            rounds[currentRound].yieldEarned += amount;
        }

        emit YieldEarned(amount, source);
    }

    function _selectRoundRecipient() internal {
        address bestCandidate = _findBestRecipient();
        require(bestCandidate != address(0), "No eligible recipient found");

        rounds[currentRound].recipient = bestCandidate;
    }

    function _findBestRecipient() internal view returns (address) {
        address bestCandidate = address(0);
        uint256 highestScore = 0;

        for (uint256 i = 0; i < members.length; i++) {
            Member memory member = members[i];

            if (!member.hasReceivedPayout) {
                // Enhanced scoring algorithm
                uint256 score = member.reputationScore;

                // Bonus for seniority
                score += ((block.timestamp - member.joinedAt) / 86400) * 2; // 2 points per day

                // Bonus for contribution consistency
                score +=
                    (member.totalContributions / circleParams.monthlyAmount) *
                    10;

                // Penalty for missed contributions
                if (member.missedContributions > 0) {
                    score = score > (member.missedContributions * 25)
                        ? score - (member.missedContributions * 25)
                        : 0;
                }

                if (score > highestScore) {
                    highestScore = score;
                    bestCandidate = member.memberAddress;
                }
            }
        }

        return bestCandidate;
    }

    function _startNextRound() internal {
        currentRound++;

        // Reset member contribution status
        for (uint256 i = 0; i < members.length; i++) {
            members[i].hasContributedCurrentRound = false;
        }

        // Initialize new round
        rounds.push(
            RoundInfo({
                roundNumber: currentRound,
                recipient: address(0),
                totalCollected: 0,
                payoutAmount: 0,
                contributorCount: 0,
                startTime: block.timestamp,
                endTime: 0,
                isCompleted: false,
                yieldEarned: 0
            })
        );

        _selectRoundRecipient();
    }

    function _completeCircle() internal {
        isCompleted = true;
        isActive = false;

        uint256 totalVolume = circleParams.monthlyAmount *
            members.length *
            (currentRound + 1);
        emit CircleCompleted(currentRound + 1, totalVolume, totalYieldEarned);
    }

    function _updateReputationScores() internal {
        for (uint256 i = 0; i < members.length; i++) {
            uint256 newScore = members[i].reputationScore;

            if (members[i].hasContributedCurrentRound) {
                // Calculate contribution timeliness bonus
                uint256 contributionTime = contributionTimestamps[currentRound][
                    members[i].memberAddress
                ];
                uint256 roundStart = rounds[currentRound].startTime;
                uint256 timeToContribute = contributionTime - roundStart;

                if (timeToContribute < 7 days) {
                    newScore += 10; // Early contribution bonus
                } else if (timeToContribute < 14 days) {
                    newScore += 5; // On-time contribution
                } else {
                    newScore += 2; // Late but contributed
                }
            } else {
                // Penalty for missing contribution
                newScore = newScore > 15 ? newScore - 15 : 0;
                members[i].missedContributions++;
            }

            // Cap reputation between 0 and 300
            if (newScore > 300) newScore = 300;

            members[i].reputationScore = newScore;
            emit ReputationUpdated(members[i].memberAddress, newScore);
        }
    }

    function _isContributionPeriod() internal view returns (bool) {
        if (!isActive || currentRound >= rounds.length) return false;

        uint256 roundStart = rounds[currentRound].startTime;
        uint256 contributionDeadline = roundStart + 25 days; // 25 days to contribute each month

        return
            block.timestamp >= roundStart &&
            block.timestamp <= contributionDeadline;
    }

    function _prepareRoundPayout() internal {
        rounds[currentRound].endTime = block.timestamp;
    }

    function emergencyExit() external onlyMember nonReentrant {
        require(!isCompleted, "Circle already completed");

        uint256 refundAmount = _calculateRefund(msg.sender);
        uint256 penalty = _calculatePenalty(msg.sender);

        if (refundAmount > penalty) {
            PYUSD.safeTransfer(msg.sender, refundAmount - penalty);
        }

        _removeMember(msg.sender);

        emit EmergencyExit(
            msg.sender,
            refundAmount > penalty ? refundAmount - penalty : 0,
            penalty
        );
    }

    function _calculateRefund(address member) internal view returns (uint256) {
        Member memory memberData = members[memberIndex[member]];
        return memberData.totalContributions;
    }

    function _calculatePenalty(address member) internal view returns (uint256) {
        Member memory memberData = members[memberIndex[member]];

        // Progressive penalty based on circle progress
        uint256 progressPenalty = (currentRound *
            memberData.totalContributions) /
            members.length /
            4;

        // Reputation-based penalty
        uint256 reputationPenalty = memberData.reputationScore < 50
            ? memberData.totalContributions / 10
            : 0;

        return progressPenalty + reputationPenalty;
    }

    function _removeMember(address member) internal {
        require(isMember[member], "Not a member");

        uint256 index = memberIndex[member];
        uint256 lastIndex = members.length - 1;

        if (index != lastIndex) {
            members[index] = members[lastIndex];
            memberIndex[members[index].memberAddress] = index;
        }

        members.pop();
        delete memberIndex[member];
        delete isMember[member];
    }

    // View functions
    function getCircleInfo()
        external
        view
        returns (
            CircleParams memory params,
            uint256 memberCount,
            uint256 round,
            bool active,
            bool completed
        )
    {
        return (
            circleParams,
            members.length,
            currentRound,
            isActive,
            isCompleted
        );
    }

    function getCurrentRoundInfo() external view returns (RoundInfo memory) {
        require(currentRound < rounds.length, "Invalid round");
        return rounds[currentRound];
    }

    function getMemberInfo(
        address member
    ) external view returns (Member memory) {
        require(isMember[member], "Not a member");
        return members[memberIndex[member]];
    }

    function getAllMembers() external view returns (Member[] memory) {
        return members;
    }

    function getAllRounds() external view returns (RoundInfo[] memory) {
        return rounds;
    }

    function getContributionStatus(
        address member
    )
        external
        view
        returns (
            bool hasContributed,
            uint256 deadline,
            bool canContribute,
            uint256 contributionTime
        )
    {
        hasContributed = roundContributions[currentRound][member];
        deadline = rounds.length > currentRound
            ? rounds[currentRound].startTime + 25 days
            : 0;
        canContribute =
            _isContributionPeriod() &&
            !hasContributed &&
            isMember[member];
        contributionTime = contributionTimestamps[currentRound][member];

        return (hasContributed, deadline, canContribute, contributionTime);
    }

    // Admin functions
    function emergencyPause() external onlyOwner {
        emergencyPaused = true;
    }

    function emergencyUnpause() external onlyOwner {
        emergencyPaused = false;
    }
}
