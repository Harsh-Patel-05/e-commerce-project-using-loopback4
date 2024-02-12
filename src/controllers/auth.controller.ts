import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, Request, RestBindings, get, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings} from '@loopback/security';
import {genSalt, hash} from 'bcryptjs';
import {DateTime} from 'luxon';
import {Session, User} from '../models';
import {
  AdminRepository,
  // ForgotpasswordRepository,
  SessionRepository,
  UserCredentialsRepository,
  UserRepository,
} from '../repositories';
import {UserService} from '../services';
import {AuthCredentials} from '../services/authentication/jwt.auth.strategy';

export class AuthController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserCredentialsRepository)
    public userCredentialsRepository: UserCredentialsRepository,
    @repository(SessionRepository)
    public sessionRepository: SessionRepository,
    @service(UserService)
    public userService: UserService,
    @inject(RestBindings.Http.REQUEST) private request: Request,
    @repository(AdminRepository)
    public adminRepository: AdminRepository,
  ) { }

  //Sign up API Endpoint
  @post('/auth/sign-up', {
    summary: 'Sign up API Endpoint',
    responses: {
      '200': {},
    },
  })
  async signup(
    @requestBody({
      description: 'Sign up API Endpoint',
      content: {
        'application/json': {
          schema: {
            required: ['name', 'email', 'password','role'],
            properties: {
              name: {
                type: 'string',
              },
              email: {
                type: 'string',
                format: 'email',
                maxLength: 254,
                minLength: 5,
              },
              password: {
                type: 'string',
                minLength: 8,
                pattern: '^(?! ).*[^ ]$',
                errorMessage: {
                  pattern: `Invalid input.`,
                },
              },
              role: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    payload: {
      name: string,
      email: string;
      password: string;
      role?: string;
    },
  ) {
    const {name, email, password} = payload;
    const user = await this.userRepository.create({
      name,
      email,
      password,
    });
    const hashedPassword = await hash(password, await genSalt());
    await this.userCredentialsRepository.create({
      userId: user.id,
      password: hashedPassword,
    });
    return user;
  }

  //Login API Endpoint
  @post('/auth/login', {
    summary: 'Login API Endpoint',
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                otp: {
                  type: 'number',
                },
                otpReference: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody({
      description: 'Login API Endpoint',
      content: {
        'application/json': {
          schema: {
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                maxLength: 254,
                minLength: 5,
                pattern: '^(?! ).*[^ ]$',
                errorMessage: {
                  pattern: `Invalid input.`,
                },
              },
              password: {
                type: 'string',
                minLength: 8,
                pattern: '^(?! ).*[^ ]$',
                errorMessage: {
                  pattern: `Invalid input.`,
                },
              },
            },
          },
        },
      },
    })
    payload: {
      email: string;
      password: string;
    },
  ) {
    const user = await this.userService.verifyCredentials(payload);
    const otpReference = await this.userService.sendOtp(user.email, user.id);
    return {
      otpReference,
    };
  }

  //Verify OTP API Endpoint
  @post('/auth/verifyOtp', {
    summary: 'Verify Otp API Endpoint',
    responses: {
      '200': {},
    },
  })
  async verifyOtp(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            required: ['otp', 'otpReference'],
            properties: {
              otp: {
                type: 'number',
                minLength: 6,
                pattern: '^(?! ).*[^ ]$',
                errorMessage: {
                  pattern: `Invalid input.`,
                },
              },
              otpReference: {
                type: 'string',
                minLength: 6,
                pattern: '^(?! ).*[^ ]$',
                errorMessage: {
                  pattern: `Invalid input.`,
                },
              },
            },
          },
        },
      },
    })
    payload: {
      otp: number;
      otpReference: string;
    },
  ): Promise<object> {
    //check for the otp and otp reference in User Credentials
    if (payload?.otp && payload?.otpReference) {
      return this.userService.verifyUser(payload.otp, payload.otpReference);
    } else {
      throw new HttpErrors.BadRequest('Enter OTP.');
    }
  }

  //Resend OTP API Endpoint
  // @post('/auth/resendOtp/{otpRef}', {
  //   summary: 'Resend Otp API Endpoint',
  //   responses: {
  //     '200': {},
  //   },
  // })
  // async resendOtp(
  //   @param.path.string('otpRef') otpRef: string,
  // ) {
  //   const otp = await this.userService.resendOTP(otpRef);
  //   return otp;
  // }

  // // //WhoAmI API Endpoint
  // @authenticate('jwt')
  // @get('auth/who-am-i', {
  //   summary: 'Returns the logged in user info',
  //   responses: {
  //     '200': {
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object',
  //             properties: {
  //               user: {
  //                 'x-ts-type': User,
  //               },
  //               session: {
  //                 'x-ts-type': Session,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // async whoAmI(
  //   @inject(SecurityBindings.USER)
  //   authCredentials: AuthCredentials,
  // ): Promise<object> {
  //   return authCredentials;
  // }

  // // //Logout API Endpoint
  // @authenticate('jwt')
  // @post('/auth/logout', {
  //   summary: 'Logout API Endpoint',
  //   responses: {
  //     '200': {
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object',
  //             properties: {
  //               message: {
  //                 type: 'string',
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   }
  // })
  // async logout() {
  //   const token = this.request.headers.authorization?.split(' ')[1];

  //   return await this.sessionRepository.findOne({
  //     where: {
  //       accessToken: token,
  //       expireAt: {gte: new Date(Date.now())}
  //     }
  //   }).then(async (res) => {
  //     return await this.sessionRepository.updateById(res.id, {
  //       status: 'expired',
  //       expiredAt: DateTime.utc().toISO(),
  //     }).then((res) => {
  //       return {
  //         statusCode: 200,
  //         message: 'logout successful'
  //       }
  //     }).catch((err) => {
  //       return {
  //         statusCode: 400,
  //         message: "Couldn't logout",
  //       };
  //     });
  //   }).catch((err) => {
  //     return {
  //       statusCode: 400,
  //       message: "Couldn't logout",
  //     };
  //   });
  // }

  // //Forgot-Password API Endpoint
  // @post('/forgot-password', {
  //   summary: 'Forgot password API Endpoint',
  //   responses: {
  //     '200': {},
  //   },
  // })
  // async forgotPassword(@requestBody({
  //   description: 'Forgot password API Endpoint',
  //   content: {
  //     'application/json': {
  //       schema: {
  //         required: ['email'],
  //         properties: {
  //           email: {
  //             type: 'string',
  //             format: 'email',
  //             maxLength: 254,
  //             minLength: 5,
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // payload: {
  //   email: string;
  // }): Promise<void> {
  //   return this.userService.forgotpassword(payload.email);
  // }

  // //Reset-Password OTP API Endpoint
  // @post('/reset-password', {
  //   summary: 'Reset password API Endpoint',
  //   responses: {
  //     '200': {},
  //   },
  // })
  // async resetPassword(@requestBody({
  //   description: 'Reset password API Endpoint',
  //   content: {
  //     'application/json': {
  //       schema: {
  //         required: ['token', 'newpassword'],
  //         properties: {
  //           token: {type: 'string'},
  //           newpassword: {type: 'string'}
  //         },
  //       },
  //     },
  //   },
  // })
  // payload: {
  //   token: string;
  //   newpassword: string;
  // }) {

  //   // Verify the reset token
  //   const user = await this.forgotpasswordRepository.findOne({
  //     where: {
  //       token: payload.token,
  //     }
  //   });

  //   if (user?.token !== payload.token) {
  //     throw new HttpErrors.BadRequest('Invalid reset token');
  //   }

  //   // Hash the new password
  //   const hashedPassword = await hash(payload.newpassword, await genSalt());
  //   const updatepass = await this.userCredentialsRepository.updateAll({
  //     password: hashedPassword,
  //   });

  //   // const updateUser = await this.userRepository.updateById()

  //   return {
  //     statusCode: 200,
  //     message: 'Password updated successfully',
  //   }
  // }
}
