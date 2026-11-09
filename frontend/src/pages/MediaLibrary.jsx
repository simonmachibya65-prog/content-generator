import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Upload, Image as ImageIcon, Video, FileText, Trash2,
  Download, Search, Filter, Grid3x3, List, Loader2, Sparkles,
  Folder, FolderPlus, Tag, Palette, Check, X, Edit2, Move,
  MoreVertical, Star, Clock, ChevronRight, Plus, ArrowLeft,
  Droplet, Type, Image as ImageIconAlt
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Folder Tree Sidebar ──────────────────────────────────────
function FolderTree({ folders, currentFolder, onSelect, onCreateFolder }) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  const handleCreate = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName);
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  return (
    <div className="w-64 bg-dark-surface border-r border-dark-border p-4 space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">Folders</h3>
        <button
          onClick={() => setShowNewFolder(!showNewFolder)}
          className="p-1 text-gray-500 hover:text-accent-primary rounded transition-colors"
        >
          <FolderPlus size={16} />
        </button>
      </div>

      {showNewFolder && (
        <div className="mb-3 p-2 bg-dark-card rounded-lg border border-dark-border">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Folder name"
            className="input input-sm mb-2"
            autoFocus
          />
          <div className="flex gap-1">
            <button onClick={handleCreate} className="btn btn-primary btn-sm flex-1">
              <Check size={12} /> Create
            </button>
            <button onClick={() => setShowNewFolder(false)} className="btn btn-secondary btn-sm">
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          !currentFolder ? 'bg-accent-primary/10 text-accent-primary' : 'text-gray-400 hover:bg-dark-hover hover:text-white'
        }`}
      >
        <Folder size={16} />
        All Files
      </button>

      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onSelect(folder)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentFolder?.id === folder.id ? 'bg-accent-primary/10 text-accent-primary' : 'text-gray-400 hover:bg-dark-hover hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Folder size={16} className="flex-shrink-0" />
            <span className="truncate">{folder.name}</span>
          </div>
          <span className="text-xs text-gray-600">{folder.file_count || 0}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Tag Manager Modal ────────────────────────────────────────
function TagManager({ file, allTags, onClose, onSave }) {
  const [selectedTags, setSelectedTags] = useState(file?.tags || []);
  const [newTag, setNewTag] = useState('');

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addNewTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Manage Tags</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="label">Add tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewTag()}
              placeholder="Type and press Enter"
              className="input flex-1"
            />
            <button onClick={addNewTag} className="btn btn-primary">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Selected tags</label>
          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-dark-surface rounded-lg border border-dark-border">
            {selectedTags.length === 0 ? (
              <span className="text-sm text-gray-500">No tags selected</span>
            ) : (
              selectedTags.map((tag) => (
                <span key={tag} className="badge badge-primary flex items-center gap-1">
                  {tag}
                  <button onClick={() => toggleTag(tag)} className="hover:text-red-400">
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="mb-4">
            <label className="label">Existing tags</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`badge ${selectedTags.includes(tag) ? 'badge-primary' : 'badge-gray'} cursor-pointer`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => onSave(selectedTags)} className="btn btn-primary flex-1">
            <Check size={16} /> Save Tags
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Brand Assets Tab ─────────────────────────────────────────
function BrandAssets() {
  const [activeSection, setActiveSection] = useState('colors');
  
  const { data, isLoading } = useQuery('brandAssets', async () => {
    const { data } = await api.get('/business/brand-assets');
    return data;
  });

  const saveMut = useMutation(
    (payload) => api.post('/business/brand-assets', payload),
    {
      onSuccess: () => {
        toast.success('Brand assets saved!');
      },
      onError: () => toast.error('Failed to save')
    }
  );

  const [colors, setColors] = useState(['#3B82F6', '#10B981', '#F59E0B', '#EF4444']);
  const [fonts, setFonts] = useState(['Inter', 'Roboto', 'Poppins']);
  const [newColor, setNewColor] = useState('#000000');
  const [newFont, setNewFont] = useState('');

  const addColor = () => {
    if (!colors.includes(newColor)) {
      setColors([...colors, newColor]);
    }
  };

  const addFont = () => {
    if (newFont.trim() && !fonts.includes(newFont.trim())) {
      setFonts([...fonts, newFont.trim()]);
      setNewFont('');
    }
  };

  const removeColor = (color) => setColors(colors.filter((c) => c !== color));
  const removeFont = (font) => setFonts(fonts.filter((f) => f !== font));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('colors')}
          className={`btn ${activeSection === 'colors' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Palette size={16} /> Brand Colors
        </button>
        <button
          onClick={() => setActiveSection('fonts')}
          className={`btn ${activeSection === 'fonts' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Type size={16} /> Brand Fonts
        </button>
        <button
          onClick={() => setActiveSection('logos')}
          className={`btn ${activeSection === 'logos' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ImageIconAlt size={16} /> Logos
        </button>
      </div>

      {activeSection === 'colors' && (
        <div className="card">
          <h3 className="font-bold text-white mb-4">Brand Colors</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {colors.map((color) => (
              <div key={color} className="relative group">
                <div
                  className="w-full h-24 rounded-xl border-2 border-dark-border group-hover:border-accent-primary transition-colors"
                  style={{ backgroundColor: color }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-mono text-gray-400">{color}</span>
                  <button
                    onClick={() => removeColor(color)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-16 h-10 rounded-lg border border-dark-border cursor-pointer"
            />
            <input
              type="text"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="input flex-1"
              placeholder="#000000"
            />
            <button onClick={addColor} className="btn btn-primary">
              <Plus size={16} /> Add Color
            </button>
          </div>
        </div>
      )}

      {activeSection === 'fonts' && (
        <div className="card">
          <h3 className="font-bold text-white mb-4">Brand Fonts</h3>
          
          <div className="space-y-3 mb-6">
            {fonts.map((font) => (
              <div key={font} className="flex items-center justify-between p-4 bg-dark-surface rounded-xl border border-dark-border group">
                <span className="text-lg font-semibold text-white" style={{ fontFamily: font }}>
                  {font}
                </span>
                <button
                  onClick={() => removeFont(font)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newFont}
              onChange={(e) => setNewFont(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFont()}
              className="input flex-1"
              placeholder="Font name (e.g., Montserrat)"
            />
            <button onClick={addFont} className="btn btn-primary">
              <Plus size={16} /> Add Font
            </button>
          </div>
        </div>
      )}

      {activeSection === 'logos' && (
        <div className="card">
          <h3 className="font-bold text-white mb-4">Brand Logos</h3>
          <div className="text-center py-12">
            <ImageIconAlt size={48} className="mx-auto text-gray-700 mb-3" />
            <p className="text-sm text-gray-500 mb-4">Upload your brand logos and assets</p>
            <label className="btn btn-primary cursor-pointer">
              <Upload size={16} /> Upload Logo
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>
        </div>
      )}

      <button
        onClick={() => saveMut.mutate({ colors, fonts })}
        disabled={saveMut.isLoading}
        className="btn btn-primary"
      >
        {saveMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        Save Brand Assets
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function MediaLibrary() {
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('files');
  const [tagModalFile, setTagModalFile] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(['media', filter, currentFolder?.id], async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.append('type', filter);
    if (currentFolder) params.append('folder_id', currentFolder.id);
    const { data } = await api.get(`/media?${params}`);
    return data;
  });

  const { data: foldersData } = useQuery('folders', async () => {
    const { data } = await api.get('/media/folders');
    return data;
  });

  const { data: tagsData } = useQuery('tags', async () => {
    const { data } = await api.get('/media/tags');
    return data;
  });

  const uploadMut = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolder) formData.append('folder_id', currentFolder.id);
      return api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    {
      onSuccess: () => {
        toast.success('File uploaded');
        queryClient.invalidateQueries('media');
      },
      onError: () => toast.error('Upload failed')
    }
  );

  const deleteMut = useMutation(
    (ids) => api.post('/media/bulk-delete', { ids }),
    {
      onSuccess: () => {
        toast.success(`${selectedFiles.length} file(s) deleted`);
        setSelectedFiles([]);
        queryClient.invalidateQueries('media');
      },
      onError: () => toast.error('Delete failed')
    }
  );

  const moveMut = useMutation(
    ({ ids, folder_id }) => api.post('/media/bulk-move', { ids, folder_id }),
    {
      onSuccess: () => {
        toast.success('Files moved');
        setSelectedFiles([]);
        queryClient.invalidateQueries('media');
      },
      onError: () => toast.error('Move failed')
    }
  );

  const createFolderMut = useMutation(
    (name) => api.post('/media/folders', { name }),
    {
      onSuccess: () => {
        toast.success('Folder created');
        queryClient.invalidateQueries('folders');
      },
      onError: () => toast.error('Failed to create folder')
    }
  );

  const updateTagsMut = useMutation(
    ({ fileId, tags }) => api.put(`/media/${fileId}/tags`, { tags }),
    {
      onSuccess: () => {
        toast.success('Tags updated');
        queryClient.invalidateQueries('media');
        queryClient.invalidateQueries('tags');
        setTagModalFile(null);
      },
      onError: () => toast.error('Failed to update tags')
    }
  );

  const media = data?.media || [];
  const folders = foldersData?.folders || [];
  const allTags = tagsData?.tags || [];

  let filtered = media.filter((m) =>
    m.original_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedTag) {
    filtered = filtered.filter((m) => m.tags?.includes(selectedTag));
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadMut.mutate(file);
  };

  const toggleFileSelection = (id) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedFiles.length === filtered.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filtered.map((m) => m.id));
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex h-[calc(100vh-100px)]">
      {/* Sidebar */}
      {activeTab === 'files' && (
        <FolderTree
          folders={folders}
          currentFolder={currentFolder}
          onSelect={setCurrentFolder}
          onCreateFolder={(name) => createFolderMut.mutate(name)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {currentFolder && (
                <>
                  <button
                    onClick={() => setCurrentFolder(null)}
                    className="text-gray-500 hover:text-white"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <ChevronRight size={16} className="text-gray-600" />
                </>
              )}
              <h1 className="text-2xl font-bold text-white">
                {currentFolder ? currentFolder.name : 'Media Library'}
              </h1>
            </div>
            <p className="text-sm text-gray-500">
              {filtered.length} files
              {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('files')}
              className={`btn ${activeTab === 'files' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Folder size={16} /> Files
            </button>
            <button
              onClick={() => setActiveTab('brand')}
              className={`btn ${activeTab === 'brand' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Palette size={16} /> Brand Assets
            </button>
            {activeTab === 'files' && (
              <label className="btn btn-primary cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,.pdf"
                />
                <Upload size={16} /> Upload File
              </label>
            )}
          </div>
        </div>

        {activeTab === 'brand' ? (
          <BrandAssets />
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files..."
                  className="input pl-10 w-full"
                />
              </div>

              <div className="flex items-center gap-2 bg-dark-surface rounded-xl p-1 border border-dark-border">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'image', label: 'Images' },
                  { key: 'video', label: 'Videos' }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filter === f.key ? 'bg-dark-card text-accent-primary shadow-sm' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-dark-surface rounded-xl p-1 border border-dark-border">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    view === 'grid' ? 'bg-dark-card text-accent-primary shadow-sm' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <Grid3x3 size={16} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    view === 'list' ? 'bg-dark-card text-accent-primary shadow-sm' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Tags filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Filter by tag:</span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`badge ${!selectedTag ? 'badge-primary' : 'badge-gray'} cursor-pointer`}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`badge ${selectedTag === tag ? 'badge-primary' : 'badge-gray'} cursor-pointer`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Bulk actions bar */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-xl">
                <span className="text-sm font-medium text-white">{selectedFiles.length} selected</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const folderId = prompt('Enter folder ID to move to (or leave blank for root):');
                      moveMut.mutate({ ids: selectedFiles, folder_id: folderId || null });
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <Move size={14} /> Move
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${selectedFiles.length} file(s)?`)) {
                        deleteMut.mutate(selectedFiles);
                      }
                    }}
                    className="btn btn-secondary btn-sm text-red-400"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  <button onClick={() => setSelectedFiles([])} className="btn btn-secondary btn-sm">
                    <X size={14} /> Clear
                  </button>
                </div>
              </div>
            )}

            {/* Media Grid/List */}
            {isLoading ? (
              <div className="card flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-accent-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-12">
                <div className="w-16 h-16 bg-dark-surface border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ImageIcon size={28} className="text-gray-700" />
                </div>
                <h3 className="font-bold text-white mb-1">
                  {search || selectedTag ? 'No matching files' : 'No media files'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload images, videos or documents to get started
                </p>
                <label className="btn btn-primary inline-flex cursor-pointer">
                  <input type="file" onChange={handleFileSelect} className="hidden" accept="image/*,video/*,.pdf" />
                  <Upload size={16} /> Upload Your First File
                </label>
              </div>
            ) : view === 'grid' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === filtered.length}
                    onChange={selectAll}
                    className="rounded border-dark-border"
                  />
                  <span className="text-sm text-gray-500">Select all</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((file, i) => (
                    <div
                      key={file.id}
                      className={`stat-card group relative animate-fade-in-up stagger-${Math.min(i + 1, 4)} ${
                        selectedFiles.includes(file.id) ? 'ring-2 ring-accent-primary' : ''
                      }`}
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="w-5 h-5 rounded border-dark-border"
                        />
                      </div>

                      <div className="aspect-square rounded-xl bg-dark-surface overflow-hidden mb-3 relative border border-dark-border">
                        {file.file_type === 'image' ? (
                          <img src={file.file_url} alt={file.original_name} className="w-full h-full object-cover" />
                        ) : file.file_type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video size={36} className="text-gray-700" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText size={36} className="text-gray-700" />
                          </div>
                        )}
                        {file.is_ai_generated && (
                          <div className="absolute top-2 right-2 bg-accent-primary text-dark-base px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                            <Sparkles size={9} /> AI
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-white truncate mb-1">{file.original_name}</p>
                      <p className="text-xs text-gray-500 mb-2">{formatSize(file.file_size)}</p>

                      {file.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {file.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="badge badge-primary text-[9px]">{tag}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-1">
                        <button
                          onClick={() => setTagModalFile(file)}
                          className="btn btn-secondary btn-sm flex-1 text-xs"
                        >
                          <Tag size={12} /> Tag
                        </button>
                        <a
                          href={file.file_url}
                          download
                          className="btn btn-secondary btn-sm"
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card divide-y divide-dark-border">
                {filtered.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 py-3 hover:bg-dark-hover transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="w-5 h-5 rounded border-dark-border flex-shrink-0"
                    />

                    <div className="w-12 h-12 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {file.file_type === 'image' ? (
                        <img src={file.thumbnail_url || file.file_url} alt="" className="w-full h-full object-cover" />
                      ) : file.file_type === 'video' ? (
                        <Video size={20} className="text-gray-500" />
                      ) : (
                        <FileText size={20} className="text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{file.original_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500">{formatSize(file.file_size)}</span>
                        <span className="text-xs text-gray-500">{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                        {file.is_ai_generated && (
                          <span className="badge badge-primary text-[10px]">
                            <Sparkles size={9} /> AI Generated
                          </span>
                        )}
                      </div>
                      {file.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.tags.map((tag) => (
                            <span key={tag} className="badge badge-primary text-[9px]">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTagModalFile(file)}
                        className="p-2 text-gray-500 hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                      >
                        <Tag size={16} />
                      </button>
                      <a
                        href={file.file_url}
                        download
                        className="p-2 text-gray-500 hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => {
                          if (confirm('Delete this file?')) {
                            deleteMut.mutate([file.id]);
                          }
                        }}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tag Modal */}
      {tagModalFile && (
        <TagManager
          file={tagModalFile}
          allTags={allTags}
          onClose={() => setTagModalFile(null)}
          onSave={(tags) => updateTagsMut.mutate({ fileId: tagModalFile.id, tags })}
        />
      )}
    </div>
  );
}
