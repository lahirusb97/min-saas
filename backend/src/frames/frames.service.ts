import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Frame } from './entities/frame.entity';
import { Brand } from './entities/brand.entity';
import { Color } from './entities/color.entity';
import { Stock } from './entities/stock.entity';
import { Branch } from '../auth/entities/branch.entity';
import { Organization } from '../auth/entities/organization.entity';
import { CreateFrameDto } from './dto/create-frame.dto';
import { UpdateFrameDto } from './dto/update-frame.dto';

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function dedupeByNormalizedName(values: string[]) {
  const seen = new Map<string, string>();
  for (const value of values) {
    const key = normalizeName(value);
    if (key && !seen.has(key)) {
      seen.set(key, value);
    }
  }
  return [...seen.values()];
}

interface Context {
  organizationId: number;
  branchId: number;
}

@Injectable()
export class FramesService {
  constructor(
    @InjectRepository(Frame) private readonly framesRepository: Repository<Frame>,
    @InjectRepository(Brand) private readonly brandsRepository: Repository<Brand>,
    @InjectRepository(Color) private readonly colorsRepository: Repository<Color>,
    @InjectRepository(Stock) private readonly stocksRepository: Repository<Stock>,
    @InjectRepository(Branch) private readonly branchesRepository: Repository<Branch>,
    @InjectRepository(Organization) private readonly organizationsRepository: Repository<Organization>,
  ) {}

