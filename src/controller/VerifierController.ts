import { Inject, Controller, Get, Post, Query, Body } from '@midwayjs/core';
import { VerifierMainService } from '../service/VerifierMainService';
import { VpMessageRequest } from '../request/VpMessageRequest';

@Controller('/api')
export class VerifierController {
  @Inject()
  verifierMainService: VerifierMainService;

  @Get('/get_qualification')
  getQualification(
    @Query('proposalNum') proposalNum: number,
    @Query('guardian') guardianDidUrl: string,
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
}
