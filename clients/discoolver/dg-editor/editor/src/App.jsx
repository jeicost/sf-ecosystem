import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import GuideNew from "./pages/GuideNew";
import GuideEdit from "./pages/GuideEdit";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { isLoggedIn } from "./lib/auth";

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="guides/new" element={<GuideNew />} />
          <Route path="guides/:id/*" element={<GuideEdit />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}
