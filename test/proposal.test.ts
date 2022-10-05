import { expect } from "chai";
import { ethers } from "hardhat";

import { splitSignature, id } from "ethers/lib/utils";

import { Proposal__factory } from "../typechain-types";

describe("Proposal", () => {
  it("recover", async () => {
    const [owner] = await ethers.getSigners();
    const proposal = await new Proposal__factory(owner).deploy();

    const domain = {
      name: await proposal.NAME(),
      chainId: await owner.getChainId(),
      version: "1",
      verifyingContract: proposal.address,
    };

    const types = {
      ProposalData: [
        { name: "values", type: "uint256[]" },
        { name: "calldatas", type: "bytes[]" },
        { name: "descriptionHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const calldata = proposal.interface.encodeFunctionData("nonces", [
      owner.address,
    ]);
    const calldata2 = proposal.interface.encodeFunctionData("NAME");

    const value = {
      values: [42, 42],
      calldatas: [calldata, calldata2],
      descriptionHash: id("TEST TEST"),
      nonce: await proposal.nonces(owner.address),
    };

    const signature = await owner._signTypedData(domain, types, value);
    const splitted = splitSignature(signature);

    expect(owner.address).to.eq(
      await proposal.proposalData(
        [42, 42],
        [calldata, calldata2],
        id("TEST TEST"),
        splitted.r,
        splitted.yParityAndS
      )
    );
  });
});
