import * as Joi from 'joi';
import { Schema } from 'joi';
import * as urlRegex from 'url-regex';
import {
  Scope,
  SubscriptionStatus,
  SubscriptionType
}from './types';

export const JoiWebhookReceiptResult = Joi.object({
  success: Joi.boolean().required(),
  statusCode: Joi.number().required()
});

export const JoiWebhookReceipt = Joi.object({
  id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  subscriptionId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  url: Joi.string().uri({ scheme: [ 'https', 'http' ] }).required(),
  timestamp: Joi.number().required(),
  result: JoiWebhookReceiptResult.required()
});

const address = Joi.string().regex(/^0x[0-9a-fA-F]{40}$/).lowercase();
const topic = Joi.string().regex(/^0x[0-9a-fA-F]{64}$/).lowercase();
const methodSignature = Joi.string().regex(/^0x[0-9a-fA-F]{8}$/).lowercase();

/**
 * Helper function that gives us a filter option for a particular type
 */
function filterOption(item: Schema) {
  return Joi.alternatives(
    // Either null...
    Joi.any().valid(null),
    // or the item...
    item,
    // or an array of the item.
    Joi.array().items(item).min(1).max(100)
  );
}

const topicFilter = filterOption(topic);
const addressFilter = filterOption(address);
const methodSignatureFilter = filterOption(methodSignature);

export const JoiSubscriptionLogFilter = Joi.object({
  address: addressFilter,
  topic0: topicFilter,
  topic1: topicFilter,
  topic2: topicFilter,
  topic3: topicFilter
});

export const JoiSubscriptionTransactionFilter = Joi.object({
  from: addressFilter,
  to: addressFilter,
  methodSignature: methodSignatureFilter
});

export const JoiCreateSubscriptionRequest = Joi.object().keys({
  name: Joi.string().min(1).max(256).required(),
  type: Joi.string().valid(Object.keys(SubscriptionType)).required(),
  description: Joi.string().max(1024),
  webhookUrl: Joi.string()
    .uri({ scheme: [ 'http', 'https' ] })
    .regex(urlRegex(), 'URL regular expression')
    .required(),
  filters: Joi.alternatives().when(
    'type',
    {
      is: SubscriptionType.log,
      then: JoiSubscriptionLogFilter,
      otherwise: JoiSubscriptionTransactionFilter
    }
  ).required()
}).unknown(false);

export const JoiSubscription = JoiCreateSubscriptionRequest.keys({
  id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  timestamp: Joi.number().required(),
  user: Joi.string().required(),
  secret: Joi.string().hex().length(64).required(),
  status: Joi.string().valid(Object.keys(SubscriptionStatus)).required(),
  subscriptionArn: Joi.string().required()
});

export const JoiScope = Joi.string().valid(
  Object.keys(Scope).map((k) => Scope[ k as any ])
);

export const JoiCreateApiKeyRequest = Joi.object({
  name: Joi.string().min(1).max(256).required(),
  scopes: Joi.array().items(JoiScope).unique().required().min(1)
});

export const JoiApiKey = JoiCreateApiKeyRequest.keys({
  id: Joi.string().required(),
  user: Joi.string().required(),
  secret: Joi.string().required(),
});

export const JoiGetExampleRequest = Joi.object({
  type: Joi.string().valid(Object.keys(SubscriptionType)),
  filters: Joi.object().when(
    'type',
    {
      is: SubscriptionType.transaction,
      then: JoiSubscriptionTransactionFilter,
      otherwise: JoiSubscriptionLogFilter
    }
  ).required()
});
