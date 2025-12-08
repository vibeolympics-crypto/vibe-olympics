import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">🔍</span>;
    render(<Input icon={<TestIcon />} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders disabled input', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders different input types', () => {
    render(<Input type="email" placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toHaveAttribute('type', 'email');
  });

  it('applies error styles when error prop is provided', () => {
    render(<Input error="Error message" placeholder="Test input" />);
    const input = screen.getByPlaceholderText('Test input');
    expect(input).toHaveClass('border-[var(--accent-red)]');
  });

  it('applies icon padding when icon is provided', () => {
    const TestIcon = () => <span>🔍</span>;
    render(<Input icon={<TestIcon />} placeholder="With icon" />);
    const input = screen.getByPlaceholderText('With icon');
    expect(input).toHaveClass('pl-10');
  });
});
