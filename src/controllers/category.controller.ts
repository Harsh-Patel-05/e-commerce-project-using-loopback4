import {
  repository
} from '@loopback/repository';
import {
  del,
  get,
  param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {CategoryService} from '../services';
import {service} from '@loopback/core';

export class CategoryController {
  constructor(
    @service(CategoryService)
    public categoryService: CategoryService,
  ) { }

  // @authenticate('jwt')
  @post('/categories', {
    summary: 'Create categories API Endpoint',
    responses: {
      '200': {},
    },
  })
  async create(
    @requestBody({
      description: 'Create categories API Endpoint',
      content: {
        'application/json': {
          schema: {
            required: ['name'],
            properties: {
              name: {
                type: 'string',
              },
            }
          }
        },
      },
    })
    payload: {
      name: 'string',
    }) {
    const data = await this.categoryService.createCategory(
      payload.name,
    );
    return {
      statusCode: 200,
      message: 'created successfully',
      data,
    };
  }

  // @authenticate('jwt')
  @get('/categories/count', {
    summary: 'Count categories API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'No categories found'},
    },
  })
  async count() {
    const data = await this.categoryService.countCategory();
    if (data === 0) {
      return {
        statusCode: 404,
        message: 'No address found'
      }
    }
    return {
      statusCode: 200,
      message: 'success',
      data
    }
  }

  // @authenticate('jwt')
  @get('/categories', {
    summary: 'List of categories API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'No categories found'},
    },
  })
  async find() {
    const data = await this.categoryService.findCategory();
    if (!data || data.length === 0) {
      throw {
        statusCode: 404,
        message: 'No categories found',
      };
    }
    return {
      statusCode: 200,
      message: 'success',
      data,
    };
  }

  // @authenticate('jwt')
  @get('/categories/{id}', {
    summary: 'Get categories by ID API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'categories not found'},
    },
  })
  async findById(
    @param.path.string('id') id: string,
  ) {
    const data = await this.categoryService.findCategoryById(id);
    if (!data) {
      throw {
        statusCode: 404,
        message: 'categories not found',
      };
    }
    return {
      statusCode: 200,
      message: 'success',
      data,
    };
  }

  // @authenticate('jwt')
  @patch('/categories/{id}', {
    summary: 'Update categories API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'categories not found'},
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'Update categories API Endpoint',
      content: {
        'application/json': {
          schema: {
            properties: {
              name: {
                type: 'string',
              },
            }
          }
        },
      },
    })
    payload: {
      name: 'string',
    }) {
    const result = await this.categoryService.updateCategoryById(id, payload);
    if (result.statusCode === 404) {
      throw {
        statusCode: 404,
        message: 'categories not found',
      };
    }
    return result;
  }

  // @authenticate('jwt')
  @del('/categories/{id}', {
    summary: 'Delete categories API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'categories not found or data already deleted'},
    },
  })
  async deleteById(@param.path.string('id') id: string) {
    const result = await this.categoryService.deleteCategoryById(id);
    if (result.statusCode === 404) {
      throw {
        statusCode: 404,
        message: 'categories not found or data already deleted',
      };
    }
    return result;
  }
}
