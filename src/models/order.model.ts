import {Entity, belongsTo, model, property} from '@loopback/repository';
import {DateTime} from 'luxon';
import {Customer} from './customer.model';
import {Payment} from './payment.model';

@model({
  settings: {
    strictObjectIDCoercion: true,
  },
})
export class Order extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectId'},
  })
  id: string;

  @property({
    type: 'object',
    required: true,
  })
  productIds: any[];

  @property({
    type: 'array',
    itemType: 'object', // Specify the itemType as 'object' for an array of any JSON-like objects
    required: true,
  })
  products: any[];

  @belongsTo(() => Customer, {name: 'customer'}, {
    type: 'string',
    required: false,
    mongodb: {dataType: 'ObjectId'},
  })
  customerId?: string;

  @property({
    type: 'number',
    required: true,
  })
  totalItems: number;

  @property({
    type: 'number',
    required: true,
  })
  totalPrice: number;

  @belongsTo(() => Payment, {name: 'payment'}, {
    type: 'string',
    required: false,
    mongodb: {dataType: 'ObjectId'},
  })
  paymentId?: string;

  @property({
    type: 'string',
    required: true,
  })
  paymentMethod: string;

  @property({
    type: 'string',
    required: true,
  })
  paymentStatus: string;

  @property({
    type: 'date',
    default: () => DateTime.utc().toJSDate(),
  })
  orderDate: DateTime;

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

  // @hasOne(() => ShipmentStatus)
  // shipmentStatus: ShipmentStatus;

  // @hasOne(() => OrderHistory)
  // orderHistory: OrderHistory;

  constructor(data?: Partial<Order>) {
    super(data);
  }
}

export interface OrderRelations {
  // describe navigational properties here
}

export type OrderWithRelations = Order & OrderRelations;
