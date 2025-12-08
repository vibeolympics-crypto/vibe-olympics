import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  it('renders badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders default variant', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-[var(--primary)]');
  });

  it('renders secondary variant', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-[var(--bg-elevated)]');
  });

  it('renders outline variant', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('border');
  });

  it('renders success variant', () => {
    render(<Badge variant="success" data-testid="badge">Success</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-[var(--accent-green)]');
  });

  it('renders warning variant', () => {
    render(<Badge variant="warning" data-testid="badge">Warning</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-[var(--accent-amber)]');
  });

  it('renders danger variant', () => {
    render(<Badge variant="danger" data-testid="badge">Danger</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-[var(--accent-red)]');
  });

  it('renders free variant', () => {
    render(<Badge variant="free" data-testid="badge">Free</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-[var(--accent-green)]');
  });

  it('renders premium variant', () => {
    render(<Badge variant="premium" data-testid="badge">Premium</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-gradient-to-r');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class" data-testid="badge">Custom</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-class');
  });
});
