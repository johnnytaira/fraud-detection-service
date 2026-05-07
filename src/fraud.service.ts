import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { FraudScoreRequestDto } from 'src/dto/fraud-score-request.dto';
import { FraudScoreResponseDto } from 'src/dto/fraud-score-response.dto';

interface NormalizationConfig {
  max_amount: number;
  max_installments: number;
  amount_vs_avg_ratio: number;
  max_minutes: number;
  max_km: number;
  max_tx_count_24h: number;
  max_merchant_avg_amount: number;
}

interface ReferenceEntry {
  vector: number[];
  label: 'fraud' | 'legit';
}

@Injectable()
export class FraudService {
  private normalization: NormalizationConfig;
  private mccRisk: Record<string, number>;
  private references: ReferenceEntry[];
  private readonly k = 5;
  private readonly approvalThreshold = 0.6;

  constructor() {
    const basePath = this.getBasePath();
    const resourcePath = (file: string) => join(basePath, 'resources', file);
    this.normalization = JSON.parse(
      readFileSync(resourcePath('normalization.json'), 'utf-8'),
    ) as NormalizationConfig;
    this.mccRisk = JSON.parse(
      readFileSync(resourcePath('mcc_risk.json'), 'utf-8'),
    ) as Record<string, number>;
    const referencesRaw = JSON.parse(
      readFileSync(resourcePath('references.json.gz'), 'utf-8'),
    ) as ReferenceEntry[];
    this.references = referencesRaw;
  }

  private getBasePath(): string {
    const cwd = process.cwd();
    const resourcePath = join(cwd, 'resources', 'normalization.json');
    try {
      readFileSync(resourcePath, 'utf-8');
      return cwd;
    } catch {
      return join(dirname(__dirname), '..');
    }
  }

  evaluate(request: FraudScoreRequestDto): Promise<FraudScoreResponseDto> {
    const vector = this.vectorize(request);
    const neighbors = this.findNearestNeighbors(vector);
    const fraudCount = neighbors.filter((n) => n.label === 'fraud').length;
    const fraudScore = fraudCount / this.k;
    const approved = fraudScore < this.approvalThreshold;

    return Promise.resolve({
      approved,
      fraud_score: Math.round(fraudScore * 10) / 10,
    });
  }

  private vectorize(req: FraudScoreRequestDto): number[] {
    const n = this.normalization;
    const requestedAt = new Date(req.transaction.requested_at);

    const amount = req.transaction.amount / n.max_amount;
    const installments = req.transaction.installments / n.max_installments;
    const amountVsAvg =
      req.transaction.amount / req.customer.avg_amount / n.amount_vs_avg_ratio;
    const hourOfDay = requestedAt.getUTCHours() / 23;
    const dayOfWeek = this.getDayOfWeek(requestedAt) / 6;

    let minutesSinceLastTx: number;
    let kmFromLastTx: number;

    if (req.last_transaction === null) {
      minutesSinceLastTx = -1;
      kmFromLastTx = -1;
    } else {
      const lastAt = new Date(req.last_transaction.timestamp);
      const diffMs = requestedAt.getTime() - lastAt.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      minutesSinceLastTx = diffMinutes / n.max_minutes;
      kmFromLastTx = req.last_transaction.km_from_current / n.max_km;
    }

    const kmFromHome = req.terminal.km_from_home / n.max_km;
    const txCount24h = req.customer.tx_count_24h / n.max_tx_count_24h;
    const isOnline = req.terminal.is_online ? 1 : 0;
    const cardPresent = req.terminal.card_present ? 1 : 0;
    const unknownMerchant = req.customer.known_merchants.includes(
      req.merchant.id,
    )
      ? 0
      : 1;
    const mccRiskValue = this.mccRisk[req.merchant.mcc] ?? 0.5;
    const merchantAvgAmount =
      req.merchant.avg_amount / n.max_merchant_avg_amount;

    return [
      this.clamp(amount),
      this.clamp(installments),
      this.clamp(amountVsAvg),
      hourOfDay,
      dayOfWeek,
      minutesSinceLastTx,
      this.clamp(kmFromLastTx),
      this.clamp(kmFromHome),
      this.clamp(txCount24h),
      isOnline,
      cardPresent,
      unknownMerchant,
      mccRiskValue,
      this.clamp(merchantAvgAmount),
    ];
  }

  private findNearestNeighbors(vector: number[]): ReferenceEntry[] {
    const distances = this.references.map((ref) => ({
      entry: ref,
      distance: this.euclideanDistance(vector, ref.vector),
    }));

    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, this.k).map((d) => d.entry);
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === -1 || b[i] === -1) continue;
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  private clamp(value: number): number {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  private getDayOfWeek(date: Date): number {
    const day = date.getUTCDay();
    return day === 0 ? 6 : day - 1;
  }
}
