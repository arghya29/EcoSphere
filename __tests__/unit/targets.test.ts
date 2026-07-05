import { calculateActivityEmissions } from '@/lib/emissions';

describe('Target calculations', () => {
  it('correctly calculates percentage values for targets', () => {
    const currentValue = 45000;
    const targetValue = 50000;
    const percent = Math.min(100, Math.round((currentValue / targetValue) * 100));
    expect(percent).toBe(90);
  });

  it('handles targets when current emissions exceed the limit', () => {
    const currentValue = 60000;
    const targetValue = 50000;
    const percent = Math.min(100, Math.round((currentValue / targetValue) * 100));
    expect(percent).toBe(100);
    expect(currentValue > targetValue).toBe(true);
  });

  it('correctly calculates emissions under target conditions', () => {
    const amount = 1000;
    const factorValue = 2.5; // kgCO2e per unit
    const emissions = calculateActivityEmissions(amount, factorValue);
    expect(emissions).toBe(2500);
  });
});
