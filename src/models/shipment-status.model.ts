import {Entity, belongsTo, model, property} from '@loopback/repository';
import {Address} from './address.model';
import {Order} from './order.model';
import {DateTime} from 'luxon';

@model({
  settings: {
    strictObjectIDCoercion: true,
  },
})
export class ShipmentStatus extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectId'},
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  status: string;

  @belongsTo(() => Address, {name: 'address'}, {
    type: 'string',
    required: false,
    mongodb: {dataType: 'ObjectId'},
  })
  addressId?: string;

  @belongsTo(() => Order, {name: 'order'}, {
    type: 'string',
    required: false,
    mongodb: {dataType: 'ObjectId'},
  })
  orderId?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isDeleted?: boolean;

  @property({
    type: 'date',
    default: () => DateTime.utc().toJSDate(),
  })
  createdAt?: DateTime;

  @property({
    type: 'date',
    default: () => DateTime.utc().toJSDate(),
  })
  updatedAt?: DateTime;

  constructor(data?: Partial<ShipmentStatus>) {
    super(data);
  }
}

export interface ShipmentStatusRelations {
  // describe navigational properties here
}

export type ShipmentStatusWithRelations = ShipmentStatus & ShipmentStatusRelations;
