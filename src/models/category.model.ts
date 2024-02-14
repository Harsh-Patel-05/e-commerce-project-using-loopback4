import {Entity, hasOne, model, property} from '@loopback/repository';
import {DateTime} from 'luxon';
import {Product} from './product.model';

@model({
  settings: {
    strictObjectIDCoercion: true,
  }
})
export class Category extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb:{dataType: 'ObjectID',}
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

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

  @hasOne(() => Product)
  product: Product;

  constructor(data?: Partial<Category>) {
    super(data);
  }
}

export interface CategoryRelations {
  // describe navigational properties here
}

export type CategoryWithRelations = Category & CategoryRelations;
