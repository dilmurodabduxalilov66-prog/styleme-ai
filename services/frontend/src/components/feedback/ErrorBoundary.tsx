'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-border-glass bg-surface/50 p-8 text-center backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-semibold mt-4 text-text-primary">
            Kutilmagan xatolik yuz berdi
          </h3>
          <p className="font-sans text-sm text-text-muted mt-2 max-w-md">
            {this.state.error?.message || 'Sahifani render qilishda muammo yuzaga keldi. Iltimos, qaytadan yuklab ko\'ring.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-md bg-primary hover:bg-primary-hover text-white px-4 h-9 text-sm font-semibold shadow-glow-purple mt-6 transition-all duration-150 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Qayta Yuklash</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
