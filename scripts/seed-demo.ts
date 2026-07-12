import { PrismaClient, EmissionScope, TransportMode, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEMO_USER_EMAIL, DEMO_ORG_NAME, DEMO_USER_PASSWORD } from './demo-constants';

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
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_SEED) {
    throw new Error('Refusing to run seed-demo.ts against a production environment without ALLOW_DEMO_SEED=true');
  }

  console.log('Generating password hash…');
  const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 10);

  console.log('Starting seed transaction…');
  await prisma.$transaction(
    async (tx) => {
      console.log('Ensuring emission factors are seeded…');
      for (const f of FACTORS) {
        await tx.emissionFactor.upsert({
          where: { category: f.category },
          update: f,
          create: f,
        });
      }

      // Idempotency: Clean reset of existing demo seed user and organization if they exist
      console.log('Checking for existing demo seed dataset to clean up…');
      const orgDelete = await tx.organization.deleteMany({
        where: { name: DEMO_ORG_NAME },
      });
      if (orgDelete.count > 0) {
        console.log(`Deleted ${orgDelete.count} existing organization(s).`);
      }

      const userDelete = await tx.user.deleteMany({
        where: { email: DEMO_USER_EMAIL },
      });
      if (userDelete.count > 0) {
        console.log(`Deleted ${userDelete.count} existing user(s).`);
      }

      console.log('Seeding new demo dataset…');

      const user = await tx.user.create({
        data: {
          name: 'Demo Seed Contributor',
          email: DEMO_USER_EMAIL,
          passwordHash,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: DEMO_ORG_NAME,
          region: 'UK-EU',
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });

      console.log(`Created organization (${org.id}) owned by demo seed user (${user.id})`);

      // 3 Suppliers
      const supplier1 = await tx.supplier.create({
        data: {
          organizationId: org.id,
          name: 'Global Tech Parts',
          location: 'Tokyo, JP',
          category: 'Electronics',
          latitude: 35.6762,
          longitude: 139.6503,
        },
      });

      const supplier2 = await tx.supplier.create({
        data: {
          organizationId: org.id,
          name: 'Eco-Friendly Pack Co',
          location: 'Berlin, DE',
          category: 'Packaging',
          latitude: 52.5200,
          longitude: 13.4050,
        },
      });

      const supplier3 = await tx.supplier.create({
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
      const facility1 = await tx.facility.create({
        data: {
          organizationId: org.id,
          name: 'Primary Assembly Plant',
          type: 'Manufacturing',
          location: 'Austin, US',
          latitude: 30.2672,
          longitude: -97.7431,
      },
    });

    const facility2 = await tx.facility.create({
      data: {
        organizationId: org.id,
        name: 'European Distribution Hub',
        type: 'Storage',
        location: 'Paris, FR',
        latitude: 48.8566,
        longitude: 2.3522,
      },
    });

    const facility3 = await tx.facility.create({
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
    const route1 = await tx.route.create({
      data: {
        organizationId: org.id,
        originSupplierId: supplier1.id,
        destinationId: facility1.id,
        mode: TransportMode.AIR,
        distanceKm: 10000.0,
      },
    });

    const route2 = await tx.route.create({
      data: {
        organizationId: org.id,
        originSupplierId: supplier2.id,
        destinationId: facility2.id,
        mode: TransportMode.RAIL,
        distanceKm: 850.0,
      },
    });

    const route3 = await tx.route.create({
      data: {
        organizationId: org.id,
        originSupplierId: supplier3.id,
        destinationId: facility3.id,
        mode: TransportMode.TRUCK,
        distanceKm: 1300.0,
      },
    });

    console.log('Created 3 routes.');

    // Fetch emission factors in a single batched query to link them to activities (excluding unused electricityUK-grid)
    const targetCategories = [
      'diesel',
      'petrol',
      'natural_gas',
      'lpg',
      'electricity_US-grid',
      'electricity_EU-grid',
      'electricity_renewable',
      'air_freight',
      'rail_freight',
      'truck_freight',
    ];

    const factorsList = await tx.emissionFactor.findMany({
      where: {
        category: {
          in: targetCategories,
        },
      },
    });

    const factorsMap = new Map(factorsList.map((f) => [f.category, f]));

    const getFactorOrThrow = (category: string) => {
      const factor = factorsMap.get(category);
      if (!factor) {
        throw new Error(`Required emission factor "${category}" was not found in the database.`);
      }
      return factor;
    };

    const diesel = getFactorOrThrow('diesel');
    const petrol = getFactorOrThrow('petrol');
    const naturalGas = getFactorOrThrow('natural_gas');
    const lpg = getFactorOrThrow('lpg');
    const electricityUS = getFactorOrThrow('electricity_US-grid');
    const electricityEU = getFactorOrThrow('electricity_EU-grid');
    const electricityRenewable = getFactorOrThrow('electricity_renewable');
    const airFreight = getFactorOrThrow('air_freight');
    const railFreight = getFactorOrThrow('rail_freight');
    const truckFreight = getFactorOrThrow('truck_freight');

    // 10 Activities spread across last 6 months (Jan 2026 to Jun 2026)
    await tx.activity.createMany({
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
  },
  {
    maxWait: 15000, // default is 2000ms
    timeout: 30000, // default is 5000ms
  }
);

  console.log('Demo seed dataset seeded successfully!');
  console.log(`Login Email: ${DEMO_USER_EMAIL}`);
  console.log('Password: (Refer to README or DEMO_SEED_PASSWORD environment variable)');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
