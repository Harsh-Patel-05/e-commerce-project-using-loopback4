import {Entity, belongsTo, model, property} from '@loopback/repository';
import {Admin} from './admin.model';
import {DateTime} from 'luxon';
import {Loopback4BoilerplatePublicConstants} from '../keys';

@model({
  settings: {
    strictObjectIDCoercion: true,
  },
})
export class Session extends Entity {
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
    required: true,
    jsonSchema: {
      pattern: '^(?! ).*[^ ]$',
      errorMessage: {
        pattern: `Invalid input.`,
      },
    },
  })
  accessToken: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(Loopback4BoilerplatePublicConstants.SessionStatus),
      pattern: '^(?! ).*[^ ]$',
      errorMessage: {
        pattern: `Invalid input.`,
      },
    },
    default: Loopback4BoilerplatePublicConstants.SessionStatus.CURRENT,
  })
  status: string;

  @property({
    type: 'date',
    required: true,
  })
  loginAt: DateTime;

  @property({
    type: 'date',
    required: true,
  })
  expireAt: Date;

  @property({
    type: 'date',
    default: null,
  })
  expiredAt: Date;

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


  constructor(data?: Partial<Session>) {
    super(data);
  }
}

export interface SessionRelations {
  // describe navigational properties here
}

export type SessionWithRelations = Session & SessionRelations;
