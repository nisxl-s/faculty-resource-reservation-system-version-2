import faculties from '../config/faculties.json';
import { fetchList } from '../config/api';
import { detailFields, resourceDetails } from '../config/resourceDetails';
import SupportSelect from '../components/SupportSelect';
import '../assets/css/resource_details.css';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import AdminHeader from '../components/AdminHeader';
import ResourceThumbnail from '../components/ResourceThumbnail';
import PhotoGalleryModal from '../components/PhotoGalleryModal';
import { Camera, UploadCloud, Trash2, Star, Search, RotateCcw, GraduationCap, Layers, Globe, Filter } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import { useSectionEnter } from '../hooks/effects';
import { useConfirm } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import '../assets/css/admin.css';
import '../assets/css/global.css';
import '../assets/css/resource_management.css';

// ── Option data ──────────────────────────────────────────────────────────────
const TYPE_OPTIONS = [

  { value: 'classroom',  label: 'Classroom' },
  { value: 'lab',        label: 'Laboratory' },
  { value: 'equipment',  label: 'Equipment' },
  { value: 'hall',       label: 'Hall / Auditorium' },
  { value: 'other',      label: 'Other' },
];

const FACULTY_OPTIONS = faculties.map(f => ({value:f.code,label:f.name}));
const FLOOR_OPTIONS = ['Ground floor','First floor','Second floor','Outside second floor','Other'].map(value=>({value,label:value}));
const SCOPE_OPTIONS = [{value:'faculty',label:'Faculty inventory'},{value:'campus',label:'All faculties / campus inventory'}];
const EMPTY_FILTERS = {search:'',faculty:'all',type:'all',status:'all',floor:'all',scope:'all',data:'all',sort:'name'};

const STATUS_OPTIONS = [
  { value: 'available',    label: 'Available' },
  { value: 'unavailable',  label: 'Unavailable' },
  { value: 'maintenance',  label: 'Maintenance' },
];

