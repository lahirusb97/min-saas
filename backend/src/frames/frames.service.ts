import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Frame } from './entities/frame.entity';
import { Brand } from './entities/brand.entity';
import { Color } from './entities/color.entity';
import { Branch } from '../auth/entities/branch.entity';
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

@Injectable()
export class FramesService {
  constructor(
    @InjectRepository(Frame) private readonly framesRepository: Repository<Frame>,
    @InjectRepository(Brand) private readonly brandsRepository: Repository<Brand>,
    @InjectRepository(Color) private readonly colorsRepository: Repository<Color>,
    @InjectRepository(Branch) private readonly branchesRepository: Repository<Branch>,
  ) {}

  private async getBranchId(userId: string) {
    const branch = await this.branchesRepository.findOne({ where: { ownerId: userId } });
    if (!branch) {
      throw new NotFoundException('No branch found for this account');
    }
    return branch.id;
  }

  private async getOrCreateBrand(branchId: string, name: string): Promise<number> {
    const trimmed = name.trim();
    const target = normalizeName(trimmed);
    const brandsInBranch = await this.brandsRepository.find({ where: { branchId } });
    const existing = brandsInBranch.find((b) => normalizeName(b.name) === target);
    if (existing) {
      return existing.id;
    }
    const created = await this.brandsRepository.save(this.brandsRepository.create({ branchId, name: trimmed }));
    return created.id;
  }

  private async getOrCreateColor(branchId: string, name: string): Promise<number | undefined> {
    const trimmed = name.trim();
    if (!trimmed) {
      return undefined;
    }
    const target = normalizeName(trimmed);
    const colorsInBranch = await this.colorsRepository.find({ where: { branchId } });
    const existing = colorsInBranch.find((c) => normalizeName(c.name) === target);
    if (existing) {
      return existing.id;
    }
    const created = await this.colorsRepository.save(this.colorsRepository.create({ branchId, name: trimmed }));
    return created.id;
  }

  private async resolveModelNumber(branchId: string, modelNumber: string): Promise<string> {
    const trimmed = modelNumber.trim();
    const target = normalizeName(trimmed);
    const existingModels = await this.listModelsForBranch(branchId);
    const existing = existingModels.find((m) => normalizeName(m) === target);
    return existing ?? trimmed;
  }

  private async listModelsForBranch(branchId: string) {
    const rows = await this.framesRepository
      .createQueryBuilder('frame')
      .select('DISTINCT frame.modelNumber', 'modelNumber')
      .where('frame.branchId = :branchId', { branchId })
      .getRawMany<{ modelNumber: string }>();
    return dedupeByNormalizedName(rows.map((r) => r.modelNumber).filter(Boolean));
  }

  private toResponse(frame: Frame) {
    const { brand, color, ...rest } = frame;
    return { ...rest, brand: brand.name, color: color?.name };
  }

  async create(userId: string, dto: CreateFrameDto) {
    const branchId = await this.getBranchId(userId);
    const brandId = await this.getOrCreateBrand(branchId, dto.brand);
    const modelNumber = await this.resolveModelNumber(branchId, dto.modelNumber);
    const colorId = dto.color ? await this.getOrCreateColor(branchId, dto.color) : undefined;
    const { brand: _brand, modelNumber: _modelNumber, color: _color, ...rest } = dto;
    const frame = this.framesRepository.create({ ...rest, modelNumber, brandId, colorId, branchId });
    const saved = await this.framesRepository.save(frame);
    return this.toResponse(
      await this.framesRepository.findOneOrFail({ where: { id: saved.id }, relations: { brand: true, color: true } }),
    );
  }

  async findAll(userId: string) {
    const branchId = await this.getBranchId(userId);
    const frames = await this.framesRepository.find({
      where: { branchId },
      relations: { brand: true, color: true },
      order: { createdAt: 'DESC' },
    });
    return frames.map((frame) => this.toResponse(frame));
  }

  private async findOneEntity(userId: string, id: string) {
    const branchId = await this.getBranchId(userId);
    const frame = await this.framesRepository.findOne({
      where: { id, branchId },
      relations: { brand: true, color: true },
    });
    if (!frame) {
      throw new NotFoundException('Frame not found');
    }
    return frame;
  }

  async findOne(userId: string, id: string) {
    return this.toResponse(await this.findOneEntity(userId, id));
  }

  async update(userId: string, id: string, dto: UpdateFrameDto) {
    const frame = await this.findOneEntity(userId, id);
    const { brand, modelNumber, color, ...rest } = dto;
    Object.assign(frame, rest);
    if (brand) {
      frame.brandId = await this.getOrCreateBrand(frame.branchId, brand);
    }
    if (modelNumber) {
      frame.modelNumber = await this.resolveModelNumber(frame.branchId, modelNumber);
    }
    if (color) {
      frame.colorId = await this.getOrCreateColor(frame.branchId, color);
    }
    const saved = await this.framesRepository.save(frame);
    return this.toResponse(
      await this.framesRepository.findOneOrFail({ where: { id: saved.id }, relations: { brand: true, color: true } }),
    );
  }

  async remove(userId: string, id: string) {
    const frame = await this.findOneEntity(userId, id);
    await this.framesRepository.remove(frame);
    return { id };
  }

  async listBrands(userId: string) {
    const branchId = await this.getBranchId(userId);
    const brands = await this.brandsRepository.find({ where: { branchId }, order: { name: 'ASC' } });
    return brands.map((b) => b.name);
  }

  async listModels(userId: string) {
    const branchId = await this.getBranchId(userId);
    return this.listModelsForBranch(branchId);
  }

  async listColors(userId: string) {
    const branchId = await this.getBranchId(userId);
    const colors = await this.colorsRepository.find({ where: { branchId }, order: { name: 'ASC' } });
    return colors.map((c) => c.name);
  }
}
