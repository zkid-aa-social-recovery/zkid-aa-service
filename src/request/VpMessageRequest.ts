import { Rule, RuleType } from '@midwayjs/validate';
import type { Message, MessageType } from '@zcloak/message/types';

export class VpMessageRequest {
  @Rule(RuleType.object().required())
  message: Message<MessageType>;

  @Rule(RuleType.string().required())
  zkidAccountAddr: string;
}
