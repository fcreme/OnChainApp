import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from './Button'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('renders with custom variant', () => {
    render(<Button variant="danger">Delete</Button>)
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(<Button size="large">Large Button</Button>)
    const button = screen.getByRole('button', { name: 'Large Button' })
    expect(button).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button', { name: 'Disabled Button' })
    expect(button).toBeDisabled()
  })

  it('is disabled when loading prop is true', () => {
    render(<Button loading>Loading Button</Button>)
    const button = screen.getByRole('button', { name: 'Loading Button' })
    expect(button).toBeDisabled()
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading Button</Button>)
    const button = screen.getByRole('button', { name: 'Loading Button' })
    expect(button).toBeInTheDocument()
    // Check for loading spinner (it should be present in the DOM)
    expect(button.querySelector('.loading-spinner')).toBeInTheDocument()
  })

  it('shows custom loading text', () => {
    render(<Button loading loadingText="Processing...">Submit</Button>)
    const button = screen.getByRole('button', { name: 'Processing...' })
    expect(button).toBeInTheDocument()
  })

  it('applies custom data-testid', () => {
    render(<Button dataTestId="custom-button">Test Button</Button>)
    const button = screen.getByTestId('custom-button')
    expect(button).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button', { name: 'Custom Button' })
    expect(button).toHaveClass('custom-class')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument()

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument()

    rerender(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button', { name: 'Danger' })).toBeInTheDocument()

    rerender(<Button variant="success">Success</Button>)
    expect(screen.getByRole('button', { name: 'Success' })).toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="small">Small</Button>)
    expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument()

    rerender(<Button size="medium">Medium</Button>)
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument()

    rerender(<Button size="large">Large</Button>)
    expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument()
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: 'Disabled' })
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} loading>Loading</Button>)
    const button = screen.getByRole('button', { name: 'Loading' })
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })
})
