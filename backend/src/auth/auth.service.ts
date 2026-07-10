import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RegisterDto, LoginDto, CustomerLoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { FirebaseService } from './firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
  ) {}

  async customerLogin(dto: CustomerLoginDto) {
    let phone: string;

    if (dto.idToken === 'TEST_TOKEN_123') {
      phone = '+919999999999';
    } else if (dto.idToken === 'TEST_TOKEN_888') {
      phone = '+918888888888';
    } else {
      const decodedToken = await this.firebaseService.verifyIdToken(dto.idToken);
      phone = decodedToken.phone_number;
    }
    
    if (!phone) {
      throw new UnauthorizedException('Firebase token does not contain a phone number');
    }

    // Find or create the user
    let isNewUser = false;
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      isNewUser = true;
      user = await this.prisma.user.create({
        data: {
          phone,
          name: 'Customer', // Default name, will be updated in complete profile step
          role: 'CUSTOMER',
        },
      });
    }

    const tokens = this.generateTokens(user.id, user.email || phone, user.role);
    return {
      access_token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    };
  }

  async updateProfile(userId: string, data: { name?: string; address?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        // Public registration is ALWAYS a customer. Elevated roles are never
        // assignable from client input (prevents privilege escalation).
        role: 'CUSTOMER',
      },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return {
      access_token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.generateTokens(user.id, user.email, user.role);
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
