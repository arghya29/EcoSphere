import * as React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast, MAX_TOASTS } from '@/components/ui/ToastProvider';

jest.useFakeTimers();

function TestHarness() {
  const { toast } = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Success title', 'Success description')}>
        Show Success
      </button>
      <button onClick={() => toast.error('Error title', 'Error description')}>
        Show Error
      </button>
      <button onClick={() => toast.info('Info title')}>
        Show Info
      </button>
    </div>
  );
}

describe('ToastProvider', () => {
  it('renders children without crashing', () => {
    render(
      <ToastProvider>
        <div>Child</div>
      </ToastProvider>
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('shows a success toast when triggered', () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success title')).toBeInTheDocument();
    expect(screen.getByText('Success description')).toBeInTheDocument();
  });

  it('shows an error toast when triggered', () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error title')).toBeInTheDocument();
    expect(screen.getByText('Error description')).toBeInTheDocument();
  });

  it('limits the number of visible toasts to MAX_TOASTS', () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>
    );

    for (let i = 0; i < MAX_TOASTS + 2; i++) {
      fireEvent.click(screen.getByText('Show Info'));
    }

    const visibleToasts = screen.getAllByText('Info title');
    expect(visibleToasts.length).toBeLessThanOrEqual(MAX_TOASTS);
  });

  it('throws when useToast is used outside ToastProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestHarness />)).toThrow('useToast must be used within a ToastProvider');
    consoleError.mockRestore();
  });
});
