import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, Request, RestBindings, post, requestBody} from '@loopback/rest';
import {genSalt, hash} from 'bcryptjs';
import {DateTime} from 'luxon';
import {
  AdminCredentialsRepository,
  AdminRepository,
  AdminSessionRepository,
  CustomerCredentialsRepository,
  CustomerRepository,
  CustomerSessionRepository,
  // ForgotpasswordRepository,
  SessionRepository,
  UserCredentialsRepository,
  UserRepository
} from '../repositories';
import {UserService} from '../services';
import {AuthKeys} from '../shared/keys/auth.keys';
import {UserKeys} from '../shared/keys/user.keys';


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
    @repository(AdminCredentialsRepository)
    public adminCredentialsRepository: AdminCredentialsRepository,
    @repository(AdminSessionRepository)
    public adminSessionRepository: AdminSessionRepository,
    @repository(CustomerRepository)
    public customerRepository: CustomerRepository,
    @repository(CustomerCredentialsRepository)
    public customerCredentialsRepository: CustomerCredentialsRepository,
    @repository(CustomerSessionRepository)
    public customerSessionRepository: CustomerSessionRepository,
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
            required: ['name', 'email', 'password', 'role'],
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
      role: string;
    },
  ) {
    const {name, email, password, role} = payload;
    const hashedPassword = await hash(password, await genSalt());

    if (role === 'admin') {
      const customer = await this.customerRepository.findOne({
        where: {email, isDeleted: false},
      });
      if (customer) {
        return {
          statusCode: 200,
          message: UserKeys.USER_ALREADY_EXIST,
        }
      }
      const admin = await this.adminRepository.findOne({
        where: {email, isDeleted: false},
      });
      if (admin) {
        return {
          statusCode: 200,
          message: UserKeys.USER_ALREADY_EXIST,
        }
      }
      const newAdmin = await this.adminRepository.create({
        name,
        email,
        password
      });
      const cred = await this.adminCredentialsRepository.create({
        password: hashedPassword,
        adminId: newAdmin.id
      });
      return {
        statusCode: 200,
        message: UserKeys.USER_CREATED,
        data: newAdmin,
        adminCred: cred,
      };
    }

    if (role === 'customer') {
      const admin = await this.adminRepository.findOne({
        where: {email, isDeleted: false},
      });
      if (admin) {
        return {
          statusCode: 404,
          message: UserKeys.USER_ALREADY_EXIST
        }
      }

      const customer = await this.customerRepository.findOne({
        where: {email, isDeleted: false},
      });
      if (customer) {
        return {
          statusCode: 404,
          message: UserKeys.USER_ALREADY_EXIST
        }
      }
      const newCustomer = await this.customerRepository.create({
        name,
        email,
        password
      });
      const cred = await this.customerCredentialsRepository.create({
        password: hashedPassword,
        customerId: newCustomer.id
      });

      return {
        statusCode: 200,
        message: UserKeys.USER_CREATED,
        data: newCustomer,
        customerCred: cred,
      };
    }
    // const user = await this.userRepository.create({
    //   name,
    //   email,
    //   password,
    // });
    // const hashedPassword = await hash(password, await genSalt());
    // await this.userCredentialsRepository.create({
    //   userId: user.id,
    //   password: hashedPassword,
    // });
    // return user;
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
    return user;
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
                errorMessage: {
                  minLength: 'OTP must be at least 6 digits long.',
                  type: 'Invalid input. OTP must be a number.',
                },
              },
              otpReference: {
                type: 'string',
                minLength: 6,
                errorMessage: {
                  minLength: 'OTP reference must be at least 6 characters long.',
                  type: 'Invalid input. OTP reference must be a string.',
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

  //Forgot-Password API Endpoint
  @post('/forgot-password', {
    summary: 'Forgot password API Endpoint',
    responses: {
      '200': {},
    },
  })
  async forgotPassword(@requestBody({
    description: 'Forgot password API Endpoint',
    content: {
      'application/json': {
        schema: {
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              maxLength: 254,
              minLength: 5,
            },
          },
        },
      },
    },
  })
  payload: {
    email: string;
  }) {
    return this.userService.forgotPassword(payload.email);
  }

  //Reset-Password OTP API Endpoint
  @post('/reset-password', {
    summary: 'Reset password API Endpoint',
    responses: {
      '200': {},
    },
  })
  async resetPassword(@requestBody({
    description: 'Reset password API Endpoint',
    content: {
      'application/json': {
        schema: {
          required: ['token', 'password', 'confirPassword'],
          properties: {
            token: {type: 'string'},
            password: {type: 'string'},
            confirPassword: {type: 'string'}
          },
        },
      },
    },
  })
  payload: {
    token: string;
    password: string;
    confirPassword: string;
  }) {
    return this.userService.resetPassword(payload);
  }

  //Logout API Endpoint
  @authenticate('jwt')
  @post('/auth/logout', {
    summary: 'Logout API Endpoint',
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    }
  })
  async logout() {
    const token = this.request.headers.authorization?.split(' ')[1];

    const adminSession = await this.adminSessionRepository.findOne({
      where: {
        accessToken: token,
        expireAt: {gte: new Date(Date.now())}
      }
    });
    if (adminSession) {
      const admin = await this.sessionRepository.updateById(adminSession.id, {
        status: 'expired',
        expiredAt: DateTime.utc().toISO(),
      });
      return {
        statusCode: 200,
        message: AuthKeys.LOGIN_SUCCESS,
      };
    }

    const customerSession = await this.customerSessionRepository.findOne({
      where: {
        accessToken: token,
        expireAt: {gte: new Date(Date.now())}
      }
    });
    if (customerSession) {
      const customer = await this.customerSessionRepository.updateById(customerSession.id, {
        status: 'expired',
        expiredAt: DateTime.utc().toISO(),
      });
      return {
        statusCode: 200,
        message: AuthKeys.LOGIN_SUCCESS,
      };
    }
    return {
      statusCode: 404,
      message: AuthKeys.NOT_LOGGED_IN
    };
  }
}
