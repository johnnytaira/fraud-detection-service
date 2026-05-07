import { Test, TestingModule } from '@nestjs/testing';
import { FraudService } from './fraud.service';
import { FraudScoreRequestDto } from 'src/dto/fraud-score-request.dto';

const legitTransaction: FraudScoreRequestDto = {
  id: 'tx-1329056812',
  transaction: {
    amount: 41.12,
    installments: 2,
    requested_at: '2026-03-11T18:45:53Z',
  },
  customer: {
    avg_amount: 82.24,
    tx_count_24h: 3,
    known_merchants: ['MERC-003', 'MERC-016'],
  },
  merchant: {
    id: 'MERC-016',
    mcc: '5411',
    avg_amount: 60.25,
  },
  terminal: {
    is_online: false,
    card_present: true,
    km_from_home: 29.23,
  },
  last_transaction: null,
};

const fraudTransaction: FraudScoreRequestDto = {
  id: 'tx-3330991687',
  transaction: {
    amount: 9505.97,
    installments: 10,
    requested_at: '2026-03-14T05:15:12Z',
  },
  customer: {
    avg_amount: 81.28,
    tx_count_24h: 20,
    known_merchants: ['MERC-008', 'MERC-007', 'MERC-005'],
  },
  merchant: {
    id: 'MERC-068',
    mcc: '7802',
    avg_amount: 54.86,
  },
  terminal: {
    is_online: false,
    card_present: true,
    km_from_home: 952.27,
  },
  last_transaction: null,
};

describe('FraudService', () => {
  let service: FraudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FraudService],
    }).compile();

    service = module.get<FraudService>(FraudService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluate', () => {
    it('should approve a legitimate transaction with low fraud score', async () => {
      const result = await service.evaluate(legitTransaction);

      expect(result.approved).toBe(true);
      expect(result.fraud_score).toBeLessThan(0.6);
    });

    it('should reject a fraudulent transaction with high fraud score', async () => {
      const result = await service.evaluate(fraudTransaction);

      expect(result.approved).toBe(false);
      expect(result.fraud_score).toBeGreaterThanOrEqual(0.6);
    });

    it('should handle transaction with previous transaction data', async () => {
      const transactionWithHistory: FraudScoreRequestDto = {
        id: 'tx-test-with-history',
        transaction: {
          amount: 150.0,
          installments: 1,
          requested_at: '2026-03-11T20:23:35Z',
        },
        customer: {
          avg_amount: 200.0,
          tx_count_24h: 2,
          known_merchants: ['MERC-001', 'MERC-009'],
        },
        merchant: {
          id: 'MERC-001',
          mcc: '5411',
          avg_amount: 180.0,
        },
        terminal: {
          is_online: false,
          card_present: true,
          km_from_home: 5.0,
        },
        last_transaction: {
          timestamp: '2026-03-11T14:58:35Z',
          km_from_current: 18.86,
        },
      };

      const result = await service.evaluate(transactionWithHistory);

      expect(result).toHaveProperty('approved');
      expect(result).toHaveProperty('fraud_score');
      expect(result.fraud_score).toBeGreaterThanOrEqual(0);
      expect(result.fraud_score).toBeLessThanOrEqual(1);
    });

    it('should return fraud_score rounded to 1 decimal place', async () => {
      const result = await service.evaluate(legitTransaction);

      expect(result.fraud_score * 10).toBe(Math.round(result.fraud_score * 10));
    });
  });
});
