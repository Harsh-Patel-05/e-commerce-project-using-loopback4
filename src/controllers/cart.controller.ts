import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {
  del,
  get,
  param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {CartService} from '../services';


export class CartController {
  constructor(
    @service(CartService)
    public cartService: CartService,
  ) { }

  @authenticate('jwt')
  @post('/carts', {
    summary: 'Create carts API Endpoint',
    responses: {
      '200': {},
      '400': {description: 'Cannot find carts'},
    },
  })
  async create(
    @requestBody({
      description: 'Payload for adding a product to the cart',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              productVariantId: {type: 'string'},
              quantity: {type: 'number'},
            },
          },
        },
      },
    })
    payload: {productVariantId: string; quantity: number},
    @inject(AuthenticationBindings.CURRENT_USER) user: UserProfile,
  ) {
    return this.cartService.create(payload, user);
  }

  @authenticate('jwt')
  @get('/carts/count', {
    summary: 'Count carts API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async count() {
    return this.cartService.countCart();
  }

  @authenticate('jwt')
  @get('/carts', {
    summary: 'List of carts API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async find(@inject(AuthenticationBindings.CURRENT_USER) user: UserProfile,) {
    return this.cartService.findAll(user);
  }

  @authenticate('jwt')
  @patch('/carts/{id}', {
    summary: 'Update carts API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async updateById(
    @requestBody({
      description: 'Payload for updating the cart',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              productVariantId: {type: 'string'},
              quantity: {type: 'number'},
            },
          },
        },
      },
    })
    payload: {productVariantId: string; quantity: number},
    @param.path.string('id') id: string,
    @inject(AuthenticationBindings.CURRENT_USER) user: UserProfile
  ) {
    return this.cartService.update(id, payload, user);
  }

  @authenticate('jwt')
  @del('/carts/{id}', {
    summary: 'Delate carts API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async deleteById(
    @param.path.string('id') id: string,
    @inject(AuthenticationBindings.CURRENT_USER) user: UserProfile) {
    return this.cartService.delete(id, user);
  }
}
