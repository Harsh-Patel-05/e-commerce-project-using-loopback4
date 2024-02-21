import {AuthenticationBindings} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {
  post,
  requestBody
} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {PaymentService} from '../services';

export class PaymentController {
  constructor(
    @service(PaymentService)
    public paymentsService: PaymentService
  ) { }

  @post('/payments', {
    summary: 'Create payments API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async create(
    @requestBody({
      description: 'Create payments API Endpoint',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              cashOnDelivery: {type: 'boolean'},
              currency: {type: 'string'},
            },
          },
        },
      },
    })
    payload: {
      cashOnDelivery: boolean;
      currency: string;
    },
    @inject(AuthenticationBindings.CURRENT_USER) user: UserProfile,
  ) {
    return this.paymentsService.create(payload, user);
  }

  @post('/buy-now', {
    summary: 'buy-now API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async buyNow(
    @requestBody({
      description: 'buy-now API Endpoint',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              productVariantId: {type: 'string'},
              quantity: {type: 'number'},
              cashOnDelivery: {type: 'boolean'},
              currency: {type: 'string'},
            },
          },
        },
      },
    })
    payload: {
      productVariantId: string,
      quantity: number,
      cashOnDelivery: boolean,
      currency: string;
    },
    @inject(AuthenticationBindings.CURRENT_USER) user: UserProfile,
  ) {
    return this.paymentsService.buyNow(payload, user);
  }
}
