import {Entity, belongsTo, hasOne, model, property} from '@loopback/repository';
import {Product} from './product.model';
import {DateTime} from 'luxon';
import {Cart} from './cart.model';

@model({
  settings: {
    strictObjectIDCoercion: true,
  }
})
export class ProductVariant extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectID', }
  })
  id?: string;

  @belongsTo(
    () => Product,
    {
      //relation metadata
      name: 'product',
    },
    {
      // property definition
      type: 'string',
      required: true,
      mongodb: {dataType: 'ObjectId'},
    },
  )
  productId: string;

  @property({
    type: 'string',
    required: true,
  })
  size: string;

  @property({
    type: 'string',
    required: true,
  })
  color: string;

  @property({
    type: 'number',
    required: true,
  })
  stock: number;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

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

  @hasOne(() => Cart)
  cart: Cart;

  // @hasOne(() => CustomerReviews)
  // customerReviews: CustomerReviews;

  constructor(data?: Partial<ProductVariant>) {
    super(data);
  }
}

export interface ProductVariantRelations {
  // describe navigational properties here
}

export type ProductVariantWithRelations = ProductVariant & ProductVariantRelations;
