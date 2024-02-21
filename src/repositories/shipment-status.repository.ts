import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDbDataSource} from '../datasources';
import {ShipmentStatus, ShipmentStatusRelations} from '../models';

export class ShipmentStatusRepository extends DefaultCrudRepository<
  ShipmentStatus,
  typeof ShipmentStatus.prototype.id,
  ShipmentStatusRelations
> {
  constructor(
    @inject('datasources.mongo_db') dataSource: MongoDbDataSource,
  ) {
    super(ShipmentStatus, dataSource);
  }
}
