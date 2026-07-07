import { calculateRiskScore } from '@/lib/risk-engine';

describe('Supply Chain Risk Engine', () => {
  it('correctly calculates LOW risk score for low footprint without air freight', () => {
    const result = calculateRiskScore(5000, 0, 0);
    expect(result.score).toBe(0);
    expect(result.level).toBe('LOW');
    expect(result.flags.length).toBe(0);
    expect(result.recommendations.length).toBe(0);
  });

  it('triggers medium/high risk flags for high air freight dependency', () => {
    const result = calculateRiskScore(50000, 20000, 0); // 40% air ratio
    expect(result.score).toBe(55); // 15 + 40
    expect(result.level).toBe('MEDIUM');
    expect(result.flags).toContain('Severe air freight carbon dependency (exceeds 30% of total)');
  });

  it('triggers high risk level for cumulative triggers', () => {
    const result = calculateRiskScore(120000, 50000, 70000);
    expect(result.score).toBe(100);
    expect(result.level).toBe('HIGH');
  });
});
