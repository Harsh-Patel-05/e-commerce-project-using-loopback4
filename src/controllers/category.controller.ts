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
import {CategoryService} from '../services';

export class CategoryController {
  constructor(
    @service(CategoryService)
    public categoryService: CategoryService,
  ) { }

  @authenticate('jwt')
  @post('/categories', {
    summary: 'Create categories API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async createCategory(
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
    payload: {name: string},
    @inject(SecurityBindings.USER) user: UserProfile,
  ) {
    return this.categoryService.createCategory(payload.name, user[securityId]);
  }

  @authenticate('jwt')
  @get('/categories/count', {
    summary: 'Count categories API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'No categories found'},
    },
  })
  async count() {
    return this.categoryService.countCategory();
  }

  @authenticate('jwt')
  @get('/categories', {
    summary: 'List of categories API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'No categories found'},
    },
  })
  async find() {
    return this.categoryService.findCategory();
  }

  @authenticate('jwt')
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
    return this.categoryService.findCategoryById(id);
  }

  @authenticate('jwt')
  @patch('/categories/{id}', {
    summary: 'Update categories by ID API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'categories not found'},
    },
  })
  async updateCategoryById(
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
    payload: {name: string},
    @inject(SecurityBindings.USER) user: UserProfile,
  ) {
    return this.categoryService.updateCategoryById(id, payload, user[securityId]);
  }

  @authenticate('jwt')
  @del('/categories/{id}', {
    summary: 'Delete categories by ID API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'categories not found'},
    },
  })
  async deleteCategoryById(
    @param.path.string('id') id: string,
    @inject(SecurityBindings.USER) user: UserProfile,
  ) {
    return this.categoryService.deleteCategoryById(id, user[securityId]);
  }
}
