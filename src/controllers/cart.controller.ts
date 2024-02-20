import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {
  Request,
  RestBindings,
  del,
  get,
  param,
  patch,
  post,
  requestBody,
  response
} from '@loopback/rest';
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
            required: ['productVariantId', 'quantity'],
            properties: {
              productVariantId: {type: 'string'},
              quantity: {type: 'number'},
            },
          },
        },
      },
    })
    payload: {productVariantId: string; quantity: number},
    @inject(RestBindings.Http.REQUEST) req: Request,
  ) {
    return this.cartService.create(payload, req);
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
  async find(@inject(RestBindings.Http.REQUEST) req: Request) {
    return this.cartService.findAll(req);
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
    @inject(RestBindings.Http.REQUEST) req: Request,
  ) {
    await this.cartService.update(id, payload, req);
  }

  @del('/carts/{id}')
  @response(204, {
    description: 'Cart DELETE success',
  })
  async deleteById(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.REQUEST) req: Request,) {
    await this.cartService.delete(id, req);
  }
}
