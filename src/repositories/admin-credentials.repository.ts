import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDbDataSource} from '../datasources';
import {AdminCredentials, AdminCredentialsRelations} from '../models';

export class AdminCredentialsRepository extends DefaultCrudRepository<
  AdminCredentials,
  typeof AdminCredentials.prototype.id,
  AdminCredentialsRelations
> {
  constructor(
    @inject('datasources.mongo_db') dataSource: MongoDbDataSource,
  ) {
    super(AdminCredentials, dataSource);
  }
}
