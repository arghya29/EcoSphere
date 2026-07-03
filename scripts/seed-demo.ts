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
  console.log('Ensuring emission factors are seeded…');
  for (const f of FACTORS) {
async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_SEED) {
    throw new Error('Refusing to run seed-demo.ts against a production environment without ALLOW_DEMO_SEED=true');
  }

  console.log('Ensuring emission factors are seeded…');
  for (const f of FACTORS) {
    await prisma.emissionFactor.upsert({
      where: { category: f.category },
      update: f,
      create: f,
    });
  }

  const demoEmail = 'demo-seed-user@ecosphere.dev';
  const orgName = 'Seed Demo Organization';

  // Idempotency: Clean reset of existing demo seed user and organization if they exist
  console.log('Checking for existing demo seed dataset to clean up…');
  const existingOrg = await prisma.organization.findFirst({
    where: { name: orgName },
  });
  if (existingOrg) {
    console.log(`Deleting existing organization "${existingOrg.name}"…`);
    await prisma.organization.delete({
      where: { id: existingOrg.id },
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });
  if (existingUser) {
    console.log(`Deleting existing user "${existingUser.email}"…`);
    await prisma.user.delete({
      where: { id: existingUser.id },
    });
  }

  console.log('Seeding new demo dataset…');

  const passwordHash = await bcrypt.hash('DemoSeedUser123!', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Demo Seed Contributor',
      email: demoEmail,
      passwordHash,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
    },
  });

  console.log(`Created organization "${org.name}" owned by "${user.email}"`);

  // 3 Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Global Tech Parts',
      location: 'Tokyo, JP',
      category: 'Electronics',
      latitude: 35.6762,
      longitude: 139.6503,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Eco-Friendly Pack Co',
      location: 'Berlin, DE',
      category: 'Packaging',
      latitude: 52.5200,
      longitude: 13.4050,
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Logistics Supply Corp',
      location: 'Chicago, US',
      category: 'Raw Materials',
      latitude: 41.8781,
      longitude: -87.6298,
    },
  });

  console.log('Created 3 suppliers.');

  // 3 Facilities
  const facility1 = await prisma.facility.create({
    data: {
      organizationId: org.id,
      name: 'Primary Assembly Plant',
      type: 'Manufacturing',
      location: 'Austin, US',
      latitude: 30.2672,
      longitude: -97.7431,
    },
  });

  const facility2 = await prisma.facility.create({
    data: {
      organizationId: org.id,
      name: 'European Distribution Hub',
      type: 'Storage',
      location: 'Paris, FR',
      latitude: 48.8566,
      longitude: 2.3522,
    },
  });

  const facility3 = await prisma.facility.create({
    data: {
      organizationId: org.id,
      name: 'Global Headquarters',
      type: 'Office',
      location: 'New York, US',
      latitude: 40.7128,
      longitude: -74.0060,
    },
  });

  console.log('Created 3 facilities.');

  // 3 Routes connecting suppliers to facilities
  const route1 = await prisma.route.create({
    data: {
      organizationId: org.id,
      originSupplierId: supplier1.id,
      destinationId: facility1.id,
      mode: TransportMode.AIR,
      distanceKm: 10000.0,
    },
  });

  const route2 = await prisma.route.create({
    data: {
      organizationId: org.id,
      originSupplierId: supplier2.id,
      destinationId: facility2.id,
      mode: TransportMode.RAIL,
      distanceKm: 850.0,
    },
  });

  const route3 = await prisma.route.create({
    data: {
      organizationId: org.id,
      originSupplierId: supplier3.id,
      destinationId: facility3.id,
      mode: TransportMode.TRUCK,
      distanceKm: 1300.0,
    },
  });

  console.log('Created 3 routes.');

  // Fetch emission factors to link them to activities
  const diesel = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'diesel' } });
  const petrol = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'petrol' } });
  const naturalGas = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'natural_gas' } });
  const lpg = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'lpg' } });
  const electricityUS = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'electricity_US-grid' } });
  const electricityUK = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'electricity_UK-grid' } });
  const electricityEU = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'electricity_EU-grid' } });
  const electricityRenewable = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'electricity_renewable' } });
  const airFreight = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'air_freight' } });
  const railFreight = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'rail_freight' } });
  const truckFreight = await prisma.emissionFactor.findUniqueOrThrow({ where: { category: 'truck_freight' } });

  // 10 Activities spread across last 6 months (Jan 2026 to Jun 2026)
  await prisma.activity.createMany({
    data: [
      {
        organizationId: org.id,
        type: ActivityType.FUEL,
        facilityId: facility1.id,
        amount: 800.0,
        unit: 'litre',
        factorId: diesel.id,
        emissionsKg: 800.0 * diesel.value,
        dateRecorded: new Date('2026-01-15T00:00:00Z'),
      },
      {
        organizationId: org.id,
        type: ActivityType.FUEL,
        facilityId: facility2.id,
        amount: 450.0,
        unit: 'litre',
        factorId: petrol.id,
        emissionsKg: 450.0 * petrol.value,
        dateRecorded: new Date('2026-02-10T00:00:00Z'),
      },
      {
        organizationId: org.id,
        type: ActivityType.FUEL,
        facilityId: facility3.id,
        amount: 15000.0,
        unit: 'kWh',
        factorId: naturalGas.id,
        emissionsKg: 15000.0 * naturalGas.value,
        dateRecorded: new Date('2026-02-25T00:00:00Z'),
      },
      {
        organizationId: org.id,
        type: ActivityType.ELECTRICITY,
        facilityId: facility1.id,
        amount: 25000.0,
        unit: 'kWh',
        factorId: electricityUS.id,
        emissionsKg: 25000.0 * electricityUS.value,
        dateRecorded: new Date('2026-03-05T00:00:00Z'),
      },
      {
        organizationId: org.id,
        type: ActivityType.ELECTRICITY,
        facilityId: facility2.id,
        amount: 18000.0,
        unit: 'kWh',
        factorId: electricityEU.id,
        emissionsKg: 18000.0 * electricityEU.value,
        dateRecorded: new Date('2026-03-20T00:00:00Z'),
      },
      {
        organizationId: org.id,
        type: ActivityType.ELECTRICITY,
        facilityId: facility3.id,
        amount: 5000.0,
        unit: 'kWh',
        factorId: electricityRenewable.id,
        emissionsKg: 5000.0 * electricityRenewable.value,
        dateRecorded: new Date('2026-04-12T00:00:00Z'),
      },
      {
        organizationId: org.id,
        type: ActivityType.FREIGHT,
        supplierId: supplier1.id,
        routeId: route1.id,
        amount: 15000.0, // e.g. 1.5 tonnes * 10000 km
        unit: 'tonne-km',
        factorId: airFreight.id,
        emissionsKg: 15000.0 * airFreight.value,
        dateRecorded: new Date('2026-04-28T00:00:00Z'),
      },
      {
        organizationId: org.id,
        type: ActivityType.FREIGHT,
        supplierId: supplier2.id,
        routeId: route2.id,
        amount: 4250.0, // e.g. 5 tonnes * 850 km
        unit: 'tonne-km',
        factorId: railFreight.id,
        emissionsKg: 4250.0 * railFreight.value,
        dateRecorded: new Date('2026-05-15T00:00:00Z'),
      },
      {
        organizationId: org.id,
        type: ActivityType.FREIGHT,
        supplierId: supplier3.id,
        routeId: route3.id,
        amount: 6500.0, // e.g. 5 tonnes * 1300 km
        unit: 'tonne-km',
        factorId: truckFreight.id,
        emissionsKg: 6500.0 * truckFreight.value,
        dateRecorded: new Date('2026-06-02T00:00:00Z'),
      },
      {
        organizationId: org.id,
        type: ActivityType.FUEL,
        facilityId: facility1.id,
        amount: 600.0,
        unit: 'litre',
        factorId: lpg.id,
        emissionsKg: 600.0 * lpg.value,
        dateRecorded: new Date('2026-06-20T00:00:00Z'),
      },
    ],
  });

  console.log('Seeded 10 activities.');
  console.log('Demo seed dataset seeded successfully!');
  console.log(`Login Credentials: ${demoEmail} / DemoSeedUser123!`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
