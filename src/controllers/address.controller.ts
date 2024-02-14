import {service} from '@loopback/core';
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
import {AddressRepository} from '../repositories';
import {AddressService} from '../services';


export class AddressController {
  constructor(
    @repository(AddressRepository)
    public addressRepository: AddressRepository,
    @service(AddressService)
    public addressService: AddressService,
  ) { }

  // @authenticate('jwt')
  @post('/address', {
    summary: 'Create address API Endpoint',
    responses: {
      '200': {},
    },
  })
  async create(
    @requestBody({
      description: 'Create address API Endpoint',
      content: {
        'application/json': {
          schema: {
            required: ['street', 'city', 'state', 'phone', 'pincode'],
            properties: {
              street: {
                type: 'string',
              },
              city: {
                type: 'string',
              },
              state: {
                type: 'string',
              },
              phone: {
                type: 'number',
              },
              pincode: {
                type: 'string',
              }
            }
          }
        },
      },
    })
    payload: {
      street: 'string',
      city: 'string',
      state: 'string',
      phone: number,
      pincode: number
    }) {
    const data = await this.addressService.createAddress(
      payload.street,
      payload.city,
      payload.state,
      payload.phone,
      payload.pincode
    );

    return {
      statusCode: 200,
      message: 'created successfully',
      data,
    };
  }

  // @authenticate('jwt')
  @get('/addresses/count', {
    summary: 'Count addresses API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'No addresses found'},
    },
  })
  async count() {
    const data = await this.addressService.countAddress();

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
  @get('/addresses', {
    summary: 'List of address API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'No address found'},
    },
  })
  async find() {
    const data = await this.addressService.findAll();
    if (!data || data.length === 0) {
      throw {
        statusCode: 404,
        message: 'No address found',
      };
    }
    return {
      statusCode: 200,
      message: 'success',
      data,
    };
  }

  // @authenticate('jwt')
  @get('/addresses/{id}', {
    summary: 'Get address by ID API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Address not found'},
    },
  })
  async findById(
    @param.path.string('id') id: string,
  ) {
    const data = await this.addressService.findAddressById(id);
    if (!data) {
      throw {
        statusCode: 404,
        message: 'Address not found',
      };
    }
    return {
      statusCode: 200,
      message: 'success',
      data,
    };
  }

  // @authenticate('jwt')
  @patch('/addresses/{id}', {
    summary: 'Update address API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Address not found'},
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'Create address API Endpoint',
      content: {
        'application/json': {
          schema: {
            properties: {
              street: {
                type: 'string',
              },
              city: {
                type: 'string',
              },
              state: {
                type: 'string',
              },
              phone: {
                type: 'number',
              },
              pincode: {
                type: 'string',
              }
            }
          }
        },
      },
    })
    payload: {
      street: 'string',
      city: 'string',
      state: 'string',
      phone: number,
      pincode: number
    }) {
    const result = await this.addressService.updateAddressById(id, payload);
    if (result.statusCode === 404) {
      throw {
        statusCode: 404,
        message: 'Address not found',
      };
    }
    return result;
  }

  // @authenticate('jwt')
  @del('/addresses/{id}', {
    summary: 'Delete address API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Address not found or data already deleted'},
    },
  })
  async deleteById(@param.path.string('id') id: string) {
    const result = await this.addressService.deleteAddressById(id);
    if (result.statusCode === 404) {
      throw {
        statusCode: 404,
        message: 'Address not found or data already deleted',
      };
    }
    return result;
  }
}
