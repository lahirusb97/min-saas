import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, SourceType, LensSide } from './entities/order.entity';
import { OrderItem, OrderItemType } from './entities/order-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { VisionTest } from '../vision-tests/entities/vision-test.entity';
import { Stock } from '../frames/entities/stock.entity';
import { Lens } from '../lenses/entities/lens.entity';
import { Branch } from '../auth/entities/branch.entity';
import { Organization } from '../auth/entities/organization.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: jest.Mocked<Repository<Order>>;
  let orderItemsRepository: jest.Mocked<Repository<OrderItem>>;
  let customersRepository: jest.Mocked<Repository<Customer>>;
  let visionTestsRepository: jest.Mocked<Repository<VisionTest>>;
  let stocksRepository: jest.Mocked<Repository<Stock>>;
  let lensesRepository: jest.Mocked<Repository<Lens>>;
  let branchesRepository: jest.Mocked<Repository<Branch>>;
  let organizationsRepository: jest.Mocked<Repository<Organization>>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useFactory: mockRepository },
        { provide: getRepositoryToken(OrderItem), useFactory: mockRepository },
        { provide: getRepositoryToken(Customer), useFactory: mockRepository },
        { provide: getRepositoryToken(VisionTest), useFactory: mockRepository },
        { provide: getRepositoryToken(Stock), useFactory: mockRepository },
        { provide: getRepositoryToken(Lens), useFactory: mockRepository },
        { provide: getRepositoryToken(Branch), useFactory: mockRepository },
        { provide: getRepositoryToken(Organization), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    ordersRepository = module.get(getRepositoryToken(Order));
    orderItemsRepository = module.get(getRepositoryToken(OrderItem));
    customersRepository = module.get(getRepositoryToken(Customer));
    visionTestsRepository = module.get(getRepositoryToken(VisionTest));
    stocksRepository = module.get(getRepositoryToken(Stock));
    lensesRepository = module.get(getRepositoryToken(Lens));
    branchesRepository = module.get(getRepositoryToken(Branch));
    organizationsRepository = module.get(getRepositoryToken(Organization));
  });

  const setupContext = () => {
    organizationsRepository.findOne.mockResolvedValue({ id: 1, ownerId: 10 } as any);
    branchesRepository.findOne.mockResolvedValue({ id: 2, organizationId: 1 } as any);
  };

  describe('create', () => {
    it('should create an order and decrement stock quantity if source is INVENTORY', async () => {
      setupContext();
      customersRepository.findOne.mockResolvedValue({ id: 5 } as any);
      stocksRepository.findOne.mockResolvedValue({ id: 42, qty: 10, price: 100, threshold: 5 } as any);
      ordersRepository.count.mockResolvedValue(0);

      const savedOrder = { id: 100 } as any;
      ordersRepository.create.mockReturnValue(savedOrder);
      ordersRepository.save.mockResolvedValue(savedOrder);
      orderItemsRepository.create.mockReturnValue({} as any);

      ordersRepository.findOne.mockResolvedValue({
        id: 100,
        items: [
          {
            id: 1,
            itemType: OrderItemType.FRAME,
            sourceType: SourceType.INVENTORY,
            frameStockId: 42,
            qty: 1,
            price: 100,
            lineTotal: 100,
          },
        ],
        customer: { name: 'John Doe', phone: '123' },
      } as any);

      const dto: CreateOrderDto = {
        customerId: 5,
        frameSourceType: SourceType.INVENTORY,
        frameStockId: 42,
        framePrice: 100,
        lensSourceType: SourceType.MANUAL,
        lensSide: LensSide.BOTH,
        lensPrice: 0,
      };

      const result = await service.create(10, dto);

      expect(result.id).toBe(100);
      expect(stocksRepository.findOne).toHaveBeenCalledWith({ where: { id: 42, branchId: 2 } });
      expect(stocksRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 42, qty: 9 })
      );
    });
  });

  describe('update', () => {
    it('should revert old frame stock and decrement new frame stock', async () => {
      setupContext();
      
      const existingOrder = {
        id: 100,
        items: [
          {
            id: 1,
            itemType: OrderItemType.FRAME,
            sourceType: SourceType.INVENTORY,
            frameStockId: 42,
            qty: 1,
          },
        ],
        customer: { name: 'John Doe', phone: '123' },
      } as any;

      ordersRepository.findOne.mockResolvedValueOnce(existingOrder);
      
      const oldStock = { id: 42, qty: 10 } as any;
      const newStock = { id: 43, qty: 5 } as any;
      
      stocksRepository.findOne.mockImplementation(async (options: any) => {
        if (options.where.id === 42) return oldStock;
        if (options.where.id === 43) return newStock;
        return null;
      });

      ordersRepository.save.mockResolvedValue(existingOrder);
      orderItemsRepository.create.mockReturnValue({} as any);

      ordersRepository.findOne.mockResolvedValueOnce({
        ...existingOrder,
        items: [
          {
            id: 1,
            itemType: OrderItemType.FRAME,
            sourceType: SourceType.INVENTORY,
            frameStockId: 43,
            qty: 1,
          },
        ],
      });

      const dto: UpdateOrderDto = {
        frameSourceType: SourceType.INVENTORY,
        frameStockId: 43,
      };

      await service.update(10, 100, dto);

      expect(stocksRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 42, qty: 11 })
      );
      expect(stocksRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 43, qty: 4 })
      );
    });
  });

  describe('remove', () => {
    it('should revert stock quantity if order had INVENTORY frame', async () => {
      setupContext();
      
      const existingOrder = {
        id: 100,
        items: [
          {
            id: 1,
            itemType: OrderItemType.FRAME,
            sourceType: SourceType.INVENTORY,
            frameStockId: 42,
            qty: 1,
          },
        ],
        customer: { name: 'John Doe', phone: '123' },
      } as any;

      ordersRepository.findOne.mockResolvedValue(existingOrder);
      
      const stock = { id: 42, qty: 10 } as any;
      stocksRepository.findOne.mockResolvedValue(stock);

      await service.remove(10, 100);

      expect(stocksRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 42, qty: 11 })
      );
      expect(ordersRepository.remove).toHaveBeenCalledWith(existingOrder);
    });
  });
});
