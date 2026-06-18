/**
 * Hardcoded demo scenarios for the landing-page interactive demo.
 * Pure client-side data — no server calls, per spec, so visitors can
 * explore without signing up.
 */

export interface DemoNode {
  id: string;
  label: string;
  kind: 'supplier' | 'factory' | 'customer';
  x: number;
  y: number;
}

export interface DemoEdge {
  id: string;
  source: string;
  target: string;
  mode: 'Truck' | 'Rail' | 'Air' | 'Sea';
  kgCO2e: number;
}

export interface DemoScenario {
  id: string;
  label: string;
  nodes: DemoNode[];
  edges: DemoEdge[];
  scope1: number;
  scope2: number;
  scope3: number;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'electronics',
    label: 'Consumer Electronics',
    nodes: [
      { id: 's1', label: 'Component Supplier — Shenzhen', kind: 'supplier', x: 40, y: 60 },
      { id: 's2', label: 'Battery Supplier — Busan', kind: 'supplier', x: 40, y: 200 },
      { id: 'f1', label: 'Assembly Plant — Hanoi', kind: 'factory', x: 280, y: 130 },
      { id: 'c1', label: 'Distribution — Rotterdam', kind: 'customer', x: 520, y: 130 },
    ],
    edges: [
      { id: 'e1', source: 's1', target: 'f1', mode: 'Air', kgCO2e: 18500 },
      { id: 'e2', source: 's2', target: 'f1', mode: 'Sea', kgCO2e: 3200 },
      { id: 'e3', source: 'f1', target: 'c1', mode: 'Sea', kgCO2e: 4100 },
    ],
    scope1: 6200,
    scope2: 9800,
    scope3: 25800,
  },
  {
    id: 'food',
    label: 'Food Supply Chain',
    nodes: [
      { id: 's1', label: 'Cocoa Farm Cooperative — Accra', kind: 'supplier', x: 40, y: 60 },
      { id: 's2', label: 'Sugar Mill — São Paulo', kind: 'supplier', x: 40, y: 200 },
      { id: 'f1', label: 'Processing Facility — Antwerp', kind: 'factory', x: 280, y: 130 },
      { id: 'c1', label: 'Retail Distribution — Frankfurt', kind: 'customer', x: 520, y: 130 },
    ],
    edges: [
      { id: 'e1', source: 's1', target: 'f1', mode: 'Sea', kgCO2e: 4400 },
      { id: 'e2', source: 's2', target: 'f1', mode: 'Sea', kgCO2e: 3100 },
      { id: 'e3', source: 'f1', target: 'c1', mode: 'Truck', kgCO2e: 1800 },
    ],
    scope1: 4100,
    scope2: 5300,
    scope3: 9300,
  },
  {
    id: 'apparel',
    label: 'Apparel & Textiles',
    nodes: [
      { id: 's1', label: 'Cotton Mill — Ahmedabad', kind: 'supplier', x: 40, y: 60 },
      { id: 's2', label: 'Dye House — Dhaka', kind: 'supplier', x: 40, y: 200 },
      { id: 'f1', label: 'Garment Factory — Ho Chi Minh City', kind: 'factory', x: 280, y: 130 },
      { id: 'c1', label: 'Regional Warehouse — Hamburg', kind: 'customer', x: 520, y: 130 },
    ],
    edges: [
      { id: 'e1', source: 's1', target: 'f1', mode: 'Truck', kgCO2e: 2600 },
      { id: 'e2', source: 's2', target: 'f1', mode: 'Truck', kgCO2e: 1900 },
      { id: 'e3', source: 'f1', target: 'c1', mode: 'Air', kgCO2e: 21200 },
    ],
    scope1: 3000,
    scope2: 4700,
    scope3: 25700,
  },
];
