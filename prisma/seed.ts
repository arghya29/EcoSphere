/**
 * Seed script — populates EMISSION_FACTOR with realistic, sourced factors
 * and (optionally) one demo organization with sample data, so a freshly
 * deployed instance isn't empty.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient, EmissionScope, TransportMode, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FACTORS = [
  // Scope 1 — direct fuel combustion (kg CO2e per litre), DEFRA 2024 style figures
  { category: 'diesel', scope: EmissionScope.SCOPE_1, value: 2.68, unit: 'kgCO2e/litre', source: 'DEFRA 2024 (indicative)' },
  { category: 'petrol', scope: EmissionScope.SCOPE_1, value: 2.31, unit: 'kgCO2e/litre', source: 'DEFRA 2024 (indicative)' },
  { category: 'natural_gas', scope: EmissionScope.SCOPE_1, value: 0.18, unit: 'kgCO2e/kWh', source: 'DEFRA 2024 (indicative)' },
  { category: 'lpg', scope: EmissionScope.SCOPE_1, value: 1.51, unit: 'kgCO2e/litre', source: 'DEFRA 2024 (indicative)' },

  // Scope 2 — purchased electricity (kg CO2e per kWh), grid-average indicative figures
  { category: 'electricity_UK-grid', scope: EmissionScope.SCOPE_2, value: 0.207, unit: 'kgCO2e/kWh', source: 'UK grid average (indicative)' },
  { category: 'electricity_US-grid', scope: EmissionScope.SCOPE_2, value: 0.386, unit: 'kgCO2e/kWh', source: 'EPA eGRID national average (indicative)' },
  { category: 'electricity_EU-grid', scope: EmissionScope.SCOPE_2, value: 0.255, unit: 'kgCO2e/kWh', source: 'EU-27 average (indicative)' },
  { category: 'electricity_renewable', scope: EmissionScope.SCOPE_2, value: 0.02, unit: 'kgCO2e/kWh', source: 'Renewable PPA (indicative residual)' },

  // Scope 3 — freight, kg CO2e per tonne-km, by mode
  { category: 'truck_freight', scope: EmissionScope.SCOPE_3, value: 0.096, unit: 'kgCO2e/tonne-km', source: 'GHG Protocol / EcoInvent (indicative)' },
  { category: 'rail_freight', scope: EmissionScope.SCOPE_3, value: 0.028, unit: 'kgCO2e/tonne-km', source: 'GHG Protocol / EcoInvent (indicative)' },
  { category: 'sea_freight', scope: EmissionScope.SCOPE_3, value: 0.012, unit: 'kgCO2e/tonne-km', source: 'IMO / EcoInvent (indicative)' },
  { category: 'air_freight', scope: EmissionScope.SCOPE_3, value: 0.602, unit: 'kgCO2e/tonne-km', source: 'ICAO / EcoInvent (indicative)' },
];

async function main() {
  console.log('Seeding emission factors…');
  for (const f of FACTORS) {
    await prisma.emissionFactor.upsert({
      where: { category: f.category },
      update: f,
      create: f,
    });
  }

  const demoEmail = 'demo@ecosphere.dev';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (existing) {
    console.log('Demo user already exists, skipping demo org seed.');
    return;
  }

  console.log('Creating demo user + organization + sample data…');
  const passwordHash = await bcrypt.hash('EcoSphereDemo123!', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Demo Analyst',
      email: demoEmail,
      passwordHash,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: 'Demo Organization',
      region: 'UK-EU',
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  });

  const supplierA = await prisma.supplier.create({
    data: { organizationId: org.id, name: 'Supplier A — Electronics', location: 'Shenzhen, CN', category: 'Electronics', latitude: 22.5431, longitude: 114.0579 },
  });
  const supplierB = await prisma.supplier.create({
    data: { organizationId: org.id, name: 'Supplier B — Packaging', location: 'Rotterdam, NL', category: 'Packaging', latitude: 51.9244, longitude: 4.4777 },
  });

  const factory = await prisma.facility.create({
    data: { organizationId: org.id, name: 'Factory A', type: 'Manufacturing', location: 'Manchester, UK', latitude: 53.4839, longitude: -2.2446 },
  });
  const warehouse = await prisma.facility.create({
    data: { organizationId: org.id, name: 'Warehouse B', type: 'Storage', location: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
  });

  const routeAirFromA = await prisma.route.create({
    data: { organizationId: org.id, originSupplierId: supplierA.id, destinationId: factory.id, mode: TransportMode.AIR, distanceKm: 8000 },
  });
  const routeTruckToWarehouse = await prisma.route.create({
    data: { organizationId: org.id, originFacilityId: factory.id, destinationId: warehouse.id, mode: TransportMode.TRUCK, distanceKm: 320 },
  });
  const routeSeaFromB = await prisma.route.create({
    data: { organizationId: org.id, originSupplierId: supplierB.id, destinationId: factory.id, mode: TransportMode.SEA, distanceKm: 450 },
  });

  const dieselFactor = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'diesel' } });
  const ukGridFactor = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'electricity_UK-grid' } });
  const airFactor = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'air_freight' } });
  const truckFactor = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'truck_freight' } });
  const seaFactor = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'sea_freight' } });

  await prisma.activity.createMany({
    data: [
      {
        organizationId: org.id,
        type: ActivityType.FUEL,
        facilityId: factory.id,
        amount: 500,
        unit: 'litre',
        factorId: dieselFactor.id,
        emissionsKg: 500 * dieselFactor.value,
        dateRecorded: new Date('2026-01-31'),
      },
      {
        organizationId: org.id,
        type: ActivityType.ELECTRICITY,
        facilityId: factory.id,
        amount: 12000,
        unit: 'kWh',
        factorId: ukGridFactor.id,
        emissionsKg: 12000 * ukGridFactor.value,
        dateRecorded: new Date('2026-01-31'),
      },
      {
        organizationId: org.id,
        type: ActivityType.FREIGHT,
        supplierId: supplierA.id,
        routeId: routeAirFromA.id,
        amount: 18 * 8000, // ~18 tonnes over 8000km
        unit: 'tonne-km',
        factorId: airFactor.id,
        emissionsKg: 18 * 8000 * airFactor.value,
        dateRecorded: new Date('2026-02-10'),
      },
      {
        organizationId: org.id,
        type: ActivityType.FREIGHT,
        routeId: routeTruckToWarehouse.id,
        amount: 22 * 320,
        unit: 'tonne-km',
        factorId: truckFactor.id,
        emissionsKg: 22 * 320 * truckFactor.value,
        dateRecorded: new Date('2026-02-12'),
      },
      {
        organizationId: org.id,
        type: ActivityType.FREIGHT,
        supplierId: supplierB.id,
        routeId: routeSeaFromB.id,
        amount: 30 * 450,
        unit: 'tonne-km',
        factorId: seaFactor.id,
        emissionsKg: 30 * 450 * seaFactor.value,
        dateRecorded: new Date('2026-02-08'),
      },
    ],
  });

  console.log('Seed complete. Demo login: demo@ecosphere.dev / EcoSphereDemo123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
