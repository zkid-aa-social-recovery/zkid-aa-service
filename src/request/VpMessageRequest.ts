import { Rule, RuleType } from '@midwayjs/validate';
import type { Message, MessageType } from '@zcloak/message/types';

export class VpMessageRequest {
  @Rule(RuleType.object().required())
  message: Message<MessageType>;

  @Rule(RuleType.string().required())
  zkidAccountAddr: string;
}

export class SetRequest {
  @Rule(RuleType.number().required())
  proposalNum: number;

  @Rule(RuleType.string().required())
  guardianDidUrl: string;

  @Rule(RuleType.string().required())
  verifierDidUrl: string;

  @Rule(RuleType.boolean().required())
  verifyRes: number;
}
