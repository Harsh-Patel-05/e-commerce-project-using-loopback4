import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, Filter, Options, repository} from '@loopback/repository';
import {MongoDbDataSource} from '../datasources';
import {Customer, CustomerSession, CustomerSessionRelations} from '../models';
import {CustomerRepository} from './customer.repository';
import {HttpErrors} from '@loopback/rest';
import {DateTime} from 'luxon';

export class CustomerSessionRepository extends DefaultCrudRepository<
  CustomerSession,
  typeof CustomerSession.prototype.id,
  CustomerSessionRelations
> {
  public readonly customer: BelongsToAccessor<Customer, typeof Customer.prototype.id>;
  constructor(
    @inject('datasources.mongo_db') dataSource: MongoDbDataSource,
    @repository.getter('CustomerRepository')
    protected customerRepositoryGetter: Getter<CustomerRepository>,
  ) {
    super(CustomerSession, dataSource);

    //for user
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
  }

  async findOne(filter?: Filter<CustomerSession>, options?: Options): Promise<CustomerSession> {
    const result = await super.findOne(filter, options);

    if (result) {
      return result;
    } else {
      throw new HttpErrors.NotFound('Entity Not Found : Session');
    }
  }

  async findSessionByToken(token: string): Promise<CustomerSession | boolean> {
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

  definePersistedModel(entityClass: typeof CustomerSession) {
    const modelClass = super.definePersistedModel(entityClass);
    modelClass.observe('before save', async ctx => {
      if (!ctx.isNewInstance && ctx.data) {
        ctx.data.updatedAt = new Date();
      }
    });
    return modelClass;
  }
}
