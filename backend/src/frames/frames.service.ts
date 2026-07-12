import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Frame } from './entities/frame.entity';
import { Branch } from '../auth/entities/branch.entity';
import { CreateFrameDto } from './dto/create-frame.dto';
import { UpdateFrameDto } from './dto/update-frame.dto';

@Injectable()
export class FramesService {
  constructor(
    @InjectRepository(Frame) private readonly framesRepository: Repository<Frame>,
    @InjectRepository(Branch) private readonly branchesRepository: Repository<Branch>,
  ) {}

  private async getBranchId(userId: string) {
    const branch = await this.branchesRepository.findOne({ where: { ownerId: userId } });
    if (!branch) {
      throw new NotFoundException('No branch found for this account');
    }
    return branch.id;
  }

  async create(userId: string, dto: CreateFrameDto) {
    const branchId = await this.getBranchId(userId);
    const frame = this.framesRepository.create({ ...dto, branchId });
    return this.framesRepository.save(frame);
  }

  async findAll(userId: string) {
    const branchId = await this.getBranchId(userId);
    return this.framesRepository.find({ where: { branchId }, order: { createdAt: 'DESC' } });
  }

  async findOne(userId: string, id: string) {
    const branchId = await this.getBranchId(userId);
    const frame = await this.framesRepository.findOne({ where: { id, branchId } });
    if (!frame) {
      throw new NotFoundException('Frame not found');
    }
    return frame;
  }

  async update(userId: string, id: string, dto: UpdateFrameDto) {
    const frame = await this.findOne(userId, id);
    Object.assign(frame, dto);
    return this.framesRepository.save(frame);
  }

  async remove(userId: string, id: string) {
    const frame = await this.findOne(userId, id);
    await this.framesRepository.remove(frame);
    return { id };
  }
}
