import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisionTest } from './entities/vision-test.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Branch } from '../auth/entities/branch.entity';
import { Organization } from '../auth/entities/organization.entity';
import { CreateVisionTestDto } from './dto/create-vision-test.dto';
import { UpdateVisionTestDto } from './dto/update-vision-test.dto';

interface Context {
  organizationId: number;
  branchId: number;
}

@Injectable()
export class VisionTestsService {
  constructor(
    @InjectRepository(VisionTest) private readonly visionTestsRepository: Repository<VisionTest>,
    @InjectRepository(Customer) private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Branch) private readonly branchesRepository: Repository<Branch>,
    @InjectRepository(Organization) private readonly organizationsRepository: Repository<Organization>,
  ) {}

  async getContext(userId: number): Promise<Context> {
    const organization = await this.organizationsRepository.findOne({ where: { ownerId: userId } });
    if (!organization) {
      throw new NotFoundException('No organization found for this account');
    }
    const branch = await this.branchesRepository.findOne({ where: { organizationId: organization.id } });
    if (!branch) {
      throw new NotFoundException('No branch found for this account');
    }
    return { organizationId: organization.id, branchId: branch.id };
  }

  private toResponse(visionTest: VisionTest) {
    const { customer, ...rest } = visionTest;
    return rest;
  }

  async create(userId: number, dto: CreateVisionTestDto) {
    const { organizationId, branchId } = await this.getContext(userId);
    const customer = await this.customersRepository.findOne({ where: { id: dto.customerId, organizationId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const visionTest = this.visionTestsRepository.create({
      organizationId,
      branchId,
      customerId: dto.customerId,
      hasVisionDetails: dto.hasVisionDetails ?? true,
      rSph: dto.rSph,
      rCyl: dto.rCyl,
      rAxis: dto.rAxis,
      rAdd: dto.rAdd,
      rVa: dto.rVa,
      lSph: dto.lSph,
      lCyl: dto.lCyl,
      lAxis: dto.lAxis,
      lAdd: dto.lAdd,
      lVa: dto.lVa,
      pd: dto.pd,
      height: dto.height,
      rightPd: dto.rightPd,
      leftPd: dto.leftPd,
      rightHeight: dto.rightHeight,
      leftHeight: dto.leftHeight,
      refractionRemark: dto.refractionRemark,
      sugar: dto.sugar ?? false,
      cataract: dto.cataract ?? false,
      abnormalities: dto.abnormalities,
    });
    const saved = await this.visionTestsRepository.save(visionTest);
    return this.toResponse(saved);
  }

  async findByCustomer(userId: number, customerId: number) {
    const { branchId } = await this.getContext(userId);
    const visionTests = await this.visionTestsRepository.find({
      where: { customerId, branchId },
      order: { createdAt: 'DESC' },
    });
    return visionTests.map((v) => this.toResponse(v));
  }

  async findOne(userId: number, id: number) {
    const { branchId } = await this.getContext(userId);
    const visionTest = await this.visionTestsRepository.findOne({ where: { id, branchId } });
    if (!visionTest) {
      throw new NotFoundException('Vision test not found');
    }
    return this.toResponse(visionTest);
  }

  async update(userId: number, id: number, dto: UpdateVisionTestDto) {
    const { branchId } = await this.getContext(userId);
    const visionTest = await this.visionTestsRepository.findOne({ where: { id, branchId } });
    if (!visionTest) {
      throw new NotFoundException('Vision test not found');
    }
    Object.assign(visionTest, dto);
    const saved = await this.visionTestsRepository.save(visionTest);
    return this.toResponse(saved);
  }
}
