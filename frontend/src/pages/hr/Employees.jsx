import { useState, useEffect } from 'react';
import { employeesAPI, reportsAPI, getUploadUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineUserGroup,
  HiOutlineDownload,
  HiOutlineUser,
  HiOutlineDocumentReport,
} from 'react-icons/hi';

const Employees = () => {
  const { canEdit } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: 'Dapur',
    joinDate: format(new Date(), 'yyyy-MM-dd'),
    salary: '',
    status: 'ACTIVE',
    notes: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const departments = ['Dapur', 'Operasional', 'Kantor', 'Delivery', 'Lainnya'];
  const statuses = ['ACTIVE', 'INACTIVE', 'RESIGNED'];
  const positions = ['Chef', 'Asisten Chef', 'Driver', 'Admin', 'Kasir', 'Cleaning Service', 'Lainnya'];

  useEffect(() => {
    fetchEmployees();
  }, [page, search, departmentFilter, statusFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getAll({
        page,
        limit: 10,
        search,
        department: departmentFilter,
        status: statusFilter,
      });
      setEmployees(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Gagal memuat data karyawan');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (photoFile) {
        data.append('photo', photoFile);
      }

      if (selectedEmployee) {
        await employeesAPI.update(selectedEmployee.id, data);
        toast.success('Karyawan berhasil diperbarui');
      } else {
        await employeesAPI.create(data);
        toast.success('Karyawan berhasil ditambahkan');
      }
      setIsModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan karyawan');
    }
  };

  const handleDelete = async () => {
    try {
      await employeesAPI.delete(selectedEmployee.id);
      toast.success('Karyawan berhasil dihapus');
      fetchEmployees();
    } catch (error) {
      toast.error('Gagal menghapus karyawan');
    }
  };

  const handleExport = async () => {
    try {
      const response = await reportsAPI.exportEmployees();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `data-karyawan-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data Excel berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh data Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await reportsAPI.generatePDF({
        type: 'employees',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `data-karyawan-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laporan PDF berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh laporan PDF');
    }
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone,
      address: employee.address,
      position: employee.position,
      department: employee.department,
      joinDate: format(new Date(employee.joinDate), 'yyyy-MM-dd'),
      salary: employee.salary,
      status: employee.status,
      notes: employee.notes || '',
    });
    setPhotoPreview(employee.photo ? getUploadUrl(employee.photo) : null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: 'Dapur',
      joinDate: format(new Date(), 'yyyy-MM-dd'),
      salary: '',
      status: 'ACTIVE',
      notes: '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'badge-success',
      INACTIVE: 'badge-warning',
      RESIGNED: 'badge-danger',
    };
    return badges[status] || 'badge-gray';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Data Karyawan</h1>
          <p className="page-subtitle">Kelola data karyawan perusahaan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportPDF} className="btn btn-secondary">
            <HiOutlineDocumentReport className="w-5 h-5 mr-2 text-red-500" />
            Export PDF
          </button>
          <button onClick={handleExport} className="btn btn-secondary">
            <HiOutlineDownload className="w-5 h-5 mr-2" />
            Export Excel
          </button>
          {canEdit('hr') && (
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <HiOutlinePlus className="w-5 h-5 mr-2" />
              Tambah Karyawan
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau ID karyawan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input pl-12"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="input w-full md:w-40"
          >
            <option value="">Semua Dept</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input w-full md:w-40"
          >
            <option value="">Semua Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={HiOutlineUserGroup}
            title="Belum ada karyawan"
            description="Mulai dengan menambahkan data karyawan"
            action={
              canEdit('hr') && (
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                  <HiOutlinePlus className="w-5 h-5 mr-2" />
                  Tambah Karyawan
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Karyawan</th>
                    <th>Jabatan</th>
                    <th>Departemen</th>
                    <th>Tanggal Masuk</th>
                    <th className="text-right">Gaji</th>
                    <th>Status</th>
                    {canEdit('hr') && <th className="text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center overflow-hidden">
                            {employee.photo ? (
                              <img
                                src={getUploadUrl(employee.photo)}
                                alt={employee.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <HiOutlineUser className="w-5 h-5 text-primary-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{employee.name}</p>
                            <p className="text-xs text-slate-500">{employee.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td>{employee.position}</td>
                      <td>
                        <span className="badge badge-info">{employee.department}</span>
                      </td>
                      <td>{format(new Date(employee.joinDate), 'dd MMM yyyy', { locale: id })}</td>
                      <td className="text-right font-medium">{formatCurrency(employee.salary)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(employee.status)}`}>{employee.status}</span>
                      </td>
                      {canEdit('hr') && (
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(employee)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                            >
                              <HiOutlinePencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            >
                              <HiOutlineTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <HiOutlineUser className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <label className="btn btn-secondary cursor-pointer">
              Pilih Foto
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nama Lengkap</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">No. Telepon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Tanggal Masuk</label>
              <input
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Alamat</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input min-h-[60px]"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Jabatan</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="input"
                required
              >
                <option value="">Pilih Jabatan</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Departemen</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Gaji (Rp)</label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="input"
              placeholder="0"
              required
              min="0"
            />
          </div>

          <div>
            <label className="label">Catatan</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input min-h-[60px]"
              placeholder="Catatan tambahan..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedEmployee ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Karyawan"
        message={`Apakah Anda yakin ingin menghapus data karyawan "${selectedEmployee?.name}"?`}
        confirmText="Ya, Hapus"
      />
    </div>
  );
};

export default Employees;

