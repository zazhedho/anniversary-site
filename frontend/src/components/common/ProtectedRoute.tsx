import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#fff8f1] text-[#2b2220]">
        <p className="rounded-full border border-[#9c4f46]/30 px-5 py-2 text-sm uppercase tracking-[0.12em]">Mengecek sesi...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
