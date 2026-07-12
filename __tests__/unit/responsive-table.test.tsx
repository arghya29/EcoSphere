import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponsiveTable } from '@/components/ui/responsive-table';

interface TestItem {
  id: string;
  name: string;
  value: number;
}

const columns = [
  { key: 'name', header: 'Name', render: (item: TestItem) => item.name },
  { key: 'value', header: 'Value', render: (item: TestItem) => item.value.toString() },
];

const data: TestItem[] = [
  { id: '1', name: 'Alpha', value: 100 },
  { id: '2', name: 'Beta', value: 200 },
];

describe('ResponsiveTable', () => {
  it('renders table headers and data', () => {
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    render(
      <ResponsiveTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyMessage="Nothing here."
      />
    );

    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(
      <ResponsiveTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        loading={true}
      />
    );

    const loadingRegion = screen.getByLabelText('Loading table data');
    expect(loadingRegion).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('handles selection callbacks', () => {
    const onToggle = jest.fn();
    const onToggleAll = jest.fn();

    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
        selection={{
          selected: new Set(),
          onToggle,
          onToggleAll,
          allSelected: false,
        }}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    fireEvent.click(checkboxes[1]);
    expect(onToggle).toHaveBeenCalledWith('1');
  });
});
