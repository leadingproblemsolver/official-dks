'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg text-red-900 font-mono">
          <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">SYSTEM FAULT DETECTED</h2>
          <p className="text-sm opacity-80 mb-4 whitespace-pre-wrap">
            {this.state.error?.message || "An unhandled exception occurred in the logic core."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors uppercase text-xs tracking-widest font-bold"
          >
            Reboot Core
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
