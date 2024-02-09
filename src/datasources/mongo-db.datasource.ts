import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
  name: 'mongo_db',
  connector: 'mongodb',
  url: process.env.DB_URL,
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MongoDbDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'mongo_db';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongo_db', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
