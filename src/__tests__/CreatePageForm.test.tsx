import { render, screen, fireEvent } from '@testing-library/react';
import CreatePageForm from '../components/CreatePageForm';

describe('CreatePageForm', () => {
  it('renders the form with all required fields', () => {
    render(<CreatePageForm />);
    
    expect(screen.getByLabelText(/Bitcoin Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Page Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Page/i })).toBeInTheDocument();
  });

  it('validates required fields', () => {
    render(<CreatePageForm />);
    
    const submitButton = screen.getByRole('button', { name: /Create Page/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/Bitcoin address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Page title is required/i)).toBeInTheDocument();
  });

  it('validates Bitcoin address format', () => {
    render(<CreatePageForm />);
    
    const addressInput = screen.getByLabelText(/Bitcoin Address/i);
    fireEvent.change(addressInput, { target: { value: 'invalid-address' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Page/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/Invalid Bitcoin address format/i)).toBeInTheDocument();
  });
}); 