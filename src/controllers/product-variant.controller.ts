import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {
  del,
  get,
  param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {SecurityBindings, UserProfile, securityId} from '@loopback/security';
import {ProductVariantService} from '../services';


export class ProductVariantController {
  constructor(
    @service(ProductVariantService)
    public productVariantService: ProductVariantService,
  ) { }

  @authenticate('jwt')
  @post('/product-variants', {
    summary: 'Create product-variants API Endpoint',
    responses: {
      '200': {},
      '400': {description: 'Cannot find product'},
    },
  })
  async create(
    @requestBody({
      description: 'Create product-variants API Endpoint',
      content: {
        'application/json': {
          schema: {
            required: ['productId', 'size', 'color', 'stock', 'price'],
            properties: {
              productId: {
                type: 'string',
              },
              size: {
                type: 'string',
              },
              color: {
                type: 'string',
              },
              stock: {
                type: 'number',
              },
              price: {
                type: 'number',
              },
            }
          }
        },
      },
    })
    payload: {
      productId: 'string',
      size: 'string',
      color: 'string',
      stock: number,
      price: number,
    },
    @inject(SecurityBindings.USER) user: UserProfile,) {
    return this.productVariantService.create(payload, user[securityId])
  }

  @authenticate('jwt')
  @get('/product-variants/count', {
    summary: 'Count product-variants API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async count() {
    return this.productVariantService.count();
  }

  @authenticate('jwt')
  @get('/product-variants', {
    summary: 'List of product-variants API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async find() {
    return this.productVariantService.findAll();
  }

  @authenticate('jwt')
  @get('/product-variants/{id}', {
    summary: 'Get product-variants by ID API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async findById(
    @param.path.string('id') id: string,
  ) {
    return this.productVariantService.findById(id);
  }

  @authenticate('jwt')
  @patch('/product-variants/{id}', {
    summary: 'Update product-variants API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'Update product-variants API Endpoint',
      content: {
        'application/json': {
          schema: {
            properties: {
              productId: {
                type: 'string',
              },
              size: {
                type: 'string',
              },
              color: {
                type: 'string',
              },
              stock: {
                type: 'number',
              },
              price: {
                type: 'number',
              },
            }
          }
        },
      },
    })
    payload: {
      productId: 'string',
      size: 'string',
      color: 'string',
      stock: number,
      price: number,
    },
    @inject(SecurityBindings.USER) user: UserProfile,
  ) {
    return this.productVariantService.updateById(id, payload, user[securityId]);
  }

  @authenticate('jwt')
  @del('/product-variants/{id}', {
    summary: 'Delete product-variants API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found or data already deleted'},
    },
  })
  async deleteById(
    @param.path.string('id') id: string,
    @inject(SecurityBindings.USER) user: UserProfile) {
    return this.productVariantService.deleteById(id, user[securityId]);
  }
}
