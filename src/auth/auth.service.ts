import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.merchant.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('A merchant with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const merchant = await this.prisma.merchant.create({
      data: {
        companyName: dto.companyName,
        email: dto.email,
        password: hashedPassword,
        users: {
          create: {
            name: dto.name,
            email: dto.email,
            role: 'OWNER',
          },
        },
        wallets: {
          create: {
            publicKey: 'G' + Array.from({ length: 55 }, () =>
              'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
            ).join(''),
            assetCode: 'XLM',
            isDefault: true,
          },
        },
      },
      include: {
        users: true,
        wallets: true,
      },
    });

    const token = this.jwtService.sign({
      id: merchant.id,
      email: merchant.email,
      sub: merchant.users[0].id,
    });

    return {
      token,
      merchant: {
        id: merchant.id,
        companyName: merchant.companyName,
        email: merchant.email,
      },
      user: merchant.users[0],
      wallet: merchant.wallets[0],
    };
  }

  async login(dto: LoginDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { email: dto.email },
      include: { users: true },
    });

    if (!merchant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, merchant.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      id: merchant.id,
      email: merchant.email,
      sub: merchant.users[0].id,
    });

    return {
      token,
      merchant: {
        id: merchant.id,
        companyName: merchant.companyName,
        email: merchant.email,
      },
      user: merchant.users[0],
    };
  }

  async validateUser(payload: { id: string; email: string }) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: payload.id },
      include: { users: true },
    });

    if (!merchant) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      id: merchant.id,
      email: merchant.email,
      companyName: merchant.companyName,
      user: merchant.users[0],
    };
  }

  async getProfile(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        users: true,
        wallets: true,
      },
    });

    return merchant;
  }
}
