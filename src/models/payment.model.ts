import {Entity, belongsTo, hasOne, model, property} from '@loopback/repository';
import {DateTime} from 'luxon';
import {Customer} from './customer.model';
import {Order} from './order.model';

@model({
  settings: {
    strictObjectIDCoercion: true,
  },
})
export class Payment extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectId'},
  })
  id: string;

  @property({
    type: 'boolean',
    required: true,
  })
  COD: boolean;

  @property({
    type: 'string',
    required: false,
  })
  pymentCred?: string;

  @belongsTo(() => Customer, {name: 'customer'}, {
    type: 'string',
    required: false,
    mongodb: {dataType: 'ObjectId'},
  })
  customerId?: string;

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

  @hasOne(() => Order)
  order: Order;

  constructor(data?: Partial<Payment>) {
    super(data);
  }
}

export interface PaymentRelations {
  // describe navigational properties here
}

export type PaymentWithRelations = Payment & PaymentRelations;
