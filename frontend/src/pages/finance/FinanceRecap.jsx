import { useState, useEffect } from 'react';
import { incomesAPI, expensesAPI, reportsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCurrencyDollar,
  HiOutlineDownload,
  HiOutlineCalendar,
  HiOutlineDocumentReport,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const FinanceRecap = () => {
  const [loading, setLoading] = useState(true);
  const [incomeSummary, setIncomeSummary] = useState(null);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    fetchSummary();
  }, [dateFilter]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = { startDate: dateFilter.start, endDate: dateFilter.end };
      const [incomeRes, expenseRes] = await Promise.all([
        incomesAPI.getSummary(params),
        expensesAPI.getSummary(params),
      ]);
      setIncomeSummary(incomeRes.data.data);
      setExpenseSummary(expenseRes.data.data);
    } catch (error) {
      toast.error('Gagal memuat rekapitulasi');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await reportsAPI.exportFinance({
        startDate: dateFilter.start,
        endDate: dateFilter.end,
        type: 'all',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-keuangan-${Date.now()}.xlsx`);
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
        type: 'finance',
        startDate: dateFilter.start,
        endDate: dateFilter.end,
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-keuangan-${Date.now()}.pdf`);
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

  const totalIncome = Number(incomeSummary?.total) || 0;
  const totalExpense = Number(expenseSummary?.total) || 0;
  const profit = totalIncome - totalExpense;

  const incomeByCategory = incomeSummary?.byCategory?.map(item => ({
    name: item.category,
    value: Number(item._sum?.amount) || 0,
  })) || [];

  const expenseByCategory = expenseSummary?.byCategory?.map(item => ({
    name: item.category,
    value: Number(item._sum?.amount) || 0,
  })) || [];

  const comparisonData = [
    { name: 'Pemasukan', amount: totalIncome },
    { name: 'Pengeluaran', amount: totalExpense },
    { name: 'Keuntungan', amount: profit },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Rekapitulasi Keuangan</h1>
          <p className="page-subtitle">Ringkasan pemasukan dan pengeluaran</p>
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

      {/* Date Filter */}
      <div className="card mb-6">
        <div className="p-4 flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-slate-700">Periode:</span>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                className="input pl-12"
              />
            </div>
            <span className="text-slate-500">-</span>
            <div className="relative">
              <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="input pl-12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Pemasukan</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
              <p className="text-sm text-slate-500 mt-1">{incomeSummary?.count || 0} transaksi</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <HiOutlineTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
              <p className="text-sm text-slate-500 mt-1">{expenseSummary?.count || 0} transaksi</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <HiOutlineTrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Keuntungan Bersih</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                {formatCurrency(profit)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {profit >= 0 ? 'Untung' : 'Rugi'}
              </p>
            </div>
            <div className={`w-12 h-12 ${profit >= 0 ? 'bg-primary-100 text-primary-600' : 'bg-red-100 text-red-600'} rounded-xl flex items-center justify-center`}>
              <HiOutlineCurrencyDollar className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Perbandingan Keuangan</h3>
          </div>
          <div className="card-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-rows-2 gap-6">
          {/* Income by Category */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900">Pemasukan per Kategori</h3>
            </div>
            <div className="card-body h-40">
              {incomeByCategory.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeByCategory}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={50}
                          innerRadius={30}
                        >
                          {incomeByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {incomeByCategory.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-medium text-slate-900">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500">Tidak ada data</p>
              )}
            </div>
          </div>

          {/* Expense by Category */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900">Pengeluaran per Kategori</h3>
            </div>
            <div className="card-body h-40">
              {expenseByCategory.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={50}
                          innerRadius={30}
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 max-h-32 overflow-y-auto">
                    {expenseByCategory.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-medium text-slate-900">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500">Tidak ada data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceRecap;

