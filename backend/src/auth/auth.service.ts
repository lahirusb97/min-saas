import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { Branch } from './entities/branch.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Branch) private readonly branchesRepository: Repository<Branch>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: { contactNumber: dto.contactNumber },
    });
    if (existing) {
      throw new ConflictException('Contact number is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      shopName: dto.shopName,
      contactNumber: dto.contactNumber,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    await this.usersRepository.save(user);

    const branch = this.branchesRepository.create({
      name: dto.shopName,
      contactNumber: dto.contactNumber,
      ownerId: user.id,
    });
    await this.branchesRepository.save(branch);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { contactNumber: dto.contactNumber },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid contact number or password');
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User) {
    const accessToken = this.jwtService.sign({ sub: user.id });
    return {
      accessToken,
      user: {
        id: user.id,
        shopName: user.shopName,
        contactNumber: user.contactNumber,
        role: user.role,
      },
    };
  }
}
