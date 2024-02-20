import {Entity, belongsTo, model, property} from '@loopback/repository';
import {DateTime} from 'luxon';
import {Customer} from './customer.model';
import {ProductVariant} from './product-variant.model';
import {Product} from './product.model';

@model({
  settings: {
    strictObjectIDCoercion: true,
  },
})
export class Cart extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectId'},
  })
  id: string;

  @belongsTo(() => Customer, {name: 'customer'}, {
    type: 'string',
    required: false,
    mongodb: {dataType: 'ObjectId'},
  })
  customerId?: string;

  @belongsTo(() => Product, {name: 'product'}, {
    type: 'string',
    required: false,
    mongodb: {dataType: 'ObjectId'},
  })
  productId?: string;

  @belongsTo(() => ProductVariant, {name: 'productVariant'}, {
    type: 'string',
    required: false,
    mongodb: {dataType: 'ObjectId'},
  })
  productVariantId?: string;

  @property({
    type: 'json',
    required: true,
  })
  productIds: any[];

  @property({
    type: 'array',
    itemType: 'object', // Specify the itemType as 'object' for an array of any JSON-like objects
    required: true,
  })
  products: any[];

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

  @property({
    type: 'boolean',
    default: false,
  })
  isReminded: boolean;

  @property({
    type: 'date',
    default: () => DateTime.utc().toJSDate(),
  })
  reminderDate?: DateTime;

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

  constructor(data?: Partial<Cart>) {
    super(data);
  }
}

export interface CartRelations {
  // describe navigational properties here
}

export type CartWithRelations = Cart & CartRelations;
