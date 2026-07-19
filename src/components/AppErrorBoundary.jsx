import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App section crashed:", error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-3xl border border-accent-200 bg-accent-50 p-5 text-accent-800 dark:border-accent-300/30 dark:bg-accent-300/10 dark:text-accent-100">
          <h2 className="text-base font-semibold">This section could not load.</h2>
          <p className="mt-2 text-sm">The rest of the vessel workspace is still available.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 rounded-2xl border border-accent-300 bg-white px-4 py-2 text-sm font-semibold text-accent-800 dark:bg-slate-900 dark:text-accent-100"
          >
            Try again
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
