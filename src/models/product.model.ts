import {Entity, belongsTo, hasOne, model, property} from '@loopback/repository';
import {DateTime} from 'luxon';
import {Category} from './category.model';
import {ProductVariant} from './product-variant.model';

@model({
  settings: {
    strictObjectIDCoercion: true,
  }
})
export class Product extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectID', }
  })
  id?: string;

  @belongsTo(
    () => Category,
    {
      //relation metadata
      name: 'category',
    },
    {
      // property definition
      type: 'string',
      required: true,
      mongodb: {dataType: 'ObjectId'},
    },
  )
  categoryId: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  description: string;

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

  @hasOne(() => ProductVariant)
  productVariant: ProductVariant;

  // @hasOne(() => Cart)
  // cart: Cart;

  constructor(data?: Partial<Product>) {
    super(data);
  }
}

export interface ProductRelations {
  // describe navigational properties here
}

export type ProductWithRelations = Product & ProductRelations;
