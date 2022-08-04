// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract Yul {
    uint256 private _secretNumber;
    address public owner;
    mapping(address => uint256) public guesses;

    bytes32 public secretWord;

    constructor(uint256) {
        assembly {
            sstore(_secretNumber.slot, mload(0x80))
            sstore(owner.slot, caller())
        }
    }

    function getSecretNumber() external view returns (uint256) {
        assembly {
            mstore(0x00, sload(_secretNumber.slot))
            return(0x00, 0x20)
        }
    }

    function setSecretNumber(uint256) external {
        assembly {
            if iszero(eq(caller(), sload(owner.slot))) {
                revert(0, 0)
            }
            sstore(_secretNumber.slot, calldataload(0x04))
        }
    }

    function addGuess(uint256) external {
        assembly {
            mstore(0x00, caller())
            mstore(0x20, guesses.slot)
            sstore(keccak256(0x00, 0x40), calldataload(0x04))
        }
    }

    function addMultipleGuesses(address[] calldata, uint256[] calldata)
        external
    {
        assembly {
            let usersLength := calldataload(add(0x04, calldataload(0x04)))
            let guessesLength := calldataload(add(0x04, calldataload(0x24)))

            if iszero(eq(usersLength, guessesLength)) {
                revert(0, 0)
            }

            mstore(0x20, guesses.slot)
            for {
                let i := 0
            } lt(i, usersLength) {
                i := add(i, 1)
            } {
                mstore(
                    0x00,
                    calldataload(
                        add(mul(0x20, i), add(0x24, calldataload(0x04)))
                    )
                )
                sstore(
                    keccak256(0x00, 0x40),
                    calldataload(
                        add(mul(0x20, i), add(0x24, calldataload(0x24)))
                    )
                )
            }
        }
    }

    function hashSecretWord(string calldata) external {
        assembly {
            calldatacopy(0, 0x44, calldataload(0x24))
            sstore(secretWord.slot, keccak256(0x00, calldataload(0x24)))
        }
    }
}
