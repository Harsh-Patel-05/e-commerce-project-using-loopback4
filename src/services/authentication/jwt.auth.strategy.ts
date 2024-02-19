import {AuthenticationStrategy, TokenService} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, Request, RestBindings} from '@loopback/rest';
import {UserProfile, securityId} from '@loopback/security';
import {TokenServiceBindings} from '../../keys';
import {Session} from '../../models/session.model';
import {User} from '../../models/user.model';
import {AdminRepository, AdminSessionRepository, CustomerRepository, CustomerSessionRepository, SessionRepository, UserRepository} from '../../repositories';

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
    @repository(AdminSessionRepository)
    public adminSessionRepository: AdminSessionRepository,
    @repository(CustomerRepository)
    public customerRepository: CustomerRepository,
    @repository(CustomerSessionRepository)
    public customerSessionRepository: CustomerSessionRepository,
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
      let session;

      const checkAdmin = await this.adminRepository.findOne({
        where: {
          email: userProfile.email
        }
      });
      if (checkAdmin) {
        session = await this.adminSessionRepository.findOne({
          where: {
            id: userProfile[securityId],
            expiredAt: {gt: new Date(Date.now())}
          }
        });
        user = await this.adminRepository.findOne({
          where: {
            id: session.adminId
          }
        });
      } else {
        session = await this.customerSessionRepository.findOne({
          where: {
            id: userProfile[securityId],
            expiredAt: {gt: new Date(Date.now())}
          }
        });
        user = await this.customerRepository.findOne({
          where: {
            id: session.customerId
          }
        });
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
// async performJWTStrategy(request: Request) {
//     if (!request.headers.authorization) {
//       throw new HttpErrors.Unauthorized(`Authorization header not found.`);
//     }

//     // for example : Bearer xxx.yyy.zzz OR Basic {base64String}
//     const authHeaderValue = <string>request.headers.authorization;

//     if (!authHeaderValue.startsWith('Bearer')) {
//       throw new HttpErrors.Unauthorized(
//         `Authorization header is not of type 'Bearer'.`,
//       );
//     }

//     //split the string into 2 parts : 'Bearer ' and the `xxx.yyy.zzz`
//     const parts = authHeaderValue.split(' ');
//     if (parts.length !== 2) {
//       throw new HttpErrors.Unauthorized(
//         `Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.`,
//       );
//     }

//     try {
//       const token = parts[1];

//       const userProfile: UserProfile = await this.tokenService.verifyToken(
//         token,
//       );
//       console.log('step 1:', userProfile)
//       // let user;
//       let admin;
//       // const session = <Session>(
//       //   (<unknown>await this.sessionRepository.findSessionByToken(token))
//       // );

//       const adminsession = <AdminSession>(
//         (<unknown>await this.adminSessionRepository.findSessionByToken(token)));
//       console.log('step 2:', adminsession)

//       if (adminsession) {
//         admin = await this.adminRepository.findById(userProfile[securityId]);
//         console.log('step 3', admin)
//         return {
//           admin,
//           adminsession
//         }
//       }

//       if (!adminsession || !admin) {
//         throw new HttpErrors.Unauthorized();
//       }

//       return {
//         admin,
//         adminsession,
//       };
//     } catch (err: any) {
//       throw new HttpErrors.Unauthorized();
//     }
//     // if (adminsession) {
//     //   admin = await this.userRepository.findById(userProfile[securityId]);

//     //   return {
//     //     user,
//     //     session,
//     //   }
//     // }

//     //   // check if session is locked
//     //   if (!session || !user) {
//     //     throw new HttpErrors.Unauthorized();
//     //   }

//     //   return {
//     //     user,
//     //     session,
//     //   };
//     // } catch (err: any) {
//     //   throw new HttpErrors.Unauthorized();
//     // }
