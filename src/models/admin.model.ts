import {Entity, hasOne, model, property} from '@loopback/repository';
import {DateTime} from 'luxon';
import {AdminCredentials} from './admin-credentials.model';

@model({
  settings: {
    strictObjectIDCoercion: true,
  },
})
export class Admin extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectId'},
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      format: 'email',
      transform: ['trim'],
      maxLength: 254,
      minLength: 5,
      pattern: '^(?! ).*[^ ]$',
      errorMessage: {
        pattern: `Invalid input.`,
      },
    },
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'date',
    default: null,
    jsonSchema: {
      nullable: true,
    },
  })
  lastLoginAt?: DateTime | null;

  @property({
    type: 'boolean',
    default: false,
  })
  isDeleted?: boolean;

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

  @hasOne(() => AdminCredentials)
  adminCredentials: AdminCredentials;

  constructor(data?: Partial<Admin>) {
    super(data);
  }
}

export interface AdminRelations {
  // describe navigational properties here
}

export type AdminWithRelations = Admin & AdminRelations;
