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
import {ProductService} from '../services';

export class ProductController {
  constructor(
    @service(ProductService)
    public productService: ProductService,
  ) { }

  @authenticate('jwt')
  @post('/products', {
    summary: 'Create product API Endpoint',
    responses: {
      '200': {},
      '400': {description: 'Cannot find category'},
    },
  })
  async create(
    @requestBody({
      description: 'Create products API Endpoint',
      content: {
        'application/json': {
          schema: {
            required: ['categoryId', 'name', 'description'],
            properties: {
              categoryId: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
            }
          }
        },
      },
    })
    payload: {
      categoryId: string,
      name: string,
      description: string,
    },
    @inject(SecurityBindings.USER) user: UserProfile,
  ) {
    return this.productService.create(payload, user[securityId]);
  }

  @authenticate('jwt')
  @get('/products/count', {
    summary: 'Count products API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async count() {
    return this.productService.countProduct();
  }

  @authenticate('jwt')
  @get('/products', {
    summary: 'List of products API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async find() {
    return this.productService.findAll();
  }

  @authenticate('jwt')
  @get('/products/{id}', {
    summary: 'Get products by ID API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async findById(
    @param.path.string('id') id: string,
  ) {
    return this.productService.findById(id);
  }

  @authenticate('jwt')
  @patch('/products/{id}', {
    summary: 'Update products API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'Update products API Endpoint',
      content: {
        'application/json': {
          schema: {
            properties: {
              categoryId: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
            }
          }
        },
      },
    })
    payload: {categoryId: string, name: string, description: string},
    @inject(SecurityBindings.USER) user: UserProfile,
  ) {
    return this.productService.updateById(id, payload, user[securityId]);
  }

  @authenticate('jwt')
  @del('/products/{id}', {
    summary: 'Delete products API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found or data already deleted'},
    },
  })
  async deleteById(@param.path.string('id') id: string,
    @inject(SecurityBindings.USER) user: UserProfile,
  ) {
    return this.productService.deleteById(id, user[securityId]);
  }
}
