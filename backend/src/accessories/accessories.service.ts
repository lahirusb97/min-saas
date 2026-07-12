import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accessory } from './entities/accessory.entity';
import { Organization } from '../auth/entities/organization.entity';
import { CreateAccessoryDto } from './dto/create-accessory.dto';
import { UpdateAccessoryDto } from './dto/update-accessory.dto';

@Injectable()
export class AccessoriesService {
  constructor(
    @InjectRepository(Accessory) private readonly accessoriesRepository: Repository<Accessory>,
    @InjectRepository(Organization) private readonly organizationsRepository: Repository<Organization>,
  ) {}

  private async getOrganizationId(userId: number): Promise<number> {
    const organization = await this.organizationsRepository.findOne({ where: { ownerId: userId } });
    if (!organization) {
      throw new NotFoundException('No organization found for this account');
    }
    return organization.id;
  }

  async create(userId: number, dto: CreateAccessoryDto) {
    const organizationId = await this.getOrganizationId(userId);
    const accessory = this.accessoriesRepository.create({
      organizationId,
      name: dto.name.trim(),
      qty: dto.qty,
      price: dto.price,
    });
    return this.accessoriesRepository.save(accessory);
  }

  async findAll(userId: number) {
    const organizationId = await this.getOrganizationId(userId);
    return this.accessoriesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  private async findOneEntity(userId: number, id: number) {
    const organizationId = await this.getOrganizationId(userId);
    const accessory = await this.accessoriesRepository.findOne({ where: { id, organizationId } });
    if (!accessory) {
      throw new NotFoundException('Accessory not found');
    }
    return accessory;
  }

  async findOne(userId: number, id: number) {
    return this.findOneEntity(userId, id);
  }

  async update(userId: number, id: number, dto: UpdateAccessoryDto) {
    const accessory = await this.findOneEntity(userId, id);
    if (dto.name !== undefined) accessory.name = dto.name.trim();
    if (dto.qty !== undefined) accessory.qty = dto.qty;
    if (dto.price !== undefined) accessory.price = dto.price;
    return this.accessoriesRepository.save(accessory);
  }

  async remove(userId: number, id: number) {
    const accessory = await this.findOneEntity(userId, id);
    await this.accessoriesRepository.remove(accessory);
    return { id };
  }
}
