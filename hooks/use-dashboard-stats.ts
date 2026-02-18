import { useState, useEffect } from "react";

interface ProductStats {
  totalOrders: number;
  pending: number;
  shipped: number;
  totalRevenue: number;
}

interface PlanStats {
  totalOrders: number;
  pending: number;
  verified: number;
  totalRevenue: number;
  vipPlans: number;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
}

interface SedeStats {
  total: number;
  active: number;
  inactive: number;
}

interface PlanStatsOverview {
  total: number;
  active: number;
  inactive: number;
}

interface ProductStatsOverview {
  total: number;
  active: number;
  inactive: number;
}

interface NoticiaStats {
  total: number;
  active: number;
  inactive: number;
}

interface DashboardStats {
  productStats: ProductStats;
  planStats: PlanStats;
  userStats: UserStats;
  sedeStats: SedeStats;
  planStatsOverview: PlanStatsOverview;
  productStatsOverview: ProductStatsOverview;
  noticiaStats: NoticiaStats;
  lastUpdated: string;
}

export function useDashboardStats(refreshInterval: number = 30000) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/dashboard-stats');
      
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
