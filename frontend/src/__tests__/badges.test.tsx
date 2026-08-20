import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SeverityBadge } from '@/components/security/SeverityBadge';
import { StatusBadge } from '@/components/security/StatusBadge';
import { RiskScoreGauge } from '@/components/security/RiskScoreGauge';

describe('Security Components Unit Tests', () => {
  it('renders CRITICAL severity badge', () => {
    render(<SeverityBadge severity="CRITICAL" />);
    expect(screen.getByText('CRITICAL')).toBeDefined();
  });

  it('renders OPEN status badge', () => {
    render(<StatusBadge status="OPEN" />);
    expect(screen.getByText('OPEN')).toBeDefined();
  });

  it('renders RiskScoreGauge numerical score', () => {
    render(<RiskScoreGauge score={27.5} label="Test Score" />);
    expect(screen.getByText('27.5')).toBeDefined();
    expect(screen.getByText('Test Score')).toBeDefined();
  });
});
