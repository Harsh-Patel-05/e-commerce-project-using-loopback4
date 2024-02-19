import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DateTime} from 'luxon';
import {MongoDbDataSource} from '../datasources';
import {Admin, AdminSession, AdminSessionRelations} from '../models';
import {AdminRepository} from './admin.repository';

export class AdminSessionRepository extends DefaultCrudRepository<
  AdminSession,
  typeof AdminSession.prototype.id,
  AdminSessionRelations
> {
  public readonly admin: BelongsToAccessor<Admin, typeof Admin.prototype.id>;
  constructor(
    @inject('datasources.mongo_db') dataSource: MongoDbDataSource,
    @repository.getter('AdminRepository')
    protected adminRepositoryGetter: Getter<AdminRepository>,
  ) {
    super(AdminSession, dataSource);

    //for user
    this.admin = this.createBelongsToAccessorFor('admin', adminRepositoryGetter);
    this.registerInclusionResolver('admin', this.admin.inclusionResolver);
  }

  // async findOne(filter?: Filter<AdminSession>, options?: Options): Promise<AdminSession> {
  //   const result = await super.findOne(filter, options);

  //   if (result) {
  //     return result;
  //   } else {
  //     throw new HttpErrors.NotFound('Entity Not Found : Session');
  //   }
  // }

  async findSessionByToken(token: string): Promise<AdminSession | boolean> {
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

  definePersistedModel(entityClass: typeof AdminSession) {
    const modelClass = super.definePersistedModel(entityClass);
    modelClass.observe('before save', async ctx => {
      if (!ctx.isNewInstance && ctx.data) {
        ctx.data.updatedAt = new Date();
      }
    });
    return modelClass;
  }
}
