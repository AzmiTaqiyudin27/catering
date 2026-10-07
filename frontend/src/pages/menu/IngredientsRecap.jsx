import { useState, useEffect } from 'react';
import { ingredientsAPI, reportsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlineDownload,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentReport,
} from 'react-icons/hi';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const IngredientsRecap = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await ingredientsAPI.getSummary();
      setSummary(response.data.data);
    } catch (error) {
      toast.error('Gagal memuat rekapitulasi');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await reportsAPI.exportIngredients();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-stok-bahan-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Laporan Excel berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh laporan Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await reportsAPI.generatePDF({
        type: 'ingredients',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-stok-bahan-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laporan PDF berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh laporan PDF');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const categoryData = summary?.byCategory?.map(item => ({
    name: item.category,
    count: item._count,
    stock: Number(item._sum?.stock) || 0,
  })) || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Rekapitulasi Stok Bahan</h1>
          <p className="page-subtitle">Ringkasan stok bahan baku</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPDF} className="btn btn-secondary">
            <HiOutlineDocumentReport className="w-5 h-5 mr-2 text-red-500" />
            Export PDF
          </button>
          <button onClick={handleExport} className="btn btn-primary">
            <HiOutlineDownload className="w-5 h-5 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Jenis Bahan</p>
              <p className="text-2xl font-bold text-slate-900">{summary?.total || 0}</p>
              <p className="text-sm text-slate-500 mt-1">jenis bahan</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
              <HiOutlineCube className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Bahan Stok Rendah</p>
              <p className="text-2xl font-bold text-red-600">{summary?.lowStockCount || 0}</p>
              <p className="text-sm text-slate-500 mt-1">perlu restok</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <HiOutlineExclamation className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Nilai Stok</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.totalValue)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <HiOutlineCurrencyDollar className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Low Stock Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Bahan per Kategori</h3>
          </div>
          <div className="card-body h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} name="Jumlah Jenis" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                Tidak ada data
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Bahan Perlu Restok</h3>
            <span className="badge badge-danger">{summary?.lowStockCount || 0} items</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {summary?.lowStockItems?.length > 0 ? (
              summary.lowStockItems.map((item) => (
                <div key={item.id} className="p-4 hover:bg-red-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                        <HiOutlineExclamation className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        {item.stock} {item.unit}
                      </p>
                      <p className="text-xs text-slate-500">
                        Min: {item.minStock} {item.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                <HiOutlineCube className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Tidak ada bahan dengan stok rendah</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution Pie */}
      {categoryData.length > 0 && (
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Distribusi Kategori</h3>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      label
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm text-slate-600">{item.name}</span>
                    <span className="text-sm font-medium text-slate-900">({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientsRecap;

