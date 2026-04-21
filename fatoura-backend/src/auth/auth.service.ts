import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './auth.entity';
import { Company } from '../profile/company.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: any }> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      fullName: dto.name,
      email: dto.email,
      passwordHash: hashedPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    await this.userRepository.save(user);

    if (dto.company) {
      const company = this.companyRepository.create({
        userId: user.id,
        nom: dto.company,
      });
      await this.companyRepository.save(company);
    }

    return this.signToken(user);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: ['company'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user);
  }

  private signToken(user: User): { accessToken: string; user: any } {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        company: user.company?.nom ?? null,
      },
    };
  }
}