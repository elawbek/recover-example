import { ethers } from "hardhat";

import { splitSignature } from "ethers/lib/utils";

import { id } from "ethers/lib/utils";

import { Test__factory } from "../typechain-types";

describe("Test", () => {
  it("recover", async () => {
    const [owner] = await ethers.getSigners();
    const test = await new Test__factory(owner).deploy();

    const domain = {
      name: await test.NAME(),
      chainId: await owner.getChainId(),
      version: "1",
      verifyingContract: test.address,
    };

    const types = {
      ProposalData: [
        { name: "values", type: "uint256[]" },
        { name: "calldatas", type: "bytes[]" },
        { name: "descriptionHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const calldata = test.interface.encodeFunctionData("nonces", [
      owner.address,
    ]);
    const calldata2 = test.interface.encodeFunctionData("NAME");

    const value = {
      values: [42, 42],
      calldatas: [calldata, calldata2],
      descriptionHash: id("TEST TEST"),
      nonce: await test.nonces(owner.address),
    };

    const signature = await owner._signTypedData(domain, types, value);
    const splitted = splitSignature(signature);

    console.log(
      owner.address,
      await test.proposalData(
        [42, 42],
        [calldata, calldata2],
        id("TEST TEST"),
        splitted.r,
        splitted.yParityAndS
      )
    );
  });
});
