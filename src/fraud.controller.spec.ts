import { Test, TestingModule } from '@nestjs/testing';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';

describe('FraudController', () => {
  let controller: FraudController;

  const mockFraudService = {
    evaluate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FraudController],
      providers: [
        {
          provide: FraudService,
          useValue: mockFraudService,
        },
      ],
    }).compile();

    controller = module.get<FraudController>(FraudController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFraudScore', () => {
    it('should return approved: true when fraud score is below threshold', async () => {
      const request = {
        id: 'tx-test',
        transaction: {
          amount: 50,
          installments: 1,
          requested_at: '2026-03-11T18:45:53Z',
        },
        customer: {
          avg_amount: 100,
          tx_count_24h: 2,
          known_merchants: ['MERC-001'],
        },
        merchant: {
          id: 'MERC-001',
          mcc: '5411',
          avg_amount: 80,
        },
        terminal: {
          is_online: false,
          card_present: true,
          km_from_home: 10,
        },
        last_transaction: null,
      };

      mockFraudService.evaluate.mockResolvedValue({
        approved: true,
        fraud_score: 0.0,
      });

      const result = await controller.getFraudScore(request);

      expect(result).toEqual({ approved: true, fraud_score: 0.0 });
      expect(mockFraudService.evaluate).toHaveBeenCalledWith(request);
    });

    it('should return approved: false when fraud score is at or above threshold', async () => {
      const request = {
        id: 'tx-fraud',
        transaction: {
          amount: 9000,
          installments: 10,
          requested_at: '2026-03-14T05:15:12Z',
        },
        customer: {
          avg_amount: 80,
          tx_count_24h: 20,
          known_merchants: ['MERC-001'],
        },
        merchant: {
          id: 'MERC-999',
          mcc: '7802',
          avg_amount: 50,
        },
        terminal: {
          is_online: false,
          card_present: true,
          km_from_home: 950,
        },
        last_transaction: null,
      };

      mockFraudService.evaluate.mockResolvedValue({
        approved: false,
        fraud_score: 1.0,
      });

      const result = await controller.getFraudScore(request);

      expect(result).toEqual({ approved: false, fraud_score: 1.0 });
    });
  });
});
