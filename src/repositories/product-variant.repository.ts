import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDbDataSource} from '../datasources';
import {ProductVariant, ProductVariantRelations} from '../models';

export class ProductVariantRepository extends DefaultCrudRepository<
  ProductVariant,
  typeof ProductVariant.prototype.id,
  ProductVariantRelations
> {
  constructor(
    @inject('datasources.mongo_db') dataSource: MongoDbDataSource,
  ) {
    super(ProductVariant, dataSource);
  }
}
