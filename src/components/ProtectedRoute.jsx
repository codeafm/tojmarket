import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="card">Загрузка…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return children;
}
