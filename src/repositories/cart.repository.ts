import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDbDataSource} from '../datasources';
import {Cart, CartRelations} from '../models';

export class CartRepository extends DefaultCrudRepository<
  Cart,
  typeof Cart.prototype.id,
  CartRelations
> {
  constructor(
    @inject('datasources.mongo_db') dataSource: MongoDbDataSource,
  ) {
    super(Cart, dataSource);
  }
}
