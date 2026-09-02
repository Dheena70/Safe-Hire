import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SAFE HIRE application brand and auth screen', () => {
  render(<App />);
  const brandElements = screen.getAllByText(/SAFE HIRE/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
