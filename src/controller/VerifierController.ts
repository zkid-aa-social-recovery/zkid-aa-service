import { Inject, Controller, Get, Post, Query, Body } from '@midwayjs/core';
import { VerifierMainService } from '../service/VerifierMainService';
import { VpMessageRequest, SetRequest } from '../request/VpMessageRequest';

@Controller('/api')
export class VerifierController {
  @Inject()
  verifierMainService: VerifierMainService;

  @Get('/get_current_proposal_num')
  getCurrentProposalNum() {
    const proposalNum = this.verifierMainService.currentProposalNum();
    return { code: 200, data: proposalNum, message: 'success' };
  }

  @Get('/get_qualification')
  getQualification(
    @Query('proposalNum') proposalNum: number,
    @Query('guardianDidUrl') guardianDidUrl: string,
    @Query('verifiersDidUrl') verifiersDidUrl: string[]
  ) {
    const qualification = this.verifierMainService.comprehensiveJudge(
      proposalNum,
      guardianDidUrl,
      verifiersDidUrl
    );
    return { code: 200, data: qualification, message: 'success' };
  }

  @Post('/vp_verify')
  async submitVpMessage(@Body() request: VpMessageRequest) {
    await this.verifierMainService.vpVerifyWithMessage(request);
    return { code: 200, data: undefined, message: 'success' };
  }

  // only for test
  @Post('/set_qualified')
  async setQualified(@Body() request: SetRequest) {
    const { proposalNum, guardianDidUrl, verifierDidUrl, verifyRes } = request;
    this.verifierMainService.setQualified(
      proposalNum,
      guardianDidUrl,
      verifierDidUrl,
      verifyRes
    );
    return { code: 200, data: undefined, message: 'success' };
  }
}
