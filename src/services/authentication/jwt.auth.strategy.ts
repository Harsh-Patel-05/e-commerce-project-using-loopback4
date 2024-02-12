import {AuthenticationStrategy, TokenService} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, Request, RestBindings} from '@loopback/rest';
import {UserProfile, securityId} from '@loopback/security';
import {TokenServiceBindings} from '../../keys';
import {AdminRepository, SessionRepository, UserRepository} from '../../repositories';
import {User} from '../../models';
import {Session} from '../../models/session.model';

export type AuthCredentials = {
  user?: User;
  session?: Session;
};
export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public tokenService: TokenService,
    @repository(SessionRepository)
    public sessionRepository: SessionRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(AdminRepository)
    public adminRepository: AdminRepository,
  ) { }

  async authenticate(
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<UserProfile | AuthCredentials | undefined | any> {
    return this.performJWTStrategy(request);
  }

  async performJWTStrategy(request: Request) {
    if (!request.headers.authorization) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }

    // for example : Bearer xxx.yyy.zzz OR Basic {base64String}
    const authHeaderValue = <string>request.headers.authorization;

    if (!authHeaderValue.startsWith('Bearer')) {
      throw new HttpErrors.Unauthorized(
        `Authorization header is not of type 'Bearer'.`,
      );
    }

    //split the string into 2 parts : 'Bearer ' and the `xxx.yyy.zzz`
    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2) {
      throw new HttpErrors.Unauthorized(
        `Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.`,
      );
    }

    try {
      const token = parts[1];

      const userProfile: UserProfile = await this.tokenService.verifyToken(
        token,
      );

      let user;
      const session = <Session>(
        (<unknown>await this.sessionRepository.findSessionByToken(token))
      );

      if (session) {
        user = await this.userRepository.findById(userProfile[securityId]);

        return {
          user,
          session,
        }
      }

      // check if session is locked
      if (!session || !user) {
        throw new HttpErrors.Unauthorized();
      }

      return {
        user,
        session,
      };
    } catch (err: any) {
      throw new HttpErrors.Unauthorized();
    }
  }
}
