import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
