import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, LoginUserDto } from 'modules/users/create-user.dto';
import { UsersService } from 'modules/users/users.service';
import { Session } from 'models/session.model';
import { User } from 'models/users.model';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Session) private sessionRepository,
    @InjectModel(User) private userRepository,
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async registration(userDto: CreateUserDto) {
    try {
      const candidate = await this.userService.getUserByEmail(userDto.email);
      if (candidate) {
        throw new HttpException(
          'User with the same email already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
      const hasPassword = await bcrypt.hash(userDto.password, 5);
      const user = await this.userService.createUser({
        ...userDto,
        password: hasPassword,
      });
      return user;
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async login(userDto: LoginUserDto) {
    try {
      const loginUser = await this.validateUser(userDto);
      try {
        const newSession = await this.sessionRepository.create({
          uid: loginUser.id,
        });
        const accessToken = this.jwtService.sign(
          { uid: loginUser.id, sid: newSession.id },
          {
            secret: process.env.SECRET_KEY,
            expiresIn: '1h',
          },
        );
        const refreshToken = this.jwtService.sign(
          { uid: loginUser.id, sid: newSession.id },
          {
            secret: process.env.SECRET_KEY,
            expiresIn: '2d',
          },
        );
        return await this.userService
          .getUserByEmail(loginUser.email)
          .then(() => {
            const data = {
              accessToken,
              refreshToken,
              sid: newSession.id,
            };
            const user = {
              id: loginUser.id,
              email: loginUser.email,
              name: `${loginUser.first_name}  ${loginUser.last_name}`,
              role: loginUser.roles,
              isBlocked: loginUser.isBlocked,
              vacation: loginUser.total_vacations,
              sick_leaves: loginUser.total_sick_leaves,
              dates: loginUser.dates,
            };
            return {
              data,
              user,
            };
          });
      } catch (e) {
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
      }
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async logout({ request, response }) {
    try {
      const session = request.session;
      await this.sessionRepository.destroy({
        where: { id: session.id },
      });
      request.user = null;
      request.session = null;
      return response.end();
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async refresh(request) {
    try {
      const session = request.session;
      await this.sessionRepository.destroy({
        where: { id: session.id },
      });
      const newSession = await this.sessionRepository.create({
        uid: request.user.id,
      });
      const accessToken = this.jwtService.sign(
        { uid: request.user.id, sid: newSession.id },
        {
          secret: process.env.SECRET_KEY,
          expiresIn: '1h',
        },
      );
      const refreshToken = this.jwtService.sign(
        { uid: request.user.id, sid: newSession.id },

        { secret: process.env.SECRET_KEY, expiresIn: '2d' },
      );
      return {
        data: { accessToken, refreshToken, sid: newSession.id },
      };
    } catch (e) {
      console.log(e.message);
    }
  }

  private async validateUser(userDto: LoginUserDto) {
    try {
      const user = await this.userService.getUserByEmail(userDto.email);
      const passwordEquals = await bcrypt.compare(
        userDto.password,
        user.password,
      );
      if (user && passwordEquals) {
        return user;
      }
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
