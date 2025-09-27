// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ROSCACircle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IROSCAFactory {
    function totalCircles() external view returns (uint256);

    function circles(uint256) external view returns (address);

    function userCircles(address) external view returns (uint256[] memory);

    function circlesByCountry(
        string memory
    ) external view returns (uint256[] memory);

    function totalPlatformRevenue() external view returns (uint256);

    function PYUSD() external view returns (address);
}

contract ROSCAAnalytics is Ownable {
    IROSCAFactory public immutable factory;
    IERC20 public immutable PYUSD;

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

    constructor(address _factory) {
        factory = IROSCAFactory(_factory);
        PYUSD = IERC20(factory.PYUSD());
        _transferOwnership(msg.sender);
    }

    function getAvailableCircles(
        string memory country
    ) external view returns (uint256[] memory) {
        string memory searchCountry = bytes(country).length > 0
            ? country
            : "GLOBAL";
        uint256[] memory countryCircles = factory.circlesByCountry(
            searchCountry
        );
        uint256 availableCount = 0;

        for (uint256 i = 0; i < countryCircles.length; i++) {
            ROSCACircle circle = ROSCACircle(
                factory.circles(countryCircles[i])
            );
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

        uint256[] memory availableCircles = new uint256[](availableCount);
        uint256 index = 0;

        for (uint256 i = 0; i < countryCircles.length; i++) {
            ROSCACircle circle = ROSCACircle(
                factory.circles(countryCircles[i])
            );
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

    function getUserActiveCircles(
        address user
    ) external view returns (uint256[] memory) {
        uint256[] memory allUserCircles = factory.userCircles(user);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allUserCircles.length; i++) {
            ROSCACircle circle = ROSCACircle(
                factory.circles(allUserCircles[i])
            );
            (, , , bool isActive, bool isCompleted) = circle.getCircleInfo();
            if (isActive && !isCompleted) {
                activeCount++;
            }
        }

        uint256[] memory activeCircles = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allUserCircles.length; i++) {
            ROSCACircle circle = ROSCACircle(
                factory.circles(allUserCircles[i])
            );
            (, , , bool isActive, bool isCompleted) = circle.getCircleInfo();
            if (isActive && !isCompleted) {
                activeCircles[index] = allUserCircles[i];
                index++;
            }
        }

        return activeCircles;
    }

    function getAllCircles() external view returns (uint256[] memory) {
        uint256 totalCircles = factory.totalCircles();
        uint256[] memory allCircles = new uint256[](totalCircles);
        for (uint256 i = 0; i < totalCircles; i++) {
            allCircles[i] = i;
        }
        return allCircles;
    }

    function getActiveCircles() external view returns (uint256[] memory) {
        uint256 totalCircles = factory.totalCircles();
        uint256 activeCount = 0;

        for (uint256 i = 0; i < totalCircles; i++) {
            ROSCACircle circle = ROSCACircle(factory.circles(i));
            (, , , bool isActive, bool isCompleted) = circle.getCircleInfo();
            if (isActive && !isCompleted) {
                activeCount++;
            }
        }

        uint256[] memory activeCircles = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < totalCircles; i++) {
            ROSCACircle circle = ROSCACircle(factory.circles(i));
            (, , , bool isActive, bool isCompleted) = circle.getCircleInfo();
            if (isActive && !isCompleted) {
                activeCircles[index] = i;
                index++;
            }
        }

        return activeCircles;
    }

    function getPlatformStats() external view returns (PlatformStats memory) {
        uint256 totalCircles = factory.totalCircles();
        uint256 activeCount = 0;
        uint256 completedCount = 0;
        uint256 totalMembers = 0;
        uint256 currentTVL = 0;

        for (uint256 i = 0; i < totalCircles; i++) {
            ROSCACircle circle = ROSCACircle(factory.circles(i));
            (, uint256 memberCount, , bool isActive, bool isCompleted) = circle
                .getCircleInfo();

            totalMembers += memberCount;
            currentTVL += PYUSD.balanceOf(address(circle));

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
                totalRevenue: factory.totalPlatformRevenue(),
                avgSuccessRate: successRate,
                totalCountries: 5
            });
    }
}
