import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDbDataSource} from '../datasources';
import {CustomerCredentials, CustomerCredentialsRelations} from '../models/customer-credentials.model';

export class CustomerCredentialsRepository extends DefaultCrudRepository<
  CustomerCredentials,
  typeof CustomerCredentials.prototype.id,
  CustomerCredentialsRelations
> {
  constructor(
    @inject('datasources.mongo_db') dataSource: MongoDbDataSource,
  ) {
    super(CustomerCredentials, dataSource);
  }
}
