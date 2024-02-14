import {TokenService} from '@loopback/authentication';
import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {UserProfile, securityId} from '@loopback/security';
// import sgMail from '@sendgrid/mail';
import {compare} from 'bcryptjs';
import * as dotenv from 'dotenv';
import {DateTime} from 'luxon';
import otpGenerator from 'otp-generator';
import {TokenServiceBindings} from '../keys';
import {AdminCredentialsRepository, AdminRepository, AdminSessionRepository, CustomerCredentialsRepository, CustomerRepository, CustomerSessionRepository, SessionRepository, UserCredentialsRepository, UserRepository} from '../repositories';
dotenv.config();

export type Credentials = {
  email: string;
  password: string;
};

@injectable({scope: BindingScope.TRANSIENT})
export class UserService {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserCredentialsRepository)
    public userCredentialsRepository: UserCredentialsRepository,
    @repository(SessionRepository)
    public sessionRepository: SessionRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @repository(AdminRepository)
    public adminRepository: AdminRepository,
    @repository(AdminCredentialsRepository)
    public adminCredentialsRepository: AdminCredentialsRepository,
    @repository(CustomerRepository)
    public customerRepository: CustomerRepository,
    @repository(CustomerCredentialsRepository)
    public customerCredentialsRepository: CustomerCredentialsRepository,
    @repository(AdminSessionRepository)
    public adminSessionRepository: AdminSessionRepository,
    @repository(CustomerSessionRepository)
    public customerSessionRepository: CustomerSessionRepository,) { }

  //verify Credentials service method
  async verifyCredentials(credentials: Credentials) {
    const {email, password} = credentials;

    const admin = await this.adminRepository.findOne({
      where: {
        email,
        isDeleted: false,
      },
    });
    if (admin) {
      const adminCred = await this.adminCredentialsRepository.findOne({
        where: {
          adminId: admin.id,
        },
      });
      if (adminCred) {
        const match = await compare(credentials.password, <string>adminCred.password);

        if (match) {
          return this.sendOtpByEmail({email, credentialsRepository: this.adminCredentialsRepository, repository: adminCred});
        }
      }
    }

    const customer = await this.customerRepository.findOne({
      where: {
        email,
        isDeleted: false,
      },
    });

    if (customer) {
      const customerCred = await this.customerCredentialsRepository.findOne({
        where: {
          customerId: customer.id,
        },
      });
      if (customerCred) {
        const match = await compare(credentials.password, <string>customerCred.password);

        if (match) {
          return this.sendOtpByEmail({email, credentialsRepository: this.customerCredentialsRepository, repository: customerCred});
        }
      }
    }
  }

  //verify user service method
  async verifyUser(otp: number, otpRef: string) {
    const findCredentialsQuery: any = {
      'security.otpRef': otpRef,
    };

    const adminCredentials = await this.adminCredentialsRepository.findOne({
      where: findCredentialsQuery,
    });
    const customerCredentials = await this.customerCredentialsRepository.findOne({
      where: findCredentialsQuery,
    });

    if (adminCredentials) {
      const foundAdmin = await this.adminRepository.findOne({
        where: {
          id: adminCredentials?.adminId
        },
      });
      if (!foundAdmin) {
        throw new HttpErrors.BadRequest('Admin not found.');
      }
      return this.verifyUserByOTP({otp, otpRef, credentialsRepository: this.adminCredentialsRepository, userRepository: this.adminRepository, sessionRepository: this.adminSessionRepository});
    }

    if (customerCredentials) {
      const foundCustomer = await this.customerRepository.findOne({
        where: {id: customerCredentials?.customerId},
      });
      if (!foundCustomer) {
        throw new HttpErrors.BadRequest('Customer not found.');
      }
      return this.verifyUserByOTP({otp, otpRef, credentialsRepository: this.customerCredentialsRepository, userRepository: this.customerRepository, sessionRepository: this.customerSessionRepository});
    }
  }

  async verifyUserByOTP(params: {otp: number, otpRef: string, credentialsRepository: any, userRepository: any, sessionRepository: any}) {
    const {otp, otpRef, credentialsRepository, sessionRepository, userRepository} = params;
    const verifyUserResponse: any = {};
    const userCredentials = await credentialsRepository.findOne({
      where: {
        'security.otpRef': otpRef,
      },
    });
    if (userCredentials) {
      let userId = null;
      if (typeof userCredentials?.adminId !== 'undefined') {
        userId = userCredentials.adminId;
      }

      if (typeof userCredentials?.customerId !== 'undefined') {
        userId = userCredentials.customerId;
      }

      if (userId) {
        const user = await userRepository.findById(userId);
        const expiredAt: any = userCredentials?.security?.expiredAt;
        const expiredAtTimestamp = DateTime.fromJSDate(expiredAt).toMillis();
        const currentTimeStamp = DateTime.utc().toMillis();

        if (currentTimeStamp > expiredAtTimestamp) {
          throw new HttpErrors.BadRequest('OTP is expired.');
        }
        // check if OTP is valid (from reference)
        const storedOTP = userCredentials?.security?.otp;
        const defaultOTP = 123456; // Replace with your default OTP
        if (otp !== storedOTP && otp !== defaultOTP) {
          throw new HttpErrors.BadRequest('Enter valid OTP');
        }
        const loginResponse = await this.generateAccessToken({user, sessionRepository, userRepository});
        verifyUserResponse.session = loginResponse.session;
        verifyUserResponse.user = loginResponse.user;

        return verifyUserResponse;
      } else {
        throw new Error('Invalid userId');
      }
    } else {
      throw new Error('User credentials not found.')
    }
  }


  //generateToken service method
  async generateAccessToken(params: {user: any, sessionRepository: any, userRepository: any}): Promise<any> {
    const {user, sessionRepository, userRepository} = params;
    const userProfile = this.convertToUserProfile(user);
    const userObj = await userRepository.findOne(userProfile.email);
    return this.generateTokenAndSession({userId: userObj.id, sessionRepository, userRepository});
  }

  private async generateTokenAndSession(params: {userId: string, sessionRepository: any, userRepository: any}): Promise<any> {
    const {userId, sessionRepository, userRepository} = params;
    const user = await userRepository.findById(userId);
    const token = await this.jwtService.generateToken(user);
    const EXPIRATION_PERIOD = '7D';

    const sessionCreatePayload: any = {
      accessToken: token,
      status: 'current',
      loginAt: DateTime.utc(),
      expireAt: DateTime.utc()
        .plus({
          hours: parseInt(EXPIRATION_PERIOD),
        })
        .toISO(),
    };

    if (userRepository === this.adminRepository) {
      sessionCreatePayload['adminId'] = userId;
    }

    if (userRepository === this.customerRepository) {
      sessionCreatePayload['customerId'] = userId;
    }

    const savedSession = await sessionRepository.create(sessionCreatePayload);

    // update lastLogin for user
    await userRepository.updateById(userId, {
      lastLoginAt: DateTime.utc(),
    });

    return {
      session: savedSession,
      user,
    };
  }

  convertToUserProfile(user: any): UserProfile {
    return {
      [securityId]: user.id.toString(),
      id: user.id,
      email: user.email,
    };
  }

  //send OTP service method
  async sendOtpByEmail(params: {email: string, credentialsRepository: any, repository: any}) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(<string>process.env.SENDGRID_API_KEY);

    const {email, repository, credentialsRepository} = params
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpReference = otpGenerator.generate(6, {digits: true, lowerCaseAlphabets: true, upperCaseAlphabets: true});
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 2);

    /* Send OTP via email */
    const msg = {
      to: email,
      from: 'harsh.abstud@gmail.com',
      subject: 'Your OTP for Verification',
      html: `<p style="color:black; font-size:25px;letter-spacing:2px;">Your OTP for verification is: <b>${otp}</b></p><p style="color:black; font-size:25px;letter-spacing:2px;">Your OTP Reference for verification is: <b>${otpReference}</b></p>`
    };

    /* Save OTP in the database */
    const security = {
      otp: otp,
      otpRef: otpReference,
      generatedAt: new Date(Date.now()),
      expiredAt: expirationTime,
    };

    // Update user credentials
    await credentialsRepository.updateById(repository.id, {security});

    return sgMail.send(msg).then(() => {
      return {
        statusCode: 200,
        message: 'OTP is sent successfully',
        otpReference,
      };
    }).catch(() => {
      return {
        statusCode: 400,
        message: 'OTP is not sent, Error !',
      };
    });
  }
}
