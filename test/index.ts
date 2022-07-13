import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

import {
  keccak256,
  parseEther,
  recoverAddress,
  id,
  defaultAbiCoder,
  solidityPack,
} from "ethers/lib/utils";

import { Token__factory } from "../typechain-types";
import { constants } from "ethers";

describe("Test", () => {
  it("recover", async () => {
    const [owner] = await ethers.getSigners();
    const token = await new Token__factory(owner).deploy();

    const deadline = (await time.latest()) + 1200;

    const domain = {
      name: await token.name(),
      chainId: await owner.getChainId(),
      version: "1",
      verifyingContract: token.address,
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const value = {
      owner: owner.address,
      spender: token.address,
      value: parseEther("1000"),
      nonce: await token.nonces(owner.address),
      deadline,
    };

    const signature = await owner._signTypedData(domain, types, value);

    const EIP712typeHash = id(
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    const EIP712ContractNameHash = id(await token.name());
    const EIP712ContractVersionHash = id("1");
    const EIP712chainId = await owner.getChainId();
    const EIP712TokenAddress = token.address;

    const domainSeparator = keccak256(
      defaultAbiCoder.encode(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
          EIP712typeHash,
          EIP712ContractNameHash,
          EIP712ContractVersionHash,
          EIP712chainId,
          EIP712TokenAddress,
        ]
      )
    );

    const permitTypeHash = id(
      "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );
    const structHash = keccak256(
      defaultAbiCoder.encode(
        ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
        [
          permitTypeHash,
          owner.address,
          token.address,
          parseEther("1000"),
          constants.Zero,
          deadline,
        ]
      )
    );

    const digest = keccak256(
      solidityPack(
        ["string", "bytes32", "bytes32"],
        ["\x19\x01", domainSeparator, structHash]
      )
    );

    const signer = recoverAddress(digest, signature);

    console.log(signer, owner.address);
    expect(signer).to.eq(owner.address);
  });
});
