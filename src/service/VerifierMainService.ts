import {
  Provide,
  Scope,
  ScopeEnum,
  Config,
  Init,
  Logger,
  ILogger,
} from '@midwayjs/core';
import { decryptMessage } from '@zcloak/message';
import { keys } from '@zcloak/did';
import { Keyring } from '@zcloak/keyring';
import { vpVerify } from '@zcloak/verify';
import { ethers } from 'ethers';
import { zkidAccountAbi } from '../zkidAccountAbi';
import { turncate } from '../utils/string';

import type { Did } from '@zcloak/did';
import type { Message, MessageType } from '@zcloak/message/types';

@Provide()
@Scope(ScopeEnum.Singleton)
export class VerifierMainService {
  @Logger()
  logger: ILogger;

  @Config('verifiers')
  verifiersMnemonic: Array<any>;

  @Config('chains')
  chains: any;

  verifiers: Did[];
  proposalNum: number;
  isQualified: Map<number, Map<string, Map<string, number>>>;

  @Init()
  async init() {
    const keyring = new Keyring();

    this.verifiers[0] = keys.fromMnemonic(
      keyring,
      this.verifiersMnemonic[0].mnemonic
    );
    this.verifiers[1] = keys.fromMnemonic(
      keyring,
      this.verifiersMnemonic[1].mnemonic
    );
    this.verifiers[2] = keys.fromMnemonic(
      keyring,
      this.verifiersMnemonic[2].mnemonic
    );

    this.proposalNum = 0;
    // proposal num => guardian => verifier => boolean (is qualified)
    this.isQualified = new Map<number, Map<string, Map<string, number>>>();
  }

  increaseProposalNum() {
    this.proposalNum++;
  }

  currentProposalNum() {
    return this.proposalNum;
  }

  setQualified(
    proposalNum: number,
    guardianDidUrl: string,
    verifierDidUrl: string,
    verifyRes: number
  ): boolean {
    if (!this.isQualified.has(proposalNum)) {
      this.isQualified.set(proposalNum, new Map<string, Map<string, number>>());

      const guardianMap = this.isQualified.get(proposalNum);
      if (!guardianMap.has(guardianDidUrl)) {
        guardianMap.set(guardianDidUrl, new Map<string, number>());
        const verifierMap = guardianMap.get(guardianDidUrl);
        verifierMap.set(verifierDidUrl, verifyRes);

        return true;
      }
      return false;
    } else {
      return false;
    }
  }

  getQualified(
    proposalNum: number,
    guardianDidUrl: string,
    verifierDidurl: string
  ): number | undefined {
    const guardianMap = this.isQualified.get(proposalNum);
    if (guardianMap) {
      const verifierMap = guardianMap.get(guardianDidUrl);
      if (verifierMap) {
        return verifierMap.get(verifierDidurl);
      }
      return undefined;
    }
    return undefined;
  }

  comprehensiveJudge(
    proposalNum: number,
    guardianDidUrl: string,
    verifiersDidurl: string[]
  ): boolean | undefined {
    // verifier number should be 3
    if (verifiersDidurl.length !== 3) {
      this.logger.info('verifier number not equal 3');
      return undefined;
    }

    let resNum = 0;
    // get qualification num
    for (let i = 0; i < verifiersDidurl.length; i++) {
      const res = this.getQualified(
        proposalNum,
        guardianDidUrl,
        verifiersDidurl[i]
      );
      if (res === undefined) {
        throw new Error(
          `comprehensiveJudge inner error: guraridan (${guardianDidUrl}) donot have qualification, verifier is ${verifiersDidurl[i]}`
        );
      }
      resNum += res;
    }

    // get num
    if (resNum >= 2) {
      return true;
    }
  }

  async vpVerifyWithMessage(
    message: Message<MessageType>,
    zkidAccountAddr: string
  ) {
    for (let i = 0; i < this.verifiers.length; i++) {
      // step0: match verifier DID
      if (message.receiver === this.verifiers[i].getKeyUrl('controller')) {
        const guardianDidUrl = message.sender;
        const verifierDidUrl = this.verifiers[i].getKeyUrl('controller');
        const currentProposalNum = this.currentProposalNum();

        // step1: decrypt message
        const decrypted = await decryptMessage(message, this.verifiers[i]);
        this.logger.info(
          `decrypted message: message id (${decrypted.id}) message type (${decrypted.msgType})`
        );

        // step2: judge message
        if (decrypted.msgType !== 'Send_VP') {
          throw new Error('Not Send_VP typed message!!!');
        }

        // step3: vp verify
        let verifyRes: number;
        const verifyResBool = await vpVerify(decrypted.data);
        this.logger.info(
          `vp result: ${verifyResBool} (messageId: ${message.id})`
        );
        // vpVerifyRes bool => VpVerify number (0 is false, 1 is true)
        if (verifyResBool === true) {
          verifyRes = 1;
        } else {
          verifyRes = 0;
        }

        // step4: store verify res on-chain and off-chain
        // off-chain store
        this.setQualified(
          currentProposalNum,
          guardianDidUrl,
          verifierDidUrl,
          verifyRes
        );
        this.logger.info(
          `get qualified: proposal num (${this.currentProposalNum()}) => guardian (${guardianDidUrl}) => verifier (${verifierDidUrl}) => verifyRes (${verifyRes})`
        );

        // on-chain store
        const provider = new ethers.providers.AlchemyProvider(
          this.chains[0].chian,
          this.chains[0].alchemy_api
        );
        const signer = new ethers.Wallet(this.chains[0].signer_sk, provider);
        const zkidAccountContract = new ethers.Contract(
          zkidAccountAddr,
          zkidAccountAbi,
          signer
        );
        const tx = await zkidAccountContract.submitVpVerifyRes(
          currentProposalNum,
          turncate(guardianDidUrl),
          verifyRes
        );
        await tx.wait();
        return;
      }
    }
    throw new Error('verifier not match');
  }
}
