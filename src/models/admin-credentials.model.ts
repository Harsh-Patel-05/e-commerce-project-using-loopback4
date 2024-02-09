import {Entity, Model, belongsTo, model, property} from '@loopback/repository';
import {DateTime} from 'luxon';
import {Admin} from './admin.model';

@model({forceId: false})
export class Security extends Model {
  @property({
    type: 'number',
    default: null,
  })
  otp?: number | null;

  @property({
    type: 'string',
    default: null,
  })
  otpRef?: string | null;

  @property({
    type: 'date',
    default: null,
  })
  generatedAt?: DateTime | null;

  @property({
    type: 'date',
    default: null,
  })
  expiredAt?: DateTime;

  constructor(data?: Partial<Security>) {
    super(data);
  }
}

@model({
  settings: {
    strictObjectIDCoercion: true,
  },
})
export class AdminCredentials extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectId'},
  })
  id: string;

  @belongsTo(
    () => Admin,
    {
      //relation metadata
      name: 'admin',
    },
    {
      // property definition
      type: 'string',
      required: true,
      mongodb: {dataType: 'ObjectId'},
    },
  )
  adminId: string;

  @property({
    type: 'string',
    default: null,
    jsonSchema: {
      minLength: 8,
      nullable: true,
    },
  })
  password?: string | null;

  @property({
    type: Security,
    default: {},
  })
  security?: Security;

  @property({
    type: 'date',
    default: () => DateTime.utc().toJSDate(),
  })
  createdAt?: DateTime;

  @property({
    type: 'date',
    default: () => DateTime.utc().toJSDate(),
  })
  updatedAt?: DateTime;


  constructor(data?: Partial<AdminCredentials>) {
    super(data);
  }
}

export interface AdminCredentialsRelations {
  // describe navigational properties here
}

export type AdminCredentialsWithRelations = AdminCredentials & AdminCredentialsRelations;
