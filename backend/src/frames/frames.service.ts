import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Frame } from './entities/frame.entity';
import { Brand } from './entities/brand.entity';
import { Branch } from '../auth/entities/branch.entity';
import { CreateFrameDto } from './dto/create-frame.dto';
import { UpdateFrameDto } from './dto/update-frame.dto';

@Injectable()
export class FramesService {
  constructor(
    @InjectRepository(Frame) private readonly framesRepository: Repository<Frame>,
    @InjectRepository(Brand) private readonly brandsRepository: Repository<Brand>,
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
    const existing = await this.brandsRepository.findOne({ where: { branchId, name: ILike(trimmed) } });
    if (existing) {
      return existing.id;
    }
    const created = await this.brandsRepository.save(this.brandsRepository.create({ branchId, name: trimmed }));
    return created.id;
  }

  private toResponse(frame: Frame) {
    const { brand, ...rest } = frame;
    return { ...rest, brand: brand.name };
  }

  async create(userId: string, dto: CreateFrameDto) {
    const branchId = await this.getBranchId(userId);
    const brandId = await this.getOrCreateBrand(branchId, dto.brand);
    const { brand: _brand, ...rest } = dto;
    const frame = this.framesRepository.create({ ...rest, brandId, branchId });
    const saved = await this.framesRepository.save(frame);
    return this.toResponse(await this.framesRepository.findOneOrFail({ where: { id: saved.id }, relations: { brand: true } }));
  }

  async findAll(userId: string) {
    const branchId = await this.getBranchId(userId);
    const frames = await this.framesRepository.find({
      where: { branchId },
      relations: { brand: true },
      order: { createdAt: 'DESC' },
    });
    return frames.map((frame) => this.toResponse(frame));
  }

  private async findOneEntity(userId: string, id: string) {
    const branchId = await this.getBranchId(userId);
    const frame = await this.framesRepository.findOne({ where: { id, branchId }, relations: { brand: true } });
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
    const { brand, ...rest } = dto;
    Object.assign(frame, rest);
    if (brand) {
      frame.brandId = await this.getOrCreateBrand(frame.branchId, brand);
    }
    const saved = await this.framesRepository.save(frame);
    return this.toResponse(await this.framesRepository.findOneOrFail({ where: { id: saved.id }, relations: { brand: true } }));
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
    const rows = await this.framesRepository
      .createQueryBuilder('frame')
      .select('DISTINCT frame.modelNumber', 'modelNumber')
      .where('frame.branchId = :branchId', { branchId })
      .getRawMany<{ modelNumber: string }>();
    return rows.map((r) => r.modelNumber).filter(Boolean);
  }

  async listColors(userId: string) {
    const branchId = await this.getBranchId(userId);
    const rows = await this.framesRepository
      .createQueryBuilder('frame')
      .select('DISTINCT frame.color', 'color')
      .where('frame.branchId = :branchId', { branchId })
      .getRawMany<{ color: string }>();
    return rows.map((r) => r.color).filter(Boolean);
  }
}
