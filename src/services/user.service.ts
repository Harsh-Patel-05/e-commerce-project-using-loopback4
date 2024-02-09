import {TokenService} from '@loopback/authentication';
import {injectable, BindingScope, inject} from '@loopback/core';
import {User} from '../models';
import {HttpErrors} from '@loopback/rest';
import {compare} from 'bcryptjs';
import {repository} from '@loopback/repository';
import {SessionRepository, UserCredentialsRepository, UserRepository} from '../repositories';
import {DateTime} from 'luxon';
import {TokenServiceBindings} from '../keys';
import {UserProfile, securityId} from '@loopback/security';
import otpGenerator from 'otp-generator';
import * as dotenv from 'dotenv';
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
    public jwtService: TokenService,) { }

  //verify Credentials service method
  async verifyCredentials(credentials: Credentials): Promise<User> {
    const invalidCredentialsError = 'Invalid email or password.';

    const foundUser = await this.userRepository.findOne({
      where: {email: credentials.email.toLowerCase()},
    });
    if (!foundUser) {
      throw new HttpErrors.BadRequest(invalidCredentialsError);
    }

    const credentialsFound = await this.userRepository.findCredentials(
      foundUser.id,
    );
    if (!credentialsFound) {
      throw new HttpErrors.BadRequest(invalidCredentialsError);
    }

    const passwordMatched = await compare(
      credentials.password,
      <string>credentialsFound.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.BadRequest(invalidCredentialsError);
    }

    return foundUser;
  }

  //verify user service method
  async verifyUser(otp: number, otpRef: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verifyUserResponse: any = {};
    //find user credentials from otpReference
    const userCredentials = await this.userCredentialsRepository.findOne({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: <any>{
        'security.otpRef': otpRef,
      },
    });

    const foundUser = await this.userRepository.findOne({
      where: {id: userCredentials?.userId},
    });
    if (!foundUser) {
      throw new HttpErrors.BadRequest('User not found.');
    }

    //check if otp is expired
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expiredAt: any = userCredentials?.security?.expiredAt;
    const expiredAtTimestamp = DateTime.fromJSDate(expiredAt).toMillis();
    const currentTimeStamp = DateTime.utc().toMillis();

    if (currentTimeStamp > expiredAtTimestamp) {
      throw new HttpErrors.BadRequest('OTP is expired.');
    }

    //check if otp is valid (from reference)
    if (userCredentials?.security?.otp !== otp) {
      throw new HttpErrors.BadRequest('Enter valid OTP');
    }

    //get user from the UserCredentials
    const user = await this.userRepository.findById(userCredentials?.userId);

    const loginResponse = await this.generateAccessToken(user);
    verifyUserResponse.session = loginResponse.session;
    verifyUserResponse.user = loginResponse.user;

    return verifyUserResponse;
  }

  //generateToken service method
  async generateAccessToken(user: User) {
    const userProfile = this.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);

    const EXPIRATION_PERIOD = '7D';

    // create session
    const savedSession = await this.sessionRepository.create({
      userId: user?.id,
      accessToken: token,
      status: 'current',
      loginAt: DateTime.utc(),
      expireAt: DateTime.utc()
        .plus({
          hours: parseInt(EXPIRATION_PERIOD),
        })
        .toISO(),
    });

    //update lastLogin for user
    await this.userRepository.updateById(user?.id, {
      lastLoginAt: DateTime.utc(),
    });

    return {
      session: savedSession,
      user,
    };
  }

  convertToUserProfile(user: User): UserProfile {
    return {
      [securityId]: user.id.toString(),
      id: user.id,
      email: user.email,
    };
  }

  //send OTP service method
  async sendOtp(email: string, userId: string) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpReference = otpGenerator.generate(6, {digits: true, lowerCaseAlphabets: true, upperCaseAlphabets: true});
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 2);

    const userCredentials = await this.userCredentialsRepository.findOne({
      where: {
        userId: userId,
      }
    })


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

    // update userCredentials
    await this.userCredentialsRepository.updateById(userCredentials.id, {
      security
    });

    return await sgMail.send(msg).then(() => {
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
