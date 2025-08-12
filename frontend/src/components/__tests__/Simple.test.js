import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component without dependencies
function SimpleComponent() {
  return <div>Simple Test</div>;
}

describe('Simple Test', () => {
  it('renders without crashing', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Simple Test')).toBeInTheDocument();
  });
});