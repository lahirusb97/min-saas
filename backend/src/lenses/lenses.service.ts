import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lens } from './entities/lens.entity';
import { Factory } from './entities/factory.entity';
import { Organization } from '../auth/entities/organization.entity';
import { CreateLensDto } from './dto/create-lens.dto';
import { UpdateLensDto } from './dto/update-lens.dto';

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

@Injectable()
export class LensesService {
  constructor(
    @InjectRepository(Lens) private readonly lensesRepository: Repository<Lens>,
    @InjectRepository(Factory) private readonly factoriesRepository: Repository<Factory>,
    @InjectRepository(Organization) private readonly organizationsRepository: Repository<Organization>,
  ) {}

  private async getOrganizationId(userId: number): Promise<number> {
    const organization = await this.organizationsRepository.findOne({ where: { ownerId: userId } });
    if (!organization) {
      throw new NotFoundException('No organization found for this account');
    }
    return organization.id;
  }

  private async getOrCreateFactory(organizationId: number, name: string): Promise<number | undefined> {
    const trimmed = name.trim();
    if (!trimmed) {
      return undefined;
    }
    const target = normalizeName(trimmed);
    const factoriesInOrg = await this.factoriesRepository.find({ where: { organizationId } });
    const existing = factoriesInOrg.find((f) => normalizeName(f.name) === target);
    if (existing) {
      return existing.id;
    }
    const created = await this.factoriesRepository.save(this.factoriesRepository.create({ organizationId, name: trimmed }));
    return created.id;
  }

  private toResponse(lens: Lens) {
    const { factory, ...rest } = lens;
    return { ...rest, factory: factory?.name };
  }

  async create(userId: number, dto: CreateLensDto) {
    const organizationId = await this.getOrganizationId(userId);
    const factoryId = dto.factory ? await this.getOrCreateFactory(organizationId, dto.factory) : undefined;
    const lens = this.lensesRepository.create({
      organizationId,
      name: dto.name.trim(),
      type: dto.type?.trim() || undefined,
      coating: dto.coating?.trim() || undefined,
      factoryId,
      price: dto.price,
    });
    const saved = await this.lensesRepository.save(lens);
    return this.toResponse(await this.lensesRepository.findOneOrFail({ where: { id: saved.id }, relations: { factory: true } }));
  }

  async findAll(userId: number) {
    const organizationId = await this.getOrganizationId(userId);
    const lenses = await this.lensesRepository.find({
      where: { organizationId },
      relations: { factory: true },
      order: { createdAt: 'DESC' },
    });
    return lenses.map((lens) => this.toResponse(lens));
  }

  private async findOneEntity(userId: number, id: number) {
    const organizationId = await this.getOrganizationId(userId);
    const lens = await this.lensesRepository.findOne({ where: { id, organizationId }, relations: { factory: true } });
    if (!lens) {
      throw new NotFoundException('Lens not found');
    }
    return lens;
  }

  async findOne(userId: number, id: number) {
    return this.toResponse(await this.findOneEntity(userId, id));
  }

  async update(userId: number, id: number, dto: UpdateLensDto) {
    const lens = await this.findOneEntity(userId, id);
    const organizationId = await this.getOrganizationId(userId);
    const { name, type, coating, factory, price } = dto;

    if (name !== undefined) lens.name = name.trim();
    if (type !== undefined) lens.type = type.trim() || undefined;
    if (coating !== undefined) lens.coating = coating.trim() || undefined;
    if (price !== undefined) lens.price = price;
    if (factory !== undefined) {
      lens.factoryId = await this.getOrCreateFactory(organizationId, factory);
    }

    const saved = await this.lensesRepository.save(lens);
    return this.toResponse(await this.lensesRepository.findOneOrFail({ where: { id: saved.id }, relations: { factory: true } }));
  }

  async remove(userId: number, id: number) {
    const lens = await this.findOneEntity(userId, id);
    await this.lensesRepository.remove(lens);
    return { id };
  }

  async listFactories(userId: number) {
    const organizationId = await this.getOrganizationId(userId);
    const factories = await this.factoriesRepository.find({ where: { organizationId }, order: { name: 'ASC' } });
    return factories.map((f) => f.name);
  }
}
