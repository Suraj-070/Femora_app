"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/femora/shared/glass-card";

interface Props {
  children: ReactNode;
  /** Called when the person taps "Try again" — typically resets to a known-good view. */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

export class ViewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("View crashed:", error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="px-4 sm:px-6 py-10">
          <GlassCard className="p-6 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-semibold mb-1">Something went wrong here</h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              This section hit a snag, but the rest of the app is fine. Try again, or switch to
              another tab.
            </p>
            <Button onClick={this.handleReset} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try again
            </Button>
          </GlassCard>
        </div>
      );
    }
    return this.props.children;
  }
}