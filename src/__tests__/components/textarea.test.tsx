import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea Component', () => {
  it('renders textarea element', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Textarea onChange={handleChange} placeholder="Test" />);
    
    const textarea = screen.getByPlaceholderText('Test');
    fireEvent.change(textarea, { target: { value: 'test content' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with error message', () => {
    render(<Textarea error="Description is required" />);
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  it('applies error styles when error prop is provided', () => {
    render(<Textarea error="Error" placeholder="Test" />);
    const textarea = screen.getByPlaceholderText('Test');
    expect(textarea).toHaveClass('border-[var(--accent-red)]');
  });

  it('renders disabled textarea', () => {
    render(<Textarea disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-class" placeholder="Custom" />);
    expect(screen.getByPlaceholderText('Custom')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} placeholder="Ref test" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
