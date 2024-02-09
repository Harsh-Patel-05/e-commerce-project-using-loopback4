import {TokenService} from '@loopback/authentication';
import {BindingKey} from '@loopback/core';

export namespace TokenServiceConstants {
  export const TOKEN_SECRET_VALUE = 'myjwts3cr3t';
  export const TOKEN_EXPIRES_IN_VALUE = '21600';
}

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.secret',
  );
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.expires.in.seconds',
  );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

export namespace Loopback4BoilerplatePublicConstants {
  export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
  }

  export enum SessionStatus {
    CURRENT = 'current',
    EXPIRED = 'expired',
  }
}
