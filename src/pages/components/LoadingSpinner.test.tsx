import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('loading-spinner')
  })

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size="large" />)
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom color', () => {
    render(<LoadingSpinner color="#ff0000" />)
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />)
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('custom-spinner')
  })

  it('renders without text when text prop is not provided', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
    // Should not have any visible text content (CSS is not considered text content)
    const textElements = spinner.querySelectorAll('span, div:not([style*="border"])')
    expect(textElements.length).toBe(0)
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="small" />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    rerender(<LoadingSpinner size="medium" />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    rerender(<LoadingSpinner size="large" />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('applies correct styles for different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="small" text="Small" />)
    const text = screen.getByText('Small')
    expect(text).toHaveStyle({ fontSize: '12px' })

    rerender(<LoadingSpinner size="medium" text="Medium" />)
    const mediumText = screen.getByText('Medium')
    expect(mediumText).toHaveStyle({ fontSize: '14px' })

    rerender(<LoadingSpinner size="large" text="Large" />)
    const largeText = screen.getByText('Large')
    expect(largeText).toHaveStyle({ fontSize: '14px' }) // Large uses same font size as medium
  })

  it('renders spinner element with correct structure', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByTestId('loading-spinner')
    const spinnerElement = spinner.querySelector('div')
    expect(spinnerElement).toBeInTheDocument()
    expect(spinnerElement).toHaveStyle({
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    })
  })
})
