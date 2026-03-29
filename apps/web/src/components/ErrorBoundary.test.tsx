import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

// Suppress console.error noise from React and the ErrorBoundary in test output
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// A component that throws on demand
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test explosion')
  }
  return <div>Child content</div>
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('shows default fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test explosion')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('shows custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error page</div>}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom error page')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('resets error state when "Try again" button is clicked', () => {
    let shouldThrow = true

    function ConditionalThrower() {
      if (shouldThrow) {
        throw new Error('Temporary error')
      }
      return <div>Recovered content</div>
    }

    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>,
    )

    // Error UI is shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // "Fix" the child so it no longer throws
    shouldThrow = false

    // Click Try again
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    // Children should render again
    expect(screen.getByText('Recovered content')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('calls componentDidCatch with error info', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    )

    // React calls console.error internally, and our ErrorBoundary also calls it
    // Verify that our ErrorBoundary's console.error was called with the right prefix
    const boundaryLogCall = consoleSpy.mock.calls.find(
      (args) => args[0] === 'ErrorBoundary caught:',
    )
    expect(boundaryLogCall).toBeDefined()
    expect(boundaryLogCall![1]).toBeInstanceOf(Error)
    expect((boundaryLogCall![1] as Error).message).toBe('Test explosion')
  })

  it('displays a generic message when error has no message', () => {
    function ThrowNoMessage(): null {
      throw new Error()
    }

    render(
      <ErrorBoundary>
        <ThrowNoMessage />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    // The fallback text "An unexpected error occurred." should appear because error.message is empty
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
  })
})
