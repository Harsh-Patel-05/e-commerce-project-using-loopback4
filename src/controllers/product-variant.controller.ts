import {service} from '@loopback/core';
import {
  del,
  get,
  param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {ProductVariantService} from '../services';

export class ProductVariantController {
  constructor(
    @service(ProductVariantService)
    public productVariantService: ProductVariantService,
  ) { }

  // @authenticate('jwt')
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
    }) {
    const result = await this.productVariantService.create(
      payload.productId,
      payload.size,
      payload.color,
      payload.stock,
      payload.price
    );
    if (result.statusCode === 400) {
      throw {
        statusCode: 400,
        message: 'Cannot find product ',
      };
    }
    return result;
  }

  // @authenticate('jwt')
  @get('/product-variants/count', {
    summary: 'Count product-variants API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async count() {
    const data = await this.productVariantService.count();
    if (data === 0) {
      return {
        statusCode: 404,
        message: 'Data not found'
      }
    }
    return {
      statusCode: 200,
      message: 'success',
      data
    }
  }

  // @authenticate('jwt')
  @get('/product-variants', {
    summary: 'List of product-variants API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async find() {
    const data = await this.productVariantService.findAll();
    if (!data || data.length === 0) {
      throw {
        statusCode: 404,
        message: 'Data not found',
      };
    }
    return {
      statusCode: 200,
      message: 'success',
      data,
    };
  }

  // @authenticate('jwt')
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
    const data = await this.productVariantService.findById(id);
    if (!data) {
      throw {
        statusCode: 404,
        message: 'Data not found',
      };
    }
    return {
      statusCode: 200,
      message: 'success',
      data,
    };
  }

  // @authenticate('jwt')
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
    }) {
    const result = await this.productVariantService.updateById(id, payload);
    if (result.statusCode === 404) {
      throw {
        statusCode: 404,
        message: 'Data not found',
      };
    }
    return result;
  }

  // @authenticate('jwt')
  @del('/product-variants/{id}', {
    summary: 'Delete product-variants API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found or data already deleted'},
    },
  })
  async deleteById(@param.path.string('id') id: string) {
    const result = await this.productVariantService.deleteById(id);
    if (result.statusCode === 404) {
      throw {
        statusCode: 404,
        message: 'Data not found or data already deleted',
      };
    }
    return result;
  }
}
