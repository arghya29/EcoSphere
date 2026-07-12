import * as React from 'react';
import { render, act } from '@testing-library/react';
import { ToastProgress } from '@/components/ui/toast-progress';

jest.useFakeTimers();

describe('ToastProgress', () => {
  it('renders a progress bar', () => {
    const onComplete = jest.fn();
    const { container } = render(
      <ToastProgress durationMs={3000} paused={false} onComplete={onComplete} variant="info" />
    );
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeInTheDocument();
  });

  it('calls onComplete after duration elapses', () => {
    const onComplete = jest.fn();
    render(
      <ToastProgress durationMs={500} paused={false} onComplete={onComplete} variant="success" />
    );

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete when paused', () => {
    const onComplete = jest.fn();
    render(
      <ToastProgress durationMs={500} paused={true} onComplete={onComplete} variant="error" />
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
