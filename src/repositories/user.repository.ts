import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  Filter,
  HasOneRepositoryFactory,
  Options,
  repository,
} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {MongoDbDataSource} from '../datasources';
import {User, UserCredentials, UserRelations} from '../models';
import {UserCredentialsRepository} from './user-credentials.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  public readonly userCredentials: HasOneRepositoryFactory<
    UserCredentials,
    typeof User.prototype.id
  >;
  constructor(
    @inject('datasources.mongo_db') dataSource: MongoDbDataSource,
    @repository.getter('UserCredentialsRepository')
    protected userCredentialsRepositoryGetter: Getter<UserCredentialsRepository>,
  ) {
    super(User, dataSource);
    this.userCredentials = this.createHasOneRepositoryFactoryFor(
      'userCredentials',
      userCredentialsRepositoryGetter,
    );
    this.registerInclusionResolver(
      'userCredentials',
      this.userCredentials.inclusionResolver,
    );
  }

  async findCredentials(
    userId: typeof User.prototype.id,
  ): Promise<UserCredentials | undefined> {
    try {
      return await this.userCredentials(userId).get();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }

  async findOne(filter?: Filter<User>, options?: Options): Promise<User> {
    const result = await super.findOne(filter, options);
    if (result) {
      return result;
    } else {
      throw new HttpErrors.NotFound('User not found.');
    }
  }

  definePersistedModel(entityClass: typeof User) {
    const modelClass = super.definePersistedModel(entityClass);
    modelClass.observe('before save', async ctx => {
      if (!ctx.isNewInstance && ctx.data) {
        ctx.data.updatedAt = new Date();
      }
    });
    return modelClass;
  }
}
