/**
 * Carbon risk assessment and scoring engine.
 * Evaluates emission volumes, air freight intensity ratios, and electricity grid dependencies.
 */

export interface RiskScoreResult {
  score: number; // 0 to 100
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendations: string[];
}

export function calculateRiskScore(
  totalEmissions: number,
  airEmissions: number,
  electricityEmissions: number
): RiskScoreResult {
  const flags: string[] = [];
  const recommendations: string[] = [];

  let score = 0;

  // 1. Total emission volume check
  if (totalEmissions > 100000) {
    score += 30;
    flags.push('High overall carbon footprint exceeding 100t CO₂e');
    recommendations.push(
      'Implement carbon offsets or source local materials to decrease total footprint.'
    );
  } else if (totalEmissions > 20000) {
    score += 15;
    flags.push('Moderate emission volumes detected');
  }

  // 2. High intensity shipping (Air Freight dependency)
  const airRatio = totalEmissions > 0 ? airEmissions / totalEmissions : 0;
  if (airRatio > 0.3) {
    score += 40;
    flags.push('Severe air freight carbon dependency (exceeds 30% of total)');
    recommendations.push(
      'Transition high-priority shipments from air to sea or rail where delivery times permit.'
    );
  } else if (airRatio > 0.1) {
    score += 20;
    flags.push('Moderate shipping intensity ratios');
    recommendations.push(
      'Consolidate cargo to utilize sea freight options and decrease air reliance.'
    );
  }

  // 3. Grid dependency (Scope 2)
  const gridRatio = totalEmissions > 0 ? electricityEmissions / totalEmissions : 0;
  if (gridRatio > 0.5) {
    score += 30;
    flags.push('High reliance on regional electricity grid footprints (exceeds 50% of total)');
    recommendations.push(
      'Investigate power purchase agreements (PPAs) for renewable electricity or install solar systems.'
    );
  } else if (gridRatio > 0.2) {
    score += 15;
    flags.push('Moderate electricity grid footprint exposure');
  }

  score = Math.min(100, score);

  let level: RiskScoreResult['level'] = 'LOW';
  if (score > 60) {
    level = 'HIGH';
  } else if (score > 30) {
    level = 'MEDIUM';
  }

  return {
    score,
    level,
    flags,
    recommendations,
  };
}
