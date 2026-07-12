import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, LensSide, SourceType } from './entities/order.entity';
import { OrderItem, OrderItemType } from './entities/order-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { VisionTest } from '../vision-tests/entities/vision-test.entity';
import { Stock } from '../frames/entities/stock.entity';
import { Lens } from '../lenses/entities/lens.entity';
import { Branch } from '../auth/entities/branch.entity';
import { Organization } from '../auth/entities/organization.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

interface Context {
  organizationId: number;
  branchId: number;
}

interface ResolvedItems {
  frame: {
    sourceType: SourceType;
    frameStockId?: number;
    brand?: string;
    code?: string;
    color?: string;
    price: number;
  };
  lens?: {
    sourceType: SourceType;
    lensId?: number;
    side: LensSide;
    factory?: string;
    typeName?: string;
    coating?: string;
    price: number;
    qty: number;
  };
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Customer) private readonly customersRepository: Repository<Customer>,
    @InjectRepository(VisionTest) private readonly visionTestsRepository: Repository<VisionTest>,
    @InjectRepository(Stock) private readonly stocksRepository: Repository<Stock>,
    @InjectRepository(Lens) private readonly lensesRepository: Repository<Lens>,
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

  private async validateReferences(
    context: Context,
    dto: { visionTestId?: number; frameStockId?: number; lensId?: number },
  ) {
    if (dto.visionTestId !== undefined) {
      const visionTest = await this.visionTestsRepository.findOne({ where: { id: dto.visionTestId, branchId: context.branchId } });
      if (!visionTest) {
        throw new NotFoundException('Vision test not found');
      }
    }
    if (dto.frameStockId !== undefined) {
      const stock = await this.stocksRepository.findOne({ where: { id: dto.frameStockId, branchId: context.branchId } });
      if (!stock) {
        throw new NotFoundException('Frame stock not found');
      }
    }
    if (dto.lensId !== undefined) {
      const lens = await this.lensesRepository.findOne({ where: { id: dto.lensId, organizationId: context.organizationId } });
      if (!lens) {
        throw new NotFoundException('Lens not found');
      }
    }
  }

  /** Merges the incoming (possibly partial) dto with the order's current items, so update() can be called with only the fields that changed. */
  private resolveItems(dto: Partial<CreateOrderDto>, existing?: { frame?: OrderItem; lens?: OrderItem }): ResolvedItems {
    const frame = {
      sourceType: dto.frameSourceType ?? existing?.frame?.sourceType ?? SourceType.MANUAL,
      frameStockId: dto.frameStockId ?? existing?.frame?.frameStockId,
      brand: dto.frameBrand ?? existing?.frame?.brand,
      code: dto.frameCode ?? existing?.frame?.code,
      color: dto.frameColor ?? existing?.frame?.color,
      price: dto.framePrice ?? existing?.frame?.price ?? 0,
    };

    const lensSide = dto.lensSide ?? existing?.lens?.side ?? LensSide.BOTH;
    const lensPrice = dto.lensPrice ?? existing?.lens?.price ?? 0;
    const lensId = dto.lensId ?? existing?.lens?.lensId;
    const lensFactory = dto.lensFactory ?? existing?.lens?.brand;
    const lensTypeName = dto.lensTypeName ?? existing?.lens?.code;
    const lensCoating = dto.lensCoating ?? existing?.lens?.color;
    const lensSourceType = dto.lensSourceType ?? existing?.lens?.sourceType ?? SourceType.MANUAL;

    const hasLens = lensPrice > 0 || !!lensId || !!lensFactory || !!lensTypeName || !!lensCoating;

    return {
      frame,
      lens: hasLens
        ? {
            sourceType: lensSourceType,
            lensId,
            side: lensSide,
            factory: lensFactory,
            typeName: lensTypeName,
            coating: lensCoating,
            price: lensPrice,
            qty: lensSide === LensSide.BOTH ? 2 : 1,
          }
        : undefined,
    };
  }

  private computeTotals(items: ResolvedItems, discount: number, payment: number) {
    const frameLineTotal = items.frame.price;
    const lensLineTotal = items.lens ? items.lens.price * items.lens.qty : 0;
    const subTotal = frameLineTotal + lensLineTotal;
    const total = Math.max(0, subTotal - discount);
    const balance = Math.max(0, total - payment);
    return { subTotal, total, balance };
  }

  private async saveItems(orderId: number, items: ResolvedItems) {
    await this.orderItemsRepository.delete({ orderId });

    const rows: OrderItem[] = [
      this.orderItemsRepository.create({
        orderId,
        itemType: OrderItemType.FRAME,
        sourceType: items.frame.sourceType,
        frameStockId: items.frame.frameStockId,
        brand: items.frame.brand,
        code: items.frame.code,
        color: items.frame.color,
        price: items.frame.price,
        qty: 1,
        lineTotal: items.frame.price,
      }),
    ];

    if (items.lens) {
      rows.push(
        this.orderItemsRepository.create({
          orderId,
          itemType: OrderItemType.LENS,
          sourceType: items.lens.sourceType,
          lensId: items.lens.lensId,
          side: items.lens.side,
          brand: items.lens.factory,
          code: items.lens.typeName,
          color: items.lens.coating,
          price: items.lens.price,
          qty: items.lens.qty,
          lineTotal: items.lens.price * items.lens.qty,
        }),
      );
    }

    await this.orderItemsRepository.save(rows);
  }

  private async generateInvoiceNo(branchId: number): Promise<string> {
    const count = await this.ordersRepository.count({ where: { branchId } });
    return String(count + 1).padStart(4, '0');
  }

  private toResponse(order: Order) {
    const { customer, visionTest, items, ...rest } = order;
    return {
      ...rest,
      items: (items ?? []).map((item) => ({
        id: item.id,
        itemType: item.itemType,
        sourceType: item.sourceType,
        frameStockId: item.frameStockId,
        lensId: item.lensId,
        side: item.side,
        brand: item.brand,
        code: item.code,
        color: item.color,
        price: item.price,
        qty: item.qty,
        lineTotal: item.lineTotal,
      })),
    };
  }

  async create(userId: number, dto: CreateOrderDto) {
    const context = await this.getContext(userId);

    const customer = await this.customersRepository.findOne({ where: { id: dto.customerId, organizationId: context.organizationId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    await this.validateReferences(context, dto);

    const items = this.resolveItems(dto);
    const discount = dto.discount ?? 0;
    const payment = dto.payment ?? 0;
    const { subTotal, total, balance } = this.computeTotals(items, discount, payment);
    const invoiceNo = await this.generateInvoiceNo(context.branchId);

    const order = this.ordersRepository.create({
      organizationId: context.organizationId,
      branchId: context.branchId,
      invoiceNo,
      customerId: dto.customerId,
      visionTestId: dto.visionTestId,
      prescriptionNote: dto.prescriptionNote,
      subTotal,
      discount,
      total,
      payment,
      balance,
      dueDate: dto.dueDate,
      status: dto.status,
    });
    const saved = await this.ordersRepository.save(order);
    await this.saveItems(saved.id, items);

    return this.toResponse(await this.findOneEntity(userId, saved.id));
  }

  async findAll(userId: number) {
    const { branchId } = await this.getContext(userId);
    const orders = await this.ordersRepository.find({
      where: { branchId },
      relations: { customer: true, items: true },
      order: { createdAt: 'DESC' },
    });
    return orders.map((order) => ({ ...this.toResponse(order), customerName: order.customer.name, customerPhone: order.customer.phone }));
  }

  private async findOneEntity(userId: number, id: number) {
    const { branchId } = await this.getContext(userId);
    const order = await this.ordersRepository.findOne({ where: { id, branchId }, relations: { customer: true, items: true } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findOne(userId: number, id: number) {
    const order = await this.findOneEntity(userId, id);
    return { ...this.toResponse(order), customerName: order.customer.name, customerPhone: order.customer.phone };
  }

  async update(userId: number, id: number, dto: UpdateOrderDto) {
    const order = await this.findOneEntity(userId, id);
    const context = await this.getContext(userId);
    await this.validateReferences(context, dto);

    const existingFrame = order.items.find((item) => item.itemType === OrderItemType.FRAME);
    const existingLens = order.items.find((item) => item.itemType === OrderItemType.LENS);
    const items = this.resolveItems(dto, { frame: existingFrame, lens: existingLens });

    order.visionTestId = dto.visionTestId ?? order.visionTestId;
    order.prescriptionNote = dto.prescriptionNote ?? order.prescriptionNote;
    order.dueDate = dto.dueDate ?? order.dueDate;
    order.status = dto.status ?? order.status;

    const discount = dto.discount ?? order.discount;
    const payment = dto.payment ?? order.payment;
    const { subTotal, total, balance } = this.computeTotals(items, discount, payment);
    order.discount = discount;
    order.payment = payment;
    order.subTotal = subTotal;
    order.total = total;
    order.balance = balance;

    const saved = await this.ordersRepository.save(order);
    await this.saveItems(saved.id, items);

    return this.toResponse(await this.findOneEntity(userId, saved.id));
  }

  async remove(userId: number, id: number) {
    const order = await this.findOneEntity(userId, id);
    await this.ordersRepository.remove(order);
    return { id };
  }
}
