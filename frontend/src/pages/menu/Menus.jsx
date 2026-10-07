import { useState, useEffect } from 'react';
import { menusAPI, getUploadUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineCollection,
  HiOutlinePhotograph,
} from 'react-icons/hi';

const Menus = () => {
  const { canEdit } = useAuth();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Makanan',
    price: '',
    isAvailable: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const categories = ['Makanan', 'Minuman', 'Snack', 'Paket', 'Lainnya'];

  useEffect(() => {
    fetchMenus();
  }, [page, search, categoryFilter]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await menusAPI.getAll({ page, limit: 12, search, category: categoryFilter });
      setMenus(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Gagal memuat data menu');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('price', formData.price);
      data.append('isAvailable', formData.isAvailable);
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (selectedMenu) {
        await menusAPI.update(selectedMenu.id, data);
        toast.success('Menu berhasil diperbarui');
      } else {
        await menusAPI.create(data);
        toast.success('Menu berhasil ditambahkan');
      }
      setIsModalOpen(false);
      resetForm();
      fetchMenus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan menu');
    }
  };

  const handleDelete = async () => {
    try {
      await menusAPI.delete(selectedMenu.id);
      toast.success('Menu berhasil dihapus');
      fetchMenus();
    } catch (error) {
      toast.error('Gagal menghapus menu');
    }
  };

  const openEditModal = (menu) => {
    setSelectedMenu(menu);
    setFormData({
      name: menu.name,
      description: menu.description || '',
      category: menu.category,
      price: menu.price,
      isAvailable: menu.isAvailable,
    });
    setImagePreview(menu.image ? getUploadUrl(menu.image) : null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setSelectedMenu(null);
    setFormData({
      name: '',
      description: '',
      category: 'Makanan',
      price: '',
      isAvailable: true,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Daftar Menu</h1>
          <p className="page-subtitle">Kelola menu makanan dan minuman</p>
        </div>
        {canEdit('menu') && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <HiOutlinePlus className="w-5 h-5 mr-2" />
            Tambah Menu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input pl-12"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="input w-full sm:w-48"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : menus.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HiOutlineCollection}
            title="Belum ada menu"
            description="Mulai dengan menambahkan menu baru"
            action={
              canEdit('menu') && (
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                  <HiOutlinePlus className="w-5 h-5 mr-2" />
                  Tambah Menu
                </button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menus.map((menu) => (
              <div key={menu.id} className="card group hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {menu.image ? (
                    <img
                      src={getUploadUrl(menu.image)}
                      alt={menu.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <HiOutlinePhotograph className="w-12 h-12" />
                    </div>
                  )}
                  {!menu.isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                      <span className="text-white font-medium">Tidak Tersedia</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{menu.name}</h3>
                      <span className="badge badge-info text-xs">{menu.category}</span>
                    </div>
                    <p className="text-lg font-bold text-primary-600">{formatCurrency(menu.price)}</p>
                  </div>
                  {menu.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{menu.description}</p>
                  )}
                  {canEdit('menu') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(menu)}
                        className="flex-1 btn btn-secondary text-sm py-2"
                      >
                        <HiOutlinePencil className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMenu(menu);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="btn btn-danger text-sm py-2 px-3"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="card">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMenu ? 'Edit Menu' : 'Tambah Menu'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Gambar Menu</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <HiOutlinePhotograph className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <label className="btn btn-secondary cursor-pointer">
                <HiOutlinePhotograph className="w-5 h-5 mr-2" />
                Pilih Gambar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div>
            <label className="label">Nama Menu</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Contoh: Nasi Kotak Ayam Goreng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Harga (Rp)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                placeholder="0"
                required
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="label">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Deskripsi menu..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isAvailable" className="text-sm text-slate-700">
              Menu tersedia
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedMenu ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Menu"
        message={`Apakah Anda yakin ingin menghapus menu "${selectedMenu?.name}"?`}
        confirmText="Ya, Hapus"
      />
    </div>
  );
};

export default Menus;

