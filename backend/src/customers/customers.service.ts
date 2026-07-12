import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Organization } from '../auth/entities/organization.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Organization) private readonly organizationsRepository: Repository<Organization>,
  ) {}

  async getOrganizationId(userId: number): Promise<number> {
    const organization = await this.organizationsRepository.findOne({ where: { ownerId: userId } });
    if (!organization) {
      throw new NotFoundException('No organization found for this account');
    }
    return organization.id;
  }

  private toResponse(customer: Customer) {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      nic: customer.nic,
      address: customer.address,
      dob: customer.dob,
      note: customer.note,
      organizationId: customer.organizationId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  /** Creates a new customer, or updates and returns the existing one matched by phone within the organization. */
  async upsert(userId: number, dto: CreateCustomerDto) {
    const organizationId = await this.getOrganizationId(userId);
    const phone = dto.phone.trim();
    const existing = await this.customersRepository.findOne({ where: { organizationId, phone } });

    if (existing) {
      existing.name = dto.name.trim();
      existing.nic = dto.nic?.trim() || existing.nic;
      existing.address = dto.address?.trim() ?? existing.address;
      existing.dob = dto.dob ?? existing.dob;
      existing.note = dto.note?.trim() ?? existing.note;
      const saved = await this.customersRepository.save(existing);
      return this.toResponse(saved);
    }

    const created = this.customersRepository.create({
      organizationId,
      name: dto.name.trim(),
      phone,
      nic: dto.nic?.trim(),
      address: dto.address?.trim(),
      dob: dto.dob,
      note: dto.note?.trim(),
    });
    const saved = await this.customersRepository.save(created);
    return this.toResponse(saved);
  }

  async findAll(userId: number, search?: string) {
    const organizationId = await this.getOrganizationId(userId);
    const query = this.customersRepository
      .createQueryBuilder('customer')
      .where('customer.organizationId = :organizationId', { organizationId })
      .orderBy('customer.createdAt', 'DESC');

    if (search?.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(customer.name) LIKE :term OR customer.phone LIKE :term OR LOWER(customer.nic) LIKE :term)',
        { term },
      );
    }

    const customers = await query.getMany();
    return customers.map((c) => this.toResponse(c));
  }

  private async findOneEntity(userId: number, id: number) {
    const organizationId = await this.getOrganizationId(userId);
    const customer = await this.customersRepository.findOne({ where: { id, organizationId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findOne(userId: number, id: number) {
    return this.toResponse(await this.findOneEntity(userId, id));
  }

  async update(userId: number, id: number, dto: UpdateCustomerDto) {
    const customer = await this.findOneEntity(userId, id);
    if (dto.name !== undefined) customer.name = dto.name.trim();
    if (dto.phone !== undefined) customer.phone = dto.phone.trim();
    if (dto.nic !== undefined) customer.nic = dto.nic.trim();
    if (dto.address !== undefined) customer.address = dto.address.trim();
    if (dto.dob !== undefined) customer.dob = dto.dob;
    if (dto.note !== undefined) customer.note = dto.note.trim();
    const saved = await this.customersRepository.save(customer);
    return this.toResponse(saved);
  }
}
