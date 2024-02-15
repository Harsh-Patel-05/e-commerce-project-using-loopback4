import {Entity, model, property} from '@loopback/repository';
import {DateTime} from 'luxon';

@model({
  settings: {
    strictObjectIDCoercion: true,
  }
})
export class TempResetToken extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectID', }
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  token: string;

  @property({
    type: 'date',
    default: null,
  })
  expiresAt?: DateTime;

  @property({
    type: 'string',
    required: true,
  })
  tempId: string;

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

  constructor(data?: Partial<TempResetToken>) {
    super(data);
  }
}

export interface TempResetTokenRelations {
  // describe navigational properties here
}

export type TempResetTokenWithRelations = TempResetToken & TempResetTokenRelations;
