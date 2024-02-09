import {inject} from '@loopback/core';
import {DefaultCrudRepository, Filter, Options} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {MongoDbDataSource} from '../datasources';
import {UserCredentials, UserCredentialsRelations} from '../models';

export class UserCredentialsRepository extends DefaultCrudRepository<
  UserCredentials,
  typeof UserCredentials.prototype.id,
  UserCredentialsRelations
> {
  constructor(@inject('datasources.mongo_db') dataSource: MongoDbDataSource) {
    super(UserCredentials, dataSource);
  }

  async findOne(
    filter?: Filter<UserCredentials>,
    options?: Options,
  ): Promise<UserCredentials> {
    const result = await super.findOne(filter, options);
    if (result) {
      return result;
    } else {
      throw new HttpErrors.NotFound('UserCredentials not found.');
    }
  }

  definePersistedModel(entityClass: typeof UserCredentials) {
    const modelClass = super.definePersistedModel(entityClass);
    modelClass.observe('before save', async ctx => {
      if (!ctx.isNewInstance && ctx.data) {
        ctx.data.updatedAt = new Date();
      }
    });
    return modelClass;
  }
}
