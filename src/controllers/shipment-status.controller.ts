import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {
  del,
  get,
  param
} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {ShipmentStatusService} from '../services';

export class ShipmentStatusController {
  constructor(
    @service(ShipmentStatusService)
    public shipmentStatusService: ShipmentStatusService,
  ) { }

  @authenticate('jwt')
  @get('/shipment-statuses', {
    summary: 'List of shipment-statuses API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async find(@inject(AuthenticationBindings.CURRENT_USER) user: UserProfile,) {
    return this.shipmentStatusService.findAll(user);
  }

  @authenticate('jwt')
  @get('/shipment-statuses/{id}', {
    summary: 'Get shipment-statuses by ID API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async findById(
    @param.path.string('id') id: string,
  ) {
    return this.shipmentStatusService.findById(id);
  }

  @authenticate('jwt')
  @del('/shipment-statuses/{id}', {
    summary: 'Delete shipment-statuses by ID API Endpoint',
    responses: {
      '200': {},
      '404': {description: 'Data not found'},
    },
  })
  async deleteById(@param.path.string('id') id: string, @inject(AuthenticationBindings.CURRENT_USER) user: UserProfile) {
    await this.shipmentStatusService.deleteById(id, user);
  }
}
