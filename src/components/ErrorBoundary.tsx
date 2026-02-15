import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error(error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
          <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">Something went wrong</h1>
          <p className="mt-2 text-center text-primary-600 dark:text-primary-400">Please try again.</p>
          <Link to="/" className="mt-6"><Button>Back to Home</Button></Link>
        </div>
      );
    }
    return this.props.children;
  }
}
