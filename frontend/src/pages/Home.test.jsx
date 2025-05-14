// File: src/pages/Home.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './Home';
import { vi } from 'vitest';

// Mock subcomponents to avoid React mismatch or DOM errors
vi.mock('../components/SearchBar', () => ({
  default: ({ onSearch }) => (
    <div>
      <input
        placeholder="Search contracts, vendors, NAICS..."
        onChange={(e) => onSearch(e.target.value)}
        data-testid="mock-input"
      />
      <button onClick={() => onSearch('AI contract')} data-testid="mock-button">Search</button>
    </div>
  ),
}));

vi.mock('../components/ResultsTable', () => ({
  default: ({ results }) => <div data-testid="mock-results">{results.length} results</div>,
}));

vi.mock('../components/Loader', () => ({
  default: () => <div data-testid="mock-loader">Loading...</div>,
}));

vi.mock('../components/ErrorModal', () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="mock-error">Error Modal</div> : null,
}));

vi.mock('../api', async () => ({
  semanticSearch: vi.fn(async (query) => {
    if (query === 'error') throw new Error('Test error');
    return {
      gpt_response: `Mocked result for ${query}`,
      sources: ['db1'],
      cached: false,
    };
  }),
}));

import { semanticSearch } from '../api';

describe('Home Page Component', () => {
  test('renders heading and search bar', () => {
    render(<Home />);
    expect(screen.getByText('One Search. Four Databases.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search contracts, vendors, NAICS...')).toBeInTheDocument();
  });

  test('handles successful semantic search', async () => {
    render(<Home />);
    fireEvent.click(screen.getByTestId('mock-button'));

    await waitFor(() => {
      expect(screen.getByTestId('mock-results')).toHaveTextContent('1 results');
    });
    expect(semanticSearch).toHaveBeenCalledWith('AI contract');
  });

  test('shows error modal on API failure', async () => {
    render(<Home />);

    fireEvent.change(screen.getByTestId('mock-input'), {
      target: { value: 'error' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-error')).toBeInTheDocument();
    });
  });
});
