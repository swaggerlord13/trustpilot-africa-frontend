import React from "react";
import ErrorScreen from "./ErrorScreen";

// Last-resort catch for errors outside the router (providers, router itself).
// Route-level errors are handled by RouteError. This sits OUTSIDE the router,
// so its fallback must not use router components like <Link>.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // hasError switches rendering to the fallback screen
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Remember the error so the next render shows the fallback
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log details for debugging; visitors only see the friendly screen
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    // Something crashed: show the shared error screen (plain links only)
    if (this.state.hasError) {
      return (
        <ErrorScreen
          title="Something went wrong"
          message="We hit an unexpected error. Try refreshing the page or going back to the homepage."
        />
      );
    }

    // Normal case: render the app
    return this.props.children;
  }
}

export default ErrorBoundary;