// ── Custom Select (same pattern as RegisterPage) ─────────────────────────────
function CustomSelect({ id, value, onChange, placeholder = 'Select…', options = [], icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  function pick(opt) {
    onChange(opt.value);
    setOpen(false);
  }

  return (
    <div className={`rg-select${open ? ' rg-select--open' : ''}`} ref={ref}>
      <button id={id}
        type="button"
        className={`rg-select__trigger${!selected ? ' rg-select__trigger--placeholder' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="rg-field-icon">{icon}</span>
        <span className="rg-select__label">{selected ? selected.label : placeholder}</span>
        <span className={`rg-select__chevron${open ? ' rg-select__chevron--up' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {open && (
        <ul className="rg-select__menu" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`rg-select__option${opt.value === value ? ' rg-select__option--active' : ''}`}
              onClick={() => pick(opt)}
            >
              <span className="rg-select__option-dot" />
              {opt.label}
              {opt.value === value && (
                <span className="rg-select__check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Icon Input ───────────────────────────────────────────────────────────────
function IconInput({ name, type = 'text', placeholder, value, onChange, icon, required, min }) {
  return (
    <div className="rg-field">
      <span className="rg-field-icon">{icon}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        min={min}
        className="rg-field-input"
        autoComplete="off"
      />
    </div>
  );
}

// ── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    available:   { label: 'Available',   cls: 'rm-badge rm-badge--available' },
    unavailable: { label: 'Unavailable', cls: 'rm-badge rm-badge--unavailable' },
    maintenance: { label: 'Maintenance', cls: 'rm-badge rm-badge--maintenance' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'rm-badge' };
  return <span className={cls}>{label}</span>;
}

// ── Type badge helper ────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const labels = {
    classroom: 'Classroom',
    lab: 'Laboratory',
    equipment: 'Equipment',
    hall: 'Hall / Auditorium',
    other: 'Other',
  };
  return <span className="rm-type-tag">{labels[type] || type}</span>;
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  Name: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  Type: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M3 21h18M9 21V7l6-4v18M9 12h6"/>
    </svg>
  ),
  Location: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Capacity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Status: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Description: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Add: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Delete: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  Resources: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
};

// ── Canvas Image Compression Helper ──────────────────────────────────────────
function compressImage(file, maxWidth = 1200, maxHeight = 900, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// ── Empty form state ─────────────────────────────────────────────────────────
const emptyResource = {
  faculty_code: 'FOC', asset_code: '', floor: 'Ground floor', sharing_scope: 'faculty', parent_resource_id: '', computer_count: '', is_sample: false,
  name: '',
  type: 'classroom',
  building: '',
  location: '',
  capacity: '',
  description: '',
  status: 'available',
  images: [],
  details: {},
};

// ── Main Component ───────────────────────────────────────────────────────────
const ResourceManagement = () => {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [resources, setResources] = useState([]);
  const [filters,setFilters] = useState(EMPTY_FILTERS);
  const [form, setForm] = useState(emptyResource);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [galleryModal, setGalleryModal] = useState({ isOpen: false, images: [], name: '', type: '' });
  const fileInputRef = useRef(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetchList(API_ENDPOINTS.RESOURCES, { headers: getAuthHeaders() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to load resources');
      setResources(result.data?.resources || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      window.location.href = '/login';
      return;
    }
    fetchResources();
  }, []);

  const handleChange = (e) => {
    setForm(cur => ({ ...cur, [e.target.name]: e.target.value }));
  };

  const handleSelect = (field) => (val) => {
    setForm(cur => ({ ...cur, [field]: val, ...(field === 'faculty_code' ? {parent_resource_id:''} : {}), ...(field === 'type' && ((cur.type === 'equipment') !== (val === 'equipment')) ? { details: {}, capacity: '', computer_count: '', parent_resource_id: '', sharing_scope:'faculty' } : {}) }));
  };

  const resetForm = () => {
    setForm(emptyResource);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePhotoFiles = async (files) => {
    if (!files || files.length === 0) return;
    const currentImages = form.images || [];
    const availableSlots = 6 - currentImages.length;
    if (availableSlots <= 0) {
      setError('A maximum of 6 photos can be uploaded per resource.');
      return;
    }

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, availableSlots);
    if (imageFiles.length === 0) {
      setError('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    setProcessingImages(true);
    setError('');
    try {
      const compressedList = await Promise.all(
        imageFiles.map(file => compressImage(file))
      );
      setForm(cur => ({
        ...cur,
        images: [...(cur.images || []), ...compressedList].slice(0, 6)
      }));
    } catch (err) {
      console.error('Image compression error:', err);
      setError('Failed to process image upload. Please try a different image.');
    } finally {
      setProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePhotoFiles(e.dataTransfer.files);
    }
  };

  const removePhoto = (index) => {
    setForm(cur => ({
      ...cur,
      images: (cur.images || []).filter((_, idx) => idx !== index)
    }));
  };

  const makePrimaryPhoto = (index) => {
    setForm(cur => {
      const list = [...(cur.images || [])];
      const [item] = list.splice(index, 1);
      return {
        ...cur,
        images: [item, ...list]
      };
    });
  };

  const saveResource = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(
        editingId ? API_ENDPOINTS.RESOURCE_BY_ID(editingId) : API_ENDPOINTS.RESOURCES,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...form,
            capacity: form.type === 'equipment' || !form.capacity ? null : Number(form.capacity),
            images: form.images || []
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.errors?.map(error => error.msg).join('; ') || result.message || 'Failed to save resource');
      resetForm();
      fetchResources();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const editResource = (resource) => {
    setEditingId(resource.id);
    let parsedImages = [];
    if (Array.isArray(resource.images)) {
      parsedImages = resource.images;
    } else if (typeof resource.images === 'string' && resource.images.trim()) {
      try {
        const p = JSON.parse(resource.images);
        parsedImages = Array.isArray(p) ? p : [resource.images];
      } catch {
        parsedImages = [resource.images];
      }
    }

    setForm({
      faculty_code:resource.faculty_code || 'FOC',asset_code:resource.asset_code || '',floor:resource.floor || 'Ground floor',sharing_scope:resource.sharing_scope || 'faculty',parent_resource_id:resource.parent_resource_id || '',computer_count:resource.computer_count || '',is_sample:Boolean(resource.is_sample),
      name:        resource.name        || '',
      type:        resource.type        || 'classroom',
      building:    resource.building    || '',
      location:    resource.location    || '',
      capacity:    resource.capacity    || '',
      description: resource.description || '',
      status:      resource.status      || 'available',
      images:      parsedImages,
      details: resourceDetails(resource),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteResource = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Faculty Resource',
      message: 'Delete this resource? Existing reservations may prevent deletion.',
      confirmText: 'Delete Resource',
      cancelText: 'Cancel',
      variant: 'danger',
      iconType: 'trash'
    });
    if (!isConfirmed) return;

    try {
      const response = await fetch(API_ENDPOINTS.RESOURCE_BY_ID(id), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to delete resource');
      showToast('Resource deleted successfully.', 'success');
      fetchResources();
    } catch (requestError) {
      showToast(requestError.message || 'Failed to delete resource', 'error');
      setError(requestError.message);
    }
  };

  const setFilter = key => value => setFilters(current=>({...current,[key]:value}));
  const hasFilters = Object.keys(EMPTY_FILTERS).some(key=>filters[key]!==EMPTY_FILTERS[key]);
  const filteredResources = useMemo(()=>{
    const query=filters.search.trim().toLowerCase();
    const list=resources.filter(resource=>{
      const faculty=faculties.find(f=>f.code===resource.faculty_code);
      return (!query || [resource.name,resource.asset_code,resource.faculty_code,faculty?.name,resource.building,resource.location,resource.floor,resource.description].some(value=>String(value||'').toLowerCase().includes(query)))
        && (filters.faculty==='all'||resource.faculty_code===filters.faculty)
        && (filters.type==='all'||resource.type===filters.type)
        && (filters.status==='all'||resource.status===filters.status)
        && (filters.floor==='all'||resource.floor===filters.floor)
        && (filters.scope==='all'||resource.sharing_scope===filters.scope)
        && (filters.data==='all'||Boolean(resource.is_sample)===(filters.data==='sample'));
    });
    return list.sort((a,b)=>filters.sort==='capacity' ? (Number(b.capacity)||0)-(Number(a.capacity)||0)||a.name.localeCompare(b.name) : filters.sort==='code' ? String(a.asset_code||'').localeCompare(String(b.asset_code||'')) : a.name.localeCompare(b.name));
  },[resources,filters]);

  useSectionEnter();

  return (
    <>
      <AdminHeader />
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
        <section className="rm-page" data-section-content>

          {/* ── Page Hero ── */}
          <div className="rm-hero">
            <div className="rm-hero__icon">
              <Icons.Resources />
            </div>
            <div>
              <h1 className="rm-hero__title">Resource Management</h1>
              <p className="rm-hero__sub">Add, update, and remove reservable rooms and equipment.</p>
            </div>
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div className="rm-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* ── Form Card ── */}
          <div className="rm-card">
            {/* Card header */}
            <div className="rm-card__header">
              <div className="rm-card__header-icon">
                {editingId ? <Icons.Save /> : <Icons.Add />}
              </div>
              <div>
                <h2 className="rm-card__title">{editingId ? 'Edit Resource' : 'Add New Resource'}</h2>
                <p className="rm-card__sub">{editingId ? 'Update the resource details below.' : 'Fill in the details to register a new resource.'}</p>
              </div>
            </div>

            {/* Card form */}
            <form onSubmit={saveResource} id="rmForm">

              <div className="rm-form-grid">
                {/* Section: Identity */}
                <div className="rm-form-section">
                  <div className="rg-section-divider"><span>Identity</span></div>
                  <div className="rg-form-group">
                    <label htmlFor="rm-name">Resource Name</label>
                    <IconInput
                      name="name"
                      placeholder="e.g. Room 201, Projector A"
                      value={form.name}
                      onChange={handleChange}
                      icon={<Icons.Name />}
                      required
                    />
                  </div>
                  <div className="rg-form-group">
                    <label htmlFor="resourcemanagement-field-1">Resource Type</label>
                    <CustomSelect id="resourcemanagement-field-1"
                      value={form.type}
                      onChange={handleSelect('type')}
                      placeholder="Select type"
                      options={TYPE_OPTIONS}
                      icon={<Icons.Type />}
                    />
                  </div>
                </div>

                <div className="catalog-structure resource-controls">
                <h3>Faculty &amp; asset structure</h3>
                <p>Assign each venue to its faculty. Create one asset code per independently reservable item. Reserve projectors separately from rooms.</p>
                <div className="resource-admin-details">
                <div className="rg-form-group"><label htmlFor="catalog-faculty">Owning faculty</label><SupportSelect id="catalog-faculty" label="Owning faculty" value={form.faculty_code} onChange={handleSelect('faculty_code')} options={FACULTY_OPTIONS} icon={<GraduationCap size={17}/>}/></div>
                <div className="rg-form-group"><label htmlFor="catalog-code">Unique asset code</label><input id="catalog-code" required maxLength={80} pattern="[A-Za-z0-9][A-Za-z0-9_-]*" name="asset_code" value={form.asset_code} onChange={handleChange} placeholder="FOC-ISH-01"/></div>
                <div className="rg-form-group"><label htmlFor="catalog-floor">Floor</label><SupportSelect id="catalog-floor" label="Floor" value={form.floor} onChange={handleSelect('floor')} options={FLOOR_OPTIONS} icon={<Layers size={17}/>}/></div>
                {form.type==='lab'&&<div className="rg-form-group"><label htmlFor="catalog-computers">Computer count</label><input id="catalog-computers" type="number" min="1" step="1" name="computer_count" value={form.computer_count} onChange={handleChange}/></div>}
                {form.type==='equipment'&&<>
                <div className="rg-form-group"><label htmlFor="catalog-scope">Reservable by</label><SupportSelect id="catalog-scope" label="Reservable by" value={form.sharing_scope} onChange={handleSelect('sharing_scope')} options={SCOPE_OPTIONS} icon={<Globe size={17}/>}/></div>
                <div className="rg-form-group"><label htmlFor="catalog-parent">Assigned venue (optional)</label><SupportSelect id="catalog-parent" label="Assigned venue (optional)" value={String(form.parent_resource_id || '')} onChange={value=>{const parent=resources.find(r=>String(r.id)===value);setForm(cur=>({...cur,parent_resource_id:value,...(parent?{building:parent.building,floor:parent.floor,location:parent.location}:{})}));}} options={[{value:'',label:'Portable / reserve inventory'},...resources.filter(r=>r.type!=='equipment'&&r.faculty_code===form.faculty_code&&r.id!==editingId).map(r=>({value:String(r.id),label:r.name}))]} icon={<Icons.Location/>}/></div>
                </>}
                <label className="catalog-sample"><input type="checkbox" checked={form.is_sample} onChange={e=>setForm(cur=>({...cur,is_sample:e.target.checked}))}/> Sample / unverified inventory</label>
                </div>
              </div>
              {/* Section: Location */}
                <div className="rm-form-section">
                  <div className="rg-section-divider"><span>Location</span></div>
                  <div className="rg-form-group">
                    <label htmlFor="rm-building">Building</label>
                    <IconInput
                      name="building"
                      placeholder="e.g. Main Block, Annex"
                      value={form.building}
                      onChange={handleChange}
                      icon={<Icons.Building />}
                    />
                  </div>
                  <div className="rg-form-group">
                    <label htmlFor="rm-location">Room / Location</label>
                    <IconInput
                      name="location"
                      placeholder="e.g. Floor 2, Lab Wing"
                      value={form.location}
                      onChange={handleChange}
                      icon={<Icons.Location />}
                    />
                  </div>
                </div>

                {/* Section: Details */}
                <div className="rm-form-section">
                  <div className="rg-section-divider"><span>Details</span></div>
                  {form.type !== 'equipment' && <>
                  <div className="rg-form-group">
                    <label htmlFor="rm-capacity">Seating capacity (people)</label>
                    <IconInput
                      name="capacity"
                      type="number"
                      min="1"
                      placeholder="e.g. 30"
                      value={form.capacity}
                      onChange={handleChange}
                      icon={<Icons.Capacity />}
                      required
                    />
                  </div>
                  </>}
                  {form.type === 'equipment' && <p className="resource-field-note">Each listing is reserved as one asset or kit. Use a separate listing for independently bookable equipment.</p>}
                  <div className="rg-form-group">
                    <label htmlFor="resourcemanagement-field-2">Status</label>
                    <CustomSelect id="resourcemanagement-field-2"
                      value={form.status}
                      onChange={handleSelect('status')}
                      placeholder="Select status"
                      options={STATUS_OPTIONS}
                      icon={<Icons.Status />}
                    />
                  </div>
                </div>
              </div>

              <div className="rg-section-divider"><span>{form.type === 'equipment' ? 'Equipment specifications & handover' : 'Space layout & facilities'}</span></div>
              <div className="resource-admin-details resource-controls">
                {detailFields(form.type,form.details).map(field => <div key={field.key} className={'rg-form-group' + (field.multiline ? ' resource-spec-wide' : '')}>
                  <label htmlFor={'resource-detail-' + field.key}>{field.label}</label>
                  {field.options ? <SupportSelect id={'resource-detail-' + field.key} label={field.label} value={form.details?.[field.key] || ''} onChange={value => setForm(current => ({...current,details:{...current.details,[field.key]:value}}))} options={[{value:'',label:'Not specified'},...field.options]}/> : field.multiline ? <textarea id={'resource-detail-' + field.key} value={form.details?.[field.key] || ''} maxLength={field.max} placeholder={field.placeholder} rows={3} onChange={event => setForm(current=>({...current,details:{...current.details,[field.key]:event.target.value}}))}/> : <input id={'resource-detail-' + field.key} value={form.details?.[field.key] || ''} maxLength={field.max} placeholder={field.placeholder} onChange={event => setForm(current=>({...current,details:{...current.details,[field.key]:event.target.value}}))}/>}
                </div>)}
              </div>
              {/* Photo Upload Section */}
              <div className="rg-section-divider"><span>Resource Photos</span></div>

              <div className="rm-photo-section rm-full-width">
                <div className="rm-photo-header">
                  <div className="rm-photo-info">
                    <span className="rm-photo-title">Visual Gallery & Thumbnail</span>
                    <p className="rm-photo-sub">
                      Upload up to 6 photos. The first image serves as the primary thumbnail. If no photos are uploaded, a default vector thumbnail will be displayed automatically.
                    </p>
                  </div>
                  <span className={`rm-photo-count-badge ${(form.images?.length || 0) === 6 ? 'rm-photo-count-badge--full' : (form.images?.length || 0) > 0 ? 'rm-photo-count-badge--has-photos' : ''}`}>
                    <Camera size={13} />
                    {form.images?.length || 0} / 6 Photos
                  </span>
                </div>

                {/* Dropzone */}
                <div
                  className={`rm-photo-dropzone ${dragActive ? 'rm-photo-dropzone--dragover' : ''} ${(form.images?.length || 0) >= 6 ? 'rm-photo-dropzone--disabled' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="rm-photo-file-input"
                    onChange={(e) => handlePhotoFiles(e.target.files)}
                    disabled={(form.images?.length || 0) >= 6 || processingImages}
                  />
                  <div className="rm-photo-dropzone-icon">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <div className="rm-photo-dropzone-text">
                      {processingImages
                        ? 'Optimizing and compressing photos…'
                        : (form.images?.length || 0) >= 6
                        ? 'Maximum 6 photos reached'
                        : 'Click to upload photos or drag and drop here'}
                    </div>
                    <div className="rm-photo-dropzone-hint">
                      Supports JPG, PNG, WebP · Up to 6 photos · Auto-compressed for performance
                    </div>
                  </div>
                </div>

                {/* Photo Previews */}
                {(form.images?.length || 0) > 0 && (
                  <div className="rm-photo-previews">
                    {form.images.map((img, idx) => (
                      <div key={idx} className={`rm-photo-card ${idx === 0 ? 'rm-photo-card--primary' : ''}`}>
                        <img src={img} alt={`Preview ${idx + 1}`} className="rm-photo-card-img" />
                        {idx === 0 && <span className="rm-photo-card-badge">Primary</span>}
                        <div className="rm-photo-card-actions">
                          {idx !== 0 && (
                            <button
                              type="button"
                              className="rm-photo-action-btn rm-photo-action-btn--primary"
                              onClick={() => makePrimaryPhoto(idx)}
                              title="Set as primary thumbnail"
                            >
                              <Star size={11} /> Primary
                            </button>
                          )}
                          <button
                            type="button"
                            className="rm-photo-action-btn rm-photo-action-btn--delete"
                            onClick={() => removePhoto(idx)}
                            title="Delete photo"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Full-width description */}
              <div className="rg-section-divider"><span>Description</span></div>

              <div className="rg-form-group rm-full-width">
                <label htmlFor="resourcemanagement-field-3">Description</label>
                <div className="rg-field rm-textarea-wrap">
                  <span className="rg-field-icon rm-textarea-icon"><Icons.Description /></span>
                  <textarea id="resourcemanagement-field-3"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Optional notes about this resource…"
                    rows="3"
                    className="rg-field-input rm-textarea"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="rm-form-actions rm-full-width">
                <button type="submit" className="rg-btn-submit rm-btn-save">
                  {editingId ? <Icons.Save /> : <Icons.Add />}
                  {editingId ? 'Save Changes' : 'Add Resource'}
                </button>
                {editingId && (
                  <button type="button" className="rm-btn-cancel" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>

            </form>
          </div>

          {/* ── Resources Table ── */}
          <div className="rm-card rm-table-card">
            <div className="rm-card__header">
              <div className="rm-card__header-icon">
                <Icons.Resources />
              </div>
              <div>
                <h2 className="rm-card__title">All Resources</h2>
                <p className="rm-card__sub">{resources.length} resource{resources.length !== 1 ? 's' : ''} registered</p>
              </div>
            </div>

            <div className="rm-resource-filters resource-controls" role="search" aria-label="Filter resources">
              <label className="rm-filter-search" htmlFor="rm-resource-search"><Search size={18}/><input id="rm-resource-search" type="search" value={filters.search} onChange={event=>setFilter('search')(event.target.value)} placeholder="Search resources, asset codes, faculties or locations"/></label>
              <div className="rm-filter-grid">
                {[
                  {key:'faculty',label:'Faculty',options:[{value:'all',label:'All faculties'},...FACULTY_OPTIONS],icon:<GraduationCap size={17}/>},
                  {key:'type',label:'Resource type',options:[{value:'all',label:'All resource types'},...TYPE_OPTIONS],icon:<Icons.Type/>},
                  {key:'status',label:'Status',options:[{value:'all',label:'All statuses'},...STATUS_OPTIONS],icon:<Icons.Status/>},
                  {key:'floor',label:'Floor',options:[{value:'all',label:'All floors'},...FLOOR_OPTIONS],icon:<Layers size={17}/>},
                  {key:'scope',label:'Inventory scope',options:[{value:'all',label:'All inventory'},...SCOPE_OPTIONS],icon:<Globe size={17}/>},
                  {key:'data',label:'Data status',options:[{value:'all',label:'All records'},{value:'sample',label:'Sample inventory'},{value:'confirmed',label:'Non-sample inventory'}],icon:<Filter size={17}/>},
                ].map(field=><div className="rm-filter-field" key={field.key}><label htmlFor={'rm-filter-'+field.key}>{field.label}</label><SupportSelect id={'rm-filter-'+field.key} label={'Filter resources by '+field.label.toLowerCase()} value={filters[field.key]} onChange={setFilter(field.key)} options={field.options} icon={field.icon}/></div>)}
              </div>
              <div className="rm-filter-footer">
                <p role="status" aria-live="polite">Showing <strong>{filteredResources.length}</strong> of <strong>{resources.length}</strong> resources</p>
                <div className="rm-filter-actions"><SupportSelect id="rm-filter-sort" label="Sort resources" value={filters.sort} onChange={setFilter('sort')} options={[{value:'name',label:'Name (A-Z)'},{value:'code',label:'Asset code (A-Z)'},{value:'capacity',label:'Seating capacity (high-low)'}]}/><button type="button" className="rm-filter-reset" disabled={!hasFilters} onClick={()=>setFilters(EMPTY_FILTERS)}><RotateCcw size={15}/>Reset filters</button></div>
              </div>
            </div>

            {resources.length === 0 && !loading ? (
              <div className="rm-empty">
                <Icons.Resources />
                <p>No resources yet. Add one above to get started.</p>
              </div>
            ) : !loading && filteredResources.length === 0 ? (
              <div className="rm-empty"><Search size={32}/><h3>No matching resources</h3><p>Try another search or reset the filters.</p><button type="button" className="rm-filter-reset" onClick={()=>setFilters(EMPTY_FILTERS)}>Reset filters</button></div>
            ) : (
              <div className="rm-table-wrap">
                <table className="rm-table">
                  <thead>
                    <tr>
                      <th className="rm-th-thumb">Thumbnail</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Seating / booking unit</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.map(resource => {
                      const resImgs = Array.isArray(resource.images)
                        ? resource.images
                        : typeof resource.images === 'string' && resource.images.trim()
                        ? (() => { try { return JSON.parse(resource.images); } catch { return [resource.images]; } })()
                        : [];
                      const hasPhotos = resImgs.length > 0;

                      return (
                        <tr key={resource.id}>
                          <td className="rm-td-thumb">
                            <ResourceThumbnail
                              images={resource.images}
                              type={resource.type}
                              name={resource.name}
                              size="sm"
                              showBadge={true}
                              onClick={hasPhotos ? () => {
                                setGalleryModal({
                                  isOpen: true,
                                  images: resImgs,
                                  name: resource.name,
                                  type: resource.type,
                                });
                              } : undefined}
                            />
                          </td>
                          <td className="rm-td-name">{resource.name}<small className="catalog-subline">{resource.asset_code} · {resource.faculty_code}{resource.is_sample ? " · Sample" : ""}</small></td>
                          <td><TypeBadge type={resource.type} /></td>
                          <td className="rm-td-location">
                            {[resource.building, resource.floor, resource.location].filter(Boolean).join(' · ') || '-'}
                          </td>
                          <td>{resource.type === 'equipment' ? 'Asset / kit' : resource.capacity || '-'}</td>
                          <td><StatusBadge status={resource.status} /></td>
                          <td>
                            <div className="rm-actions">
                              <button className="rm-btn-edit" onClick={() => editResource(resource)}>
                                <Icons.Edit /> Edit
                              </button>
                              <button className="rm-btn-delete" onClick={() => deleteResource(resource.id)}>
                                <Icons.Delete /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </section>
      </main>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={galleryModal.isOpen}
        onClose={() => setGalleryModal({ isOpen: false, images: [], name: '', type: '' })}
        images={galleryModal.images}
        resourceName={galleryModal.name}
        resourceType={galleryModal.type}
      />

      
    </>
  );
};

export default ResourceManagement;