  private async getContext(userId: number): Promise<Context> {
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

  private async getOrCreateBrand(organizationId: number, name: string): Promise<number> {
    const trimmed = name.trim();
    const target = normalizeName(trimmed);
    const brandsInOrg = await this.brandsRepository.find({ where: { organizationId } });
    const existing = brandsInOrg.find((b) => normalizeName(b.name) === target);
    if (existing) {
      return existing.id;
    }
    const created = await this.brandsRepository.save(this.brandsRepository.create({ organizationId, name: trimmed }));
    return created.id;
  }

  private async getOrCreateColor(organizationId: number, name: string): Promise<number | undefined> {
    const trimmed = name.trim();
    if (!trimmed) {
      return undefined;
    }
    const target = normalizeName(trimmed);
    const colorsInOrg = await this.colorsRepository.find({ where: { organizationId } });
    const existing = colorsInOrg.find((c) => normalizeName(c.name) === target);
    if (existing) {
      return existing.id;
    }
    const created = await this.colorsRepository.save(this.colorsRepository.create({ organizationId, name: trimmed }));
    return created.id;
  }

  private async listModelsForOrg(organizationId: number) {
    const rows = await this.framesRepository
      .createQueryBuilder('frame')
      .select('DISTINCT frame.modelNumber', 'modelNumber')
      .where('frame.organizationId = :organizationId', { organizationId })
      .getRawMany<{ modelNumber: string }>();
    return dedupeByNormalizedName(rows.map((r) => r.modelNumber).filter(Boolean));
  }

  private async getOrCreateFrame(
    organizationId: number,
    brandId: number,
    modelNumber: string,
    colorId: number | undefined,
    frameType: string | undefined,
  ): Promise<Frame> {
    const trimmedModel = modelNumber.trim();
    const targetModel = normalizeName(trimmedModel);
    const trimmedType = frameType?.trim();
    const targetType = trimmedType ? normalizeName(trimmedType) : undefined;

    const candidates = await this.framesRepository.find({
      where: { organizationId, brandId },
      relations: { brand: true, color: true },
    });
    const existing = candidates.find(
      (f) =>
        normalizeName(f.modelNumber) === targetModel &&
        (f.colorId ?? null) === (colorId ?? null) &&
        (f.frameType ? normalizeName(f.frameType) : undefined) === targetType,
    );
    if (existing) {
      return existing;
    }

    const created = this.framesRepository.create({
      organizationId,
      brandId,
      modelNumber: trimmedModel,
      colorId,
      frameType: trimmedType || undefined,
    });
    const saved = await this.framesRepository.save(created);
    return this.framesRepository.findOneOrFail({ where: { id: saved.id }, relations: { brand: true, color: true } });
  }

  private async upsertStock(branchId: number, frameId: number, qty: number, price: number, threshold: number) {
    const existing = await this.stocksRepository.findOne({ where: { branchId, frameId } });
    if (existing) {
      existing.qty += qty;
      existing.price = price;
      existing.threshold = threshold;
      return this.stocksRepository.save(existing);
    }
    const created = this.stocksRepository.create({ branchId, frameId, qty, price, threshold });
    return this.stocksRepository.save(created);
  }

  private toResponse(stock: Stock) {
    const frame = stock.frame;
    return {
      id: stock.id,
      frameId: frame.id,
      brand: frame.brand.name,
      modelNumber: frame.modelNumber,
      color: frame.color?.name,
      frameType: frame.frameType,
      qty: stock.qty,
      price: stock.price,
      threshold: stock.threshold,
      branchId: stock.branchId,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    };
  }

  async create(userId: number, dto: CreateFrameDto) {
    const { organizationId, branchId } = await this.getContext(userId);
    const brandId = await this.getOrCreateBrand(organizationId, dto.brand);
    const colorId = dto.color ? await this.getOrCreateColor(organizationId, dto.color) : undefined;
    const frame = await this.getOrCreateFrame(organizationId, brandId, dto.modelNumber, colorId, dto.frameType);
    const stock = await this.upsertStock(branchId, frame.id, dto.qty, dto.price, dto.threshold ?? 5);
    return this.toResponse({ ...stock, frame });
  }

  async findAll(userId: number) {
    const { branchId } = await this.getContext(userId);
    const stocks = await this.stocksRepository.find({
      where: { branchId },
      relations: { frame: { brand: true, color: true } },
      order: { createdAt: 'DESC' },
    });
    return stocks.map((stock) => this.toResponse(stock));
  }

  private async findOneStock(userId: number, id: number) {
    const { branchId } = await this.getContext(userId);
    const stock = await this.stocksRepository.findOne({
      where: { id, branchId },
      relations: { frame: { brand: true, color: true } },
    });
    if (!stock) {
      throw new NotFoundException('Frame not found');
    }
    return stock;
  }

  async findOne(userId: number, id: number) {
    return this.toResponse(await this.findOneStock(userId, id));
  }

  async update(userId: number, id: number, dto: UpdateFrameDto) {
    const stock = await this.findOneStock(userId, id);
    const { organizationId } = await this.getContext(userId);
    const { brand, modelNumber, color, frameType, qty, price, threshold } = dto;

    const needsNewFrame = brand !== undefined || modelNumber !== undefined || color !== undefined || frameType !== undefined;
    if (needsNewFrame) {
      const brandId = brand ? await this.getOrCreateBrand(organizationId, brand) : stock.frame.brandId;
      const colorId = color !== undefined ? await this.getOrCreateColor(organizationId, color) : stock.frame.colorId;
      const resolvedModelNumber = modelNumber ?? stock.frame.modelNumber;
      const resolvedFrameType = frameType ?? stock.frame.frameType;
      const frame = await this.getOrCreateFrame(organizationId, brandId, resolvedModelNumber, colorId, resolvedFrameType);
      stock.frameId = frame.id;
      stock.frame = frame;
    }

    if (qty !== undefined) stock.qty = qty;
    if (price !== undefined) stock.price = price;
    if (threshold !== undefined) stock.threshold = threshold;

    const saved = await this.stocksRepository.save(stock);
    return this.toResponse(
      await this.stocksRepository.findOneOrFail({ where: { id: saved.id }, relations: { frame: { brand: true, color: true } } }),
    );
  }

  async remove(userId: number, id: number) {
    const stock = await this.findOneStock(userId, id);
    await this.stocksRepository.remove(stock);
    return { id };
  }

  async listBrands(userId: number) {
    const { organizationId } = await this.getContext(userId);
    const brands = await this.brandsRepository.find({ where: { organizationId }, order: { name: 'ASC' } });
    return brands.map((b) => b.name);
  }

  async listModels(userId: number) {
    const { organizationId } = await this.getContext(userId);
    return this.listModelsForOrg(organizationId);
  }

  async listColors(userId: number) {
    const { organizationId } = await this.getContext(userId);
    const colors = await this.colorsRepository.find({ where: { organizationId }, order: { name: 'ASC' } });
    return colors.map((c) => c.name);
  }
}
