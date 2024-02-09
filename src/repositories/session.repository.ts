import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  Filter,
  Options,
  repository,
} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {DateTime} from 'luxon';
import {MongoDbDataSource} from '../datasources';
import {Session, SessionRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class SessionRepository extends DefaultCrudRepository<
  Session,
  typeof Session.prototype.id,
  SessionRelations
> {
  public readonly user: BelongsToAccessor<User, typeof User.prototype.id>;
  constructor(
    @inject('datasources.mongo_db') dataSource: MongoDbDataSource,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Session, dataSource);

    //for user
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  async findOne(filter?: Filter<Session>, options?: Options): Promise<Session> {
    const result = await super.findOne(filter, options);

    if (result) {
      return result;
    } else {
      throw new HttpErrors.NotFound('Entity Not Found : Session');
    }
  }

  async findSessionByToken(token: string): Promise<Session | boolean> {
    const session = await this.findOne({
      where: {
        or: [
          {
            accessToken: token,
            status: 'current',
            expireAt: {gte: new Date(Date.now())},
          },
        ],
      },
    });
    if (!session) {
      return false;
    }

    if (
      DateTime.fromJSDate(session?.expireAt).valueOf() <
      DateTime.utc().valueOf()
    ) {
      // change session status to expire
      await this.updateById(session.id, {
        status: 'expired',
      });

      return false;
    }

    return session;
  }

  definePersistedModel(entityClass: typeof Session) {
    const modelClass = super.definePersistedModel(entityClass);
    modelClass.observe('before save', async ctx => {
      if (!ctx.isNewInstance && ctx.data) {
        ctx.data.updatedAt = new Date();
      }
    });
    return modelClass;
  }
}
