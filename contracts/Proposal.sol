// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "./permit/libraries/ECDSA.sol";
import "./permit/EIP712.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Proposal is EIP712 {
    using Counters for Counters.Counter;
    mapping(address => Counters.Counter) private _nonces;

    string public constant NAME = "Test";

    bytes32 private constant _PROPOSAL_DATA_TYPE_HASH =
        keccak256(
            "ProposalData(uint256[] values,bytes[] calldatas,bytes32 descriptionHash,uint256 nonce)"
        );

    constructor() EIP712(NAME, "1") {}

    function proposalData(
        uint256[] calldata values,
        bytes[] calldata calldatas,
        bytes32 descriptionHash,
        bytes32 r,
        bytes32 vs
    ) external view returns (address signer) {
        bytes32[] memory hashedCalldatas = new bytes32[](calldatas.length);

        // for (uint256 i; i < calldatas.length; i++) {
        //     hashedCalldatas[i] = keccak256(abi.encodePacked(calldatas[i]));
        // }

        assembly {
            let calldatasLength := calldataload(add(0x04, calldataload(0x24)))
            let ptr := mload(0x40)
            for {
                let i := 0
            } lt(i, calldatasLength) {
                i := add(i, 1)
            } {
                let elPc := add(
                    0x20,
                    add(
                        calldataload(0x24),
                        add(
                            0x04,
                            calldataload(
                                add(mul(0x20, i), add(0x24, calldataload(0x24)))
                            )
                        )
                    )
                )
                let elLength := calldataload(elPc)
                let el := add(elPc, 0x20)
                calldatacopy(ptr, el, elLength)

                mstore(
                    add(mul(0x20, i), add(hashedCalldatas, 0x20)),
                    keccak256(ptr, elLength)
                )
            }
        }

        bytes32 structHash = keccak256(
            abi.encode(
                _PROPOSAL_DATA_TYPE_HASH,
                keccak256(abi.encodePacked(values)),
                keccak256(abi.encodePacked(hashedCalldatas)),
                descriptionHash,
                0
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);

        signer = ECDSA.recover(hash, r, vs);
    }

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner].current();
    }

    function _useNonce(address owner)
        internal
        virtual
        returns (uint256 current)
    {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }
}
