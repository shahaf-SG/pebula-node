import { ServiceBusMessage, ServiceBusReceivedMessage } from '@azure/service-bus';
import { SbMessageEmitter } from '@pebula/nesbus';

export interface SbBackoffRetryOptions {
  /** The raw delay unit in milliseconds */
  delay?: number;

  /** The factor to use on the delay unit */
  factor?: number;

  /**
   * The distort factor (height = more random, 0 = no randomness)
   * E.G: For the value 10, the final delay will be multiplied by a value between 0.9 to 1.1
   */
  distortFactor?: number;
  retryCount?: number;
  delayType?: 'linear' | 'exponential';

  /**
   * Entity (queue or topic) to re-submit retry messages to.
   * If not set, the entity that this backoff is set on will be used.
   */
  reSubmitter?: SbMessageEmitter;

  /**
   * The key used to store the current retry count on the user properties object stored on the message.
   *
   * defaults to "SB_BACKOFF_RETRY_COUNT"
   */
  retryCountKey?: string;
}

export const DEFAULT_BACKOFF_CONFIG: SbBackoffRetryOptions = {
  delay: 1000,
  factor: 2,
  distortFactor: 10,
  retryCount: 10,
  delayType: 'exponential',
  retryCountKey: 'SB_BACKOFF_RETRY_COUNT',
};

export function extractRetryCount(retryCountKey: string, msg: ServiceBusReceivedMessage): number | false {
  const applicationProps = msg.applicationProperties || {};
  const rawValue = applicationProps[retryCountKey];
  const retryCount = !rawValue
    ? rawValue == 0 ? 0 : Number.NaN // tslint:disable-line: triple-equals
    : Number(rawValue)
  ;
  if (!isNaN(retryCount)) {
    return retryCount;
  }
  return false;
}

export function calculateBackOffTime(config: SbBackoffRetryOptions, currentIteration: number): number {
  if (currentIteration === config.retryCount) {
    return 0;
  }
  const max = 100 + config.distortFactor;
  const min = 100 - config.distortFactor;
  const randomDistortion = Math.floor(Math.random() * (max - min + 1) + min) / 100;

  currentIteration += 1;
  if (config.delayType === 'exponential') {
    return (((Math.pow(Math.max(config.factor, 2), currentIteration) - 1) * config.delay) / 2) * randomDistortion;
  } else {
    return config.delay * config.factor * currentIteration * randomDistortion;
  }
}

export function createBackoffClone(currentIteration: number, msg: ServiceBusReceivedMessage, config: SbBackoffRetryOptions) {
  const clone = cloneMessage(msg);
  if (!clone.applicationProperties) {
    clone.applicationProperties = {};
  }
  clone.applicationProperties[config.retryCountKey] = currentIteration + 1;

  const backOffDelay = calculateBackOffTime(config, currentIteration);
  clone.scheduledEnqueueTimeUtc = new Date(Date.now() + backOffDelay);
  return {
    backOffDelay,
    message: clone,
  };
  
  function cloneMessage(msg: ServiceBusMessage): ServiceBusMessage {
    const clone: ServiceBusMessage = {
      body: msg.body,
      contentType: msg.contentType,
      correlationId: msg.correlationId,
      subject: msg.subject,
      messageId: msg.messageId,
      partitionKey: msg.partitionKey,
      replyTo: msg.replyTo,
      replyToSessionId: msg.replyToSessionId,
      scheduledEnqueueTimeUtc: msg.scheduledEnqueueTimeUtc,
      sessionId: msg.sessionId,
      timeToLive: msg.timeToLive,
      to: msg.to,
      applicationProperties: msg.applicationProperties,
    };
    
    return clone;
  }
}
