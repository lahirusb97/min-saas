import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Frame } from './entities/frame.entity';
import { Brand } from './entities/brand.entity';
import { FrameModel } from './entities/frame-model.entity';
import { Color } from './entities/color.entity';
import { Stock } from './entities/stock.entity';
import { Branch } from '../auth/entities/branch.entity';
import { Organization } from '../auth/entities/organization.entity';
import { CreateFrameDto } from './dto/create-frame.dto';
import { UpdateFrameDto } from './dto/update-frame.dto';

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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
    @InjectRepository(FrameModel) private readonly modelsRepository: Repository<FrameModel>,
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

  private async findBrandIdByName(organizationId: number, name: string): Promise<number | undefined> {
    const target = normalizeName(name);
    if (!target) {
      return undefined;
    }
    const brandsInOrg = await this.brandsRepository.find({ where: { organizationId } });
    return brandsInOrg.find((b) => normalizeName(b.name) === target)?.id;
  }

  /** Models belong to a brand: get-or-create is scoped by (organizationId, brandId) so the same model name can exist under different brands. */
  private async getOrCreateModel(organizationId: number, brandId: number, name: string): Promise<number> {
    const trimmed = name.trim();
    const target = normalizeName(trimmed);
    const modelsForBrand = await this.modelsRepository.find({ where: { organizationId, brandId } });
    const existing = modelsForBrand.find((m) => normalizeName(m.name) === target);
    if (existing) {
      return existing.id;
    }
    const created = await this.modelsRepository.save(this.modelsRepository.create({ organizationId, brandId, name: trimmed }));
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

  private async getOrCreateFrame(
    organizationId: number,
    brandId: number,
    modelId: number,
    colorId: number | undefined,
    frameType: string | undefined,
  ): Promise<Frame> {
    const trimmedType = frameType?.trim();
    const targetType = trimmedType ? normalizeName(trimmedType) : undefined;

    const candidates = await this.framesRepository.find({
      where: { organizationId, brandId, modelId },
      relations: { brand: true, model: true, color: true },
    });
    const existing = candidates.find(
      (f) =>
        (f.colorId ?? null) === (colorId ?? null) &&
        (f.frameType ? normalizeName(f.frameType) : undefined) === targetType,
    );
    if (existing) {
      return existing;
    }

    const created = this.framesRepository.create({
      organizationId,
      brandId,
      modelId,
      colorId,
      frameType: trimmedType || undefined,
    });
    const saved = await this.framesRepository.save(created);
    return this.framesRepository.findOneOrFail({ where: { id: saved.id }, relations: { brand: true, model: true, color: true } });
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
      modelNumber: frame.model.name,
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
    const modelId = await this.getOrCreateModel(organizationId, brandId, dto.modelNumber);
    const colorId = dto.color ? await this.getOrCreateColor(organizationId, dto.color) : undefined;
    const frame = await this.getOrCreateFrame(organizationId, brandId, modelId, colorId, dto.frameType);
    const stock = await this.upsertStock(branchId, frame.id, dto.qty, dto.price, dto.threshold ?? 5);
    return this.toResponse({ ...stock, frame });
  }

  async findAll(userId: number) {
    const { branchId } = await this.getContext(userId);
    const stocks = await this.stocksRepository.find({
      where: { branchId },
      relations: { frame: { brand: true, model: true, color: true } },
      order: { createdAt: 'DESC' },
    });
    return stocks.map((stock) => this.toResponse(stock));
  }

  private async findOneStock(userId: number, id: number) {
    const { branchId } = await this.getContext(userId);
    const stock = await this.stocksRepository.findOne({
      where: { id, branchId },
      relations: { frame: { brand: true, model: true, color: true } },
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
      const modelId = modelNumber ? await this.getOrCreateModel(organizationId, brandId, modelNumber) : stock.frame.modelId;
      const resolvedFrameType = frameType ?? stock.frame.frameType;
      const frame = await this.getOrCreateFrame(organizationId, brandId, modelId, colorId, resolvedFrameType);
      stock.frameId = frame.id;
      stock.frame = frame;
    }

    if (qty !== undefined) stock.qty = qty;
    if (price !== undefined) stock.price = price;
    if (threshold !== undefined) stock.threshold = threshold;

    const saved = await this.stocksRepository.save(stock);
    return this.toResponse(
      await this.stocksRepository.findOneOrFail({ where: { id: saved.id }, relations: { frame: { brand: true, model: true, color: true } } }),
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

  /** Model numbers belong to a brand: pass `brand` to only list models already recorded under that brand. */
  async listModels(userId: number, brand?: string) {
    const { organizationId } = await this.getContext(userId);
    if (brand?.trim()) {
      const brandId = await this.findBrandIdByName(organizationId, brand);
      if (!brandId) {
        return [];
      }
      const models = await this.modelsRepository.find({ where: { organizationId, brandId }, order: { name: 'ASC' } });
      return models.map((m) => m.name);
    }
    const models = await this.modelsRepository.find({ where: { organizationId }, order: { name: 'ASC' } });
    return models.map((m) => m.name);
  }

  async listColors(userId: number) {
    const { organizationId } = await this.getContext(userId);
    const colors = await this.colorsRepository.find({ where: { organizationId }, order: { name: 'ASC' } });
    return colors.map((c) => c.name);
  }

  /**
   * Chained frame selection: brand -> code (model) -> color, each step narrowed to
   * in-stock (qty > 0) items only. Every response includes brands/codes/colors for
   * whichever step is reachable given the params supplied, plus the matching items.
   */
  async browseFrames(userId: number, brand?: string, code?: string, color?: string) {
    const { branchId } = await this.getContext(userId);
    const stocks = await this.stocksRepository.find({
      where: { branchId },
      relations: { frame: { brand: true, model: true, color: true } },
    });
    const inStock = stocks.filter((s) => s.qty > 0);

    const brandNorm = brand?.trim() ? normalizeName(brand) : undefined;
    const codeNorm = code?.trim() ? normalizeName(code) : undefined;
    const colorNorm = color?.trim() ? normalizeName(color) : undefined;

    const matchesBrand = (s: Stock) => !brandNorm || normalizeName(s.frame.brand.name) === brandNorm;
    const matchesCode = (s: Stock) => !codeNorm || normalizeName(s.frame.model.name) === codeNorm;
    const matchesColor = (s: Stock) => !colorNorm || (!!s.frame.color && normalizeName(s.frame.color.name) === colorNorm);

    const brands = Array.from(
      new Set(inStock.filter(matchesCode).filter(matchesColor).map((s) => s.frame.brand.name)),
    ).sort();

    const codes = brandNorm
      ? Array.from(new Set(inStock.filter(matchesBrand).filter(matchesColor).map((s) => s.frame.model.name))).sort()
      : [];

    const colors = brandNorm && codeNorm
      ? Array.from(
          new Set(
            inStock
              .filter(matchesBrand)
              .filter(matchesCode)
              .map((s) => s.frame.color?.name)
              .filter((n): n is string => !!n),
          ),
        ).sort()
      : [];

    const items = inStock.filter(matchesBrand).filter(matchesCode).filter(matchesColor).map((s) => this.toResponse(s));

    return { brands, codes, colors, items };
  }
}
