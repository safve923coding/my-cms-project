import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: 'red', background: '#fff', minHeight: '100vh' }}>
                    <h1>Oops! Something went wrong.</h1>
                    <p>{this.state.error?.toString()}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
