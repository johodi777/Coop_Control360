import { useEffect } from "react";
import AppRouter from "./router/AppRouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DebugInfo from "./components/DebugInfo";

function App() {
  useEffect(() => {
    console.log('🚀 App se montó correctamente');
    console.log('Token en localStorage:', localStorage.getItem('token'));
  }, []);

  return (
    <ErrorBoundary>
      <DebugInfo />
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;

