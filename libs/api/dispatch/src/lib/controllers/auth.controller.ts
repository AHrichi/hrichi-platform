import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { DispatchEncryptionService } from '../services/encryption.service';
import { MongoDispatchRepository } from '../repositories/mongo-dispatch.repository';
import {
  DispatchAuthGuard,
  type AuthenticatedRequest,
} from '../guards/dispatch-auth.guard';
import type { DispatchUser } from '../models/user.model';

@Controller('api/dispatch/auth')
export class DispatchAuthController {
  constructor(
    private readonly repository: MongoDispatchRepository,
    private readonly encryption: DispatchEncryptionService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const existing = await this.repository.findUserByEmail(dto.email);
    if (existing) {
      throw new BadRequestException(
        'An account with this email already exists.',
      );
    }

    const { salt, hash } = this.encryption.hashPassword(dto.password);
    const userId = `usr_${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: DispatchUser = {
      id: userId,
      email: dto.email.trim().toLowerCase(),
      name: dto.name.trim(),
      role: dto.role,
      passwordSalt: salt,
      passwordHash: hash,
      associatedId: dto.associatedId,
      companyName: dto.companyName,
      phoneEncrypted: dto.phone,
      createdAt: new Date().toISOString(),
    };

    await this.repository.createUser(newUser);

    const token = this.encryption.signSessionToken({
      sub: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      associatedId: newUser.associatedId,
      companyName: newUser.companyName,
    });

    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        associatedId: newUser.associatedId,
        companyName: newUser.companyName,
      },
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.repository.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isValid = this.encryption.verifyPassword(
      dto.password,
      user.passwordSalt,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = this.encryption.signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      associatedId: user.associatedId,
      companyName: user.companyName,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        associatedId: user.associatedId,
        companyName: user.companyName,
      },
    };
  }

  @Get('me')
  @UseGuards(DispatchAuthGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    const session = req.user;
    if (!session) {
      throw new UnauthorizedException();
    }
    const user = await this.repository.findUserById(session.sub);
    if (!user) {
      throw new UnauthorizedException('User account no longer exists.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      associatedId: user.associatedId,
      companyName: user.companyName,
      phone: user.phoneEncrypted,
      createdAt: user.createdAt,
    };
  }

  @Post('seed-demo-users')
  async seedDemoUsers() {
    const demoAccounts: Array<{
      email: string;
      name: string;
      role: DispatchUser['role'];
      companyName?: string;
      associatedId?: string;
      phone?: string;
    }> = [
      {
        email: 'owner@lplaundry.co.uk',
        name: 'Rashid Khan (Owner)',
        role: 'owner',
        companyName: 'LP Laundry London',
        phone: '+44 20 7946 0991',
      },
      {
        email: 'coordinator@lplaundry.co.uk',
        name: 'Sarah Jenkins (Shift Coordinator)',
        role: 'coordinator',
        companyName: 'LP Laundry Operations',
        phone: '+44 7700 900820',
      },
      {
        email: 'driver.tariq@lplaundry.co.uk',
        name: 'Tariq Mahmood (Mayfair Van)',
        role: 'driver',
        associatedId: 'drv-tariq',
        phone: '+44 7700 900821',
      },
      {
        email: 'plant.thames@lplaundry.co.uk',
        name: 'Vikram Sharma (Thames Plant)',
        role: 'plant_manager',
        associatedId: 'plant-thames',
        companyName: 'Thames Valley Steam Laundry',
        phone: '+44 20 8965 4100',
      },
      {
        email: 'dorchester@hotels.co.uk',
        name: 'Claire Dupont (Exec Housekeeper)',
        role: 'customer',
        companyName: 'The Dorchester London',
        phone: '+44 20 7629 8888',
      },
    ];

    const results = [];
    for (const acc of demoAccounts) {
      const existing = await this.repository.findUserByEmail(acc.email);
      if (!existing) {
        const { salt, hash } = this.encryption.hashPassword('london123');
        const user: DispatchUser = {
          id: `usr_${acc.role}_${Math.floor(100 + Math.random() * 899)}`,
          email: acc.email,
          name: acc.name,
          role: acc.role,
          passwordSalt: salt,
          passwordHash: hash,
          associatedId: acc.associatedId,
          companyName: acc.companyName,
          phoneEncrypted: acc.phone,
          createdAt: new Date().toISOString(),
        };
        await this.repository.createUser(user);
        results.push(acc.email);
      }
    }

    return {
      message:
        'Demo accounts seeded successfully. Password for all is: london123',
      seededAccounts: demoAccounts.map((a) => ({
        email: a.email,
        name: a.name,
        role: a.role,
      })),
    };
  }
}
