import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from './SearchBar';
import { vi } from 'vitest';

// ✅ Mock getSuggestions API
vi.mock('../api', () => ({
  getSuggestions: vi.fn(() => Promise.resolve(['AI contract', 'Defense vendor', 'Raytheon']))
}));

describe('SearchBar Component', () => {
  test('renders input and search button', () => {
    const mockSearch = vi.fn();
    render(<SearchBar onSearch={mockSearch} />);

    expect(screen.getByPlaceholderText('Search contracts, vendors, NAICS...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('calls onSearch when Play button is clicked', async () => {
    const mockSearch = vi.fn();
    render(<SearchBar onSearch={mockSearch} />);

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'AI contract' },
    });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('AI contract');
    });
  });

  test('shows suggestions when typing', async () => {
    const mockSearch = vi.fn();
    render(<SearchBar onSearch={mockSearch} />);

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'AI' },
    });

    await waitFor(() => {
      expect(screen.getByText('AI contract')).toBeInTheDocument();
    });
  });

  test('clicking a suggestion calls onSearch', async () => {
    const mockSearch = vi.fn();
    render(<SearchBar onSearch={mockSearch} />);

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'Ray' },
    });

    await waitFor(() => {
      const suggestion = screen.getByText('Raytheon');
      fireEvent.click(suggestion);
    });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledTimes(1);
    });
  });
});
