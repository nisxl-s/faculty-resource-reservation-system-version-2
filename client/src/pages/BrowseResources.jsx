import SupportSelect from '../components/SupportSelect';
import BookingDatePicker from '../components/BookingDatePicker';
import ClockTimePicker from '../components/ClockTimePicker';
import {usePageLoading} from '../components/LoadingState';
import faculties from '../config/faculties.json';
import { fetchList } from '../config/api';
import React, { useState, useEffect, useMemo, useCallback} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StudentHeader from '../components/StudentHeader';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';

import ResourceDetailsModal from '../components/ResourceDetailsModal';
import { resourceDetails } from '../config/resourceDetails';
import ResourceThumbnail from '../components/ResourceThumbnail';
import PhotoGalleryModal from '../components/PhotoGalleryModal';
import { Compass, Search, Filter, Users, MapPin, Clock, Calendar, CheckCircle, AlertCircle, X, ChevronRight, RefreshCw, Layers, Camera, ArrowUpDown, Building, GraduationCap, Cpu, RotateCcw } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import { sectionCache } from '../utils/sectionCache';
import { useSectionEnter } from '../hooks/effects';
import '../assets/css/admin.css';
import '../assets/css/global.css';
import '../assets/css/bookinghistory.css';
import '../assets/css/browse_resources.css';

// ── Dropdown Options ─────────────────────────────────────────────────────────
const FACULTY_OPTIONS = [
  { value: 'all', label: 'All faculties' },
  { value: 'campus', label: 'Shared campus inventory' },
  ...faculties.map(faculty => ({ value: faculty.code, label: faculty.name })),
];

const TYPE_OPTIONS = [
  { value: 'all',        label: 'All Facility Types' },
  { value: 'classroom',  label: 'Classrooms' },
  { value: 'lab',        label: 'Laboratories' },
  { value: 'hall',       label: 'Conference Halls' },
  { value: 'equipment',  label: 'AV & Equipment' },
  { value: 'other',      label: 'Other Facilities' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'all',          label: 'All Availability' },
  { value: 'available',    label: 'Available Only' },
  { value: 'unavailable',  label: 'Unavailable / In-Use' },
  { value: 'maintenance',  label: 'Maintenance' },
];

const SORT_OPTIONS = [
  { value: 'name-asc',       label: 'Name (A → Z)' },
  { value: 'name-desc',      label: 'Name (Z → A)' },
  { value: 'capacity-desc',  label: 'Seating capacity (High → Low)' },
  { value: 'capacity-asc',   label: 'Seating capacity (Low → High)' },
];

// ── Custom Select (Clean Flexbox - Zero Icon Overlap, No Text Cutoffs) ────────
function CustomSelect(props) { return <SupportSelect {...props} />; }

// ── Type and Status Label Helpers ────────────────────────────────────────────
function formatType(type) {
  const map = {
    classroom: 'Classroom',
    lab: 'Laboratory',
    hall: 'Conference Hall',
    equipment: 'Equipment',
    other: 'Facility',
  };
  return map[(type || '').toLowerCase()] || type || 'Facility';
}

function formatStatus(status) {
  const map = {
    available: 'Available',
    unavailable: 'Unavailable',
    maintenance: 'Maintenance',
  };
  return map[(status || '').toLowerCase()] || status || 'Available';
}

// ── Main Component ───────────────────────────────────────────────────────────
const BrowseResources = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState(() => {
    const cached = sectionCache.resources;
    return Array.isArray(cached) ? cached : [];
  });
  const [loading, setLoading] = useState(!sectionCache.resources);
  usePageLoading(loading);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [savedFilters] = useState(() => sectionCache.browseResourceFilters || {});
  const [facultyFilter,setFacultyFilter]=useState(savedFilters.facultyFilter ?? 'all');
  const [searchTerm, setSearchTerm] = useState(savedFilters.searchTerm ?? '');
  const [typeFilter, setTypeFilter] = useState(savedFilters.typeFilter ?? 'all');
  const [availabilityFilter, setAvailabilityFilter] = useState(savedFilters.availabilityFilter ?? 'all');
  const [attendees, setAttendees] = useState(savedFilters.attendees ?? '');
  const [visitDate, setVisitDate] = useState(savedFilters.visitDate ?? '');
  const [startTime, setStartTime] = useState(savedFilters.startTime ?? '');
  const [endTime, setEndTime] = useState(savedFilters.endTime ?? '');
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilityRevision, setAvailabilityRevision] = useState(0);
  const searchKey = [visitDate, startTime, endTime, attendees, availabilityRevision].join('|');
  const hasSlot = Boolean(visitDate || startTime || endTime);
  const capacityValid = !attendees || (/^[1-9]\d*$/.test(attendees) && Number.isSafeInteger(Number(attendees)));
  const slotValid = Boolean(visitDate && startTime && endTime && endTime > startTime && new Date(visitDate+'T'+startTime+':00+05:30') > new Date());
  const currentAvailability = availability?.key === searchKey ? availability.ids : null;
  useEffect(() => {
    if (!hasSlot || !slotValid || !capacityValid) { setChecking(false); return; }
    const controller = new AbortController();
    setChecking(true); setAvailabilityError('');
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({start_time:visitDate+'T'+startTime+':00', end_time:visitDate+'T'+endTime+':00', ...(attendees ? {attendees} : {})});
        const response = await fetch(API_ENDPOINTS.RESOURCES+'/available?'+params, {headers:getAuthHeaders(), signal:controller.signal, cache:'no-store'});
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.message || 'Unable to check availability');
        if (!controller.signal.aborted) setAvailability({key:searchKey, ids:new Set(result.data.resources.map(r=>r.id))});
      } catch (err) { if (!controller.signal.aborted) setAvailabilityError(err.message); }
      finally { if (!controller.signal.aborted) setChecking(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [visitDate, startTime, endTime, attendees, searchKey, hasSlot, slotValid, capacityValid]);
  const [sortBy, setSortBy] = useState(savedFilters.sortBy ?? 'name-asc');

  // Retain the search across navigation, but always recheck live availability.
  // The shared cache clears automatically when the signed-in session changes.
  useEffect(() => {
    sectionCache.browseResourceFilters = {facultyFilter, searchTerm, typeFilter, availabilityFilter, attendees, visitDate, startTime, endTime, sortBy};
  }, [facultyFilter, searchTerm, typeFilter, availabilityFilter, attendees, visitDate, startTime, endTime, sortBy]);
  
  // Modal gallery state
  const [galleryModal, setGalleryModal] = useState({ isOpen: false, images: [], name: '', type: '' });

  const [detailResource, setDetailResource] = useState(null);
  const closeDetails = useCallback(() => setDetailResource(null), []);
  useSectionEnter();

  const fetchResources = async (isInitial = true) => {
    if (!isInitial) setAvailabilityRevision(value=>value+1);
    try {
      if (isInitial && !sectionCache.resources) setLoading(true);
      else setRefreshing(true);
      setError('');

      const response = await fetchList(API_ENDPOINTS.RESOURCES, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resources from catalog');
      }

      const result = await response.json();
      const resourcesData = result.data?.resources || result.data || result;
      const list = Array.isArray(resourcesData) ? resourcesData : [];
      sectionCache.resources = list;
      setResources(list);
    } catch (err) {
      console.error('Error fetching resources:', err);
      if (!sectionCache.resources) {
        setError(err.message || 'Failed to load resources. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResources(!sectionCache.resources);
  }, []);

  // Quick category counts
  const totalCount = resources.length;
  const availableCount = resources.filter((r) => r.status === 'available').length;
  const classroomCount = resources.filter((r) => r.type === 'classroom' || r.type === 'hall').length;
  const techLabCount = resources.filter((r) => r.type === 'lab' || r.type === 'equipment').length;

  // Filter & Sort Logic
  const filteredResources = useMemo(() => {
    if (!capacityValid || (hasSlot && (!slotValid || !currentAvailability || availabilityError))) return [];
    let result = resources.filter(r=>facultyFilter==='all' || (facultyFilter==='campus' ? r.sharing_scope==='campus' : r.faculty_code===facultyFilter)); 

    if (attendees) result = result.filter(r=>r.type !== 'equipment' && Number(r.capacity) >= Number(attendees));
    if (hasSlot) result = result.filter(r=>currentAvailability.has(r.id));
    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((r) => {
        const name = (r.name || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const loc = (r.location || '').toLowerCase();
        const bld = (r.building || '').toLowerCase();
        const type = (r.type || '').toLowerCase();
        return [r.faculty_code,r.asset_code,faculties.find(f=>f.code===r.faculty_code)?.name,r.floor].some(v=>String(v||'').toLowerCase().includes(q)) || name.includes(q) || desc.includes(q) || loc.includes(q) || bld.includes(q) || type.includes(q) || Object.values(resourceDetails(r)).some(value => String(value).toLowerCase().includes(q));
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((r) => (r.type || '').toLowerCase() === typeFilter.toLowerCase());
    }

    // Availability filter
    if (availabilityFilter !== 'all') {
      result = result.filter((r) => (r.status || '').toLowerCase() === availabilityFilter.toLowerCase());
    }

    // Sorting
    result.sort((a, b) => {
      if (attendees && sortBy === 'name-asc') return Number(a.capacity)-Number(b.capacity) || (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      } else if (sortBy === 'capacity-desc') {
        return (b.type === 'equipment' ? 0 : Number(b.capacity) || 0) - (a.type === 'equipment' ? 0 : Number(a.capacity) || 0);
      } else if (sortBy === 'capacity-asc') {
        return (a.type === 'equipment' ? 0 : Number(a.capacity) || 0) - (b.type === 'equipment' ? 0 : Number(b.capacity) || 0);
      }
      return 0;
    });

    return result;
  }, [resources, searchTerm, typeFilter, availabilityFilter, sortBy, facultyFilter, attendees, capacityValid, hasSlot, slotValid, currentAvailability, availabilityError]);

  const handleBookResource = (resourceId) => {
    navigate(`/book-resource/${resourceId}`, {state:{availabilitySearch:{...(slotValid ? {start_date:visitDate,end_date:visitDate,start_time:startTime,end_time:endTime} : {}), ...(attendees ? {attendees:Number(attendees)} : {})}}});
  };

  const resetFilters = () => {
    setAttendees(''); setVisitDate(''); setStartTime(''); setEndTime(''); setAvailability(null); setAvailabilityError('');
    setSearchTerm(''); setFacultyFilter('all');
    setTypeFilter('all');
    setAvailabilityFilter('all');
    setSortBy('name-asc');
  };

  const isFiltering = Boolean(attendees || hasSlot) || facultyFilter !== 'all' || searchTerm !== '' || typeFilter !== 'all' || availabilityFilter !== 'all' || sortBy !== 'name-asc';

  return (
    <>
      <StudentHeader />
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
        <section className="br-page" data-section-content>

          {/* ── Page Hero Header ── */}
          <div className="br-hero">
            <div className="br-hero-left">
              <div className="br-hero__icon">
                <Compass size={32} />
              </div>
              <div>
                <h1 className="br-hero__title">Browse Resources</h1>
                <p className="br-hero__sub">
                  Explore, inspect, and reserve state-of-the-art campus halls, research laboratories, and institutional equipment.
                </p>
              </div>
            </div>

            <div className="br-hero-actions">
              <button
                type="button"
                className="br-hero-btn br-hero-btn--secondary"
                onClick={() => fetchResources(false)}
                disabled={refreshing}
                title="Refresh resource catalog"
              >
                <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
                <span>{refreshing ? 'Updating…' : 'Refresh'}</span>
              </button>
              <Link to="/my-reservations" className="bh-btn-new-res" style={{ textDecoration: 'none' }}>
                <Calendar size={16} />
                <span>My Reservations</span>
              </Link>
            </div>
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div className="bh-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* ── 4 Vivid Frosted-Glass Stat Tiles (Stretched, Equal Height) ── */}
          <div className="br-stats-grid">
            {/* Tile 1: Total Resources */}
            <div className="br-stat-card br-stat-card--total">
              <div className="br-stat-icon">
                <Layers size={22} />
              </div>
              <div className="br-stat-info">
                <div className="br-stat-value">{totalCount}</div>
                <div className="br-stat-label">Total Facilities</div>
              </div>
            </div>

            {/* Tile 2: Available Right Now */}
            <div className="br-stat-card br-stat-card--available">
              <div className="br-stat-icon">
                <CheckCircle size={22} />
              </div>
              <div className="br-stat-info">
                <div className="br-stat-value">{availableCount}</div>
                <div className="br-stat-label">Available Now</div>
              </div>
            </div>

            {/* Tile 3: Classrooms & Halls */}
            <div className="br-stat-card br-stat-card--classrooms">
              <div className="br-stat-icon">
                <GraduationCap size={22} />
              </div>
              <div className="br-stat-info">
                <div className="br-stat-value">{classroomCount}</div>
                <div className="br-stat-label">Classrooms & Halls</div>
              </div>
            </div>

            {/* Tile 4: Labs & Tech Gear */}
            <div className="br-stat-card br-stat-card--labs">
              <div className="br-stat-icon">
                <Cpu size={22} />
              </div>
              <div className="br-stat-info">
                <div className="br-stat-value">{techLabCount}</div>
                <div className="br-stat-label">Labs & AV Gear</div>
              </div>
            </div>
          </div>

          {/* ── Main Catalog Ledger Card ── */}
          <div className="br-catalog-card">
            
            {/* Card Header Band */}
            <div className="br-catalog-card__header">
              <div className="br-header-main">
                <div className="br-header-icon">
                  <Compass size={22} />
                </div>
                <div>
                  <h2 className="br-header-title">Resource Directory</h2>
                  <p className="br-header-sub">Filter and search facilities available for faculty & student reservation</p>
                </div>
              </div>
              <span className="br-header-badge">
                <CheckCircle size={14} />
                {filteredResources.length} Facilities Found
              </span>
            </div>

            {/* Integrated Category Tabs Row */}
            <div className="br-tabs-row">
              <button
                type="button"
                className={`br-tab-chip ${typeFilter === 'all' ? 'br-tab-chip--active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                <span>All Facilities</span>
                <span className="br-tab-chip-count">{totalCount}</span>
              </button>
              <button
                type="button"
                className={`br-tab-chip ${typeFilter === 'classroom' ? 'br-tab-chip--active' : ''}`}
                onClick={() => setTypeFilter('classroom')}
              >
                <span>Classrooms</span>
                <span className="br-tab-chip-count">{resources.filter(r => r.type === 'classroom').length}</span>
              </button>
              <button
                type="button"
                className={`br-tab-chip ${typeFilter === 'lab' ? 'br-tab-chip--active' : ''}`}
                onClick={() => setTypeFilter('lab')}
              >
                <span>Laboratories</span>
                <span className="br-tab-chip-count">{resources.filter(r => r.type === 'lab').length}</span>
              </button>
              <button
                type="button"
                className={`br-tab-chip ${typeFilter === 'hall' ? 'br-tab-chip--active' : ''}`}
                onClick={() => setTypeFilter('hall')}
              >
                <span>Conference Halls</span>
                <span className="br-tab-chip-count">{resources.filter(r => r.type === 'hall').length}</span>
              </button>
              <button
                type="button"
                className={`br-tab-chip ${typeFilter === 'equipment' ? 'br-tab-chip--active' : ''}`}
                onClick={() => setTypeFilter('equipment')}
              >
                <span>Equipment</span>
                <span className="br-tab-chip-count">{resources.filter(r => r.type === 'equipment').length}</span>
              </button>
              <button
                type="button"
                className={`br-tab-chip ${typeFilter === 'other' ? 'br-tab-chip--active' : ''}`}
                onClick={() => setTypeFilter('other')}
              >
                <span>Other</span>
                <span className="br-tab-chip-count">{resources.filter(r => r.type === 'other').length}</span>
              </button>
            </div>

            {/* Filter Controls (Search + Dropdowns) */}
            <div className="br-filter-container">
              {/* Row 1: Search Bar */}
              <div className="br-search-wrap">
                <Search size={17} className="br-search-icon" />
                <input
                  type="text"
                  placeholder="Search by facility name, building, room location, or keywords…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="br-search-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="br-search-clear"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="br-availability-fields">
                <label>Expected attendees<input type="number" min="1" step="1" inputMode="numeric" placeholder="e.g. 45" value={attendees} onChange={e=>setAttendees(e.target.value)} /></label>
                <div className="br-availability-field"><label htmlFor="br-availability-date">Date</label><BookingDatePicker id="br-availability-date" name="visitDate" label="Availability date" value={visitDate} onChange={e=>setVisitDate(e.target.value)} /></div>
                <div className="br-availability-field br-availability-time"><span>Start time</span><ClockTimePicker id="br-availability-start" name="startTime" label="Availability start time" value={startTime} onChange={e=>setStartTime(e.target.value)} /></div>
                <div className="br-availability-field br-availability-time"><span>End time</span><ClockTimePicker id="br-availability-end" name="endTime" label="Availability end time" value={endTime} onChange={e=>setEndTime(e.target.value)} /></div>
              </div>
              <p className="br-availability-help">Enter your group size to find spaces that fit, closest capacity first. Add a date and both times to check live availability. Times are in Sri Lanka time.</p>
              <p className="br-availability-message" role="status" aria-live="polite">{!capacityValid ? 'Enter a positive whole number of attendees.' : hasSlot && !slotValid ? 'Choose a future date and both times, with the end after the start.' : availabilityError || (checking || (hasSlot && !currentAvailability) ? 'Checking availability…' : hasSlot ? 'Showing resources available for your selected time. Availability is rechecked when you book.' : '')}</p>
              {availabilityError && <button type="button" className="br-reset-btn" onClick={()=>setAvailabilityRevision(value=>value+1)}>Retry availability check</button>}
              {/* Faculty, type, availability and sorting filters */}
              <div className="br-filter-controls-row">
                <CustomSelect
                  value={facultyFilter}
                  onChange={setFacultyFilter}
                  placeholder="Faculty / inventory"
                  label="Filter by faculty or campus inventory"
                  options={FACULTY_OPTIONS}
                  icon={<GraduationCap size={15} />}
                  className="br-select--faculty"
                />
                {/* Type Filter */}
                <CustomSelect
                  value={typeFilter}
                  onChange={setTypeFilter}
                  placeholder="Facility Type"
                  options={TYPE_OPTIONS}
                  icon={<Filter size={15} />}
                />

                {/* Availability Filter */}
                <CustomSelect
                  value={availabilityFilter}
                  onChange={setAvailabilityFilter}
                  placeholder="Availability"
                  options={AVAILABILITY_OPTIONS}
                  icon={<Clock size={15} />}
                />

                {/* Sort Order */}
                <CustomSelect
                  value={sortBy}
                  onChange={setSortBy}
                  placeholder="Sort Order"
                  options={SORT_OPTIONS.map(option=>option.value === 'name-asc' && attendees ? {...option,label:'Closest seating fit'} : option)}
                  icon={<ArrowUpDown size={15} />}
                />

                {/* Reset Filters Shortcut */}
                {isFiltering && (
                  <button type="button" className="br-reset-btn" onClick={resetFilters} title="Reset all filters">
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Counter & Reset Sub-bar */}
            <div className="br-results-bar">
              <span className="br-results-count">
                Showing <strong>{filteredResources.length}</strong> of <strong>{resources.length}</strong> catalog facilities
              </span>
              {isFiltering && (
                <button type="button" className="br-reset-btn" onClick={resetFilters} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                  Clear Filters
                </button>
              )}
            </div>

            {/* ── Cards Grid ── */}
            {hasSlot && (checking || !currentAvailability || availabilityError || !slotValid) ? <div className="br-empty-state" role="status">{availabilityError || (!slotValid ? 'Complete your date and time filters to see available resources.' : checking ? 'Checking live availability…' : 'Availability could not be checked. Change the filters to try again.')}</div> : filteredResources.length === 0 ? (
              <div className="br-empty-state">
                <div className="br-empty-icon-wrap">
                  <Compass size={36} />
                </div>
                <h3 className="br-empty-title">No Matching Facilities</h3>
                <p className="br-empty-sub">
                  We could not find any resources matching your search criteria. Try modifying your search keywords or resetting active filters.
                </p>
                {isFiltering && (
                  <button type="button" className="br-empty-btn" onClick={resetFilters}>
                    Clear Active Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="br-cards-grid">
                {filteredResources.map((resource) => {
                  const resImgs = Array.isArray(resource.images)
                    ? resource.images
                    : typeof resource.images === 'string' && resource.images.trim()
                    ? (() => { try { return JSON.parse(resource.images); } catch { return [resource.images]; } })()
                    : [];
                  const hasPhotos = resImgs.length > 0;
                  const resId = resource.id || resource.resource_id;
                  const normalizedType = (resource.type || 'other').toLowerCase();
                  const isAvailable = resource.status === 'available';
                  const locationString = [resource.building, resource.floor, resource.location].filter(Boolean).join(' · ') || 'Campus Facility';

                  return (
                    <div
                      key={resId}
                      className="br-card"
                    >
                      {/* Media Area (Thumbnail / Photos) */}
                      <div
                        className="br-card-media"
                        onClick={hasPhotos ? () => {
                          setGalleryModal({
                            isOpen: true,
                            images: resImgs,
                            name: resource.name,
                            type: resource.type,
                          });
                        } : undefined}
                      >
                        <ResourceThumbnail
                          images={resource.images}
                          type={resource.type}
                          name={resource.name}
                          size="md"
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
                      </div>

                      {/* Card Body */}
                      <div className="br-card-body">
                        {/* Badges Row - Clean and Unobstructed */}
                        <div className="br-card-badges-row">
                          <span className={`br-type-pill br-type-pill--${normalizedType}`}>
                            {formatType(resource.type)}
                          </span>
                          <span className={`br-status-pill br-status-pill--${resource.status || 'available'}`}>
                            <span className="br-status-dot" />
                            {formatStatus(resource.status)}
                          </span>
                        </div>

                        <h3 className="br-card-title">{resource.name}</h3><p className="catalog-subline">{faculties.find(f=>f.code===resource.faculty_code)?.name} · {resource.asset_code}{resource.is_sample ? " · Sample" : ""}{resource.sharing_scope === "campus" ? " · Shared across faculties" : ""}</p>

                        <p className="br-card-desc" title={resource.description}>
                          {resource.description || (normalizedType === 'equipment' ? 'Check specifications, accessories and collection details before reserving this item.' : 'Review seating capacity, facilities and access details for this campus space.')}
                        </p>

                        {/* Meta Tags */}
                        <div className="br-card-meta">
                          <span className="br-meta-item" title={locationString}>
                            <MapPin size={13} />
                            <span>{locationString}</span>
                          </span>

                          <span className="br-meta-item">
                            {normalizedType === 'equipment' ? <Cpu size={13}/> : <Users size={13}/>}
                            <span>{normalizedType === 'equipment' ? resourceDetails(resource).brand_model || 'Equipment / kit' : (resource.capacity ? 'Seats ' + resource.capacity + (attendees ? ' · Fits your group' : '') : 'Seating not specified')}</span>
                          </span>

                          {resource.building && (
                            <span className="br-meta-item">
                              <Building size={13} />
                              <span>{resource.building}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="br-card-footer">
                        <button type="button" className="br-view-photos-btn" onClick={() => setDetailResource(resource)}>View details <ChevronRight size={14}/></button>
                        {hasPhotos && (
                          <button
                            type="button"
                            className="br-view-photos-btn"
                            onClick={() => {
                              setGalleryModal({
                                isOpen: true,
                                images: resImgs,
                                name: resource.name,
                                type: resource.type,
                              });
                            }}
                            title="View high-resolution photo gallery"
                          >
                            <Camera size={14} />
                            <span>{resImgs.length} Photos</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="br-book-btn"
                          onClick={() => handleBookResource(resId)}
                          disabled={!isAvailable}
                        >
                          <span>{isAvailable ? (normalizedType === 'equipment' ? 'Reserve item' : 'Reserve space') : 'Unavailable'}</span>
                          {isAvailable && <ChevronRight size={16} />}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </section>
      </main>

      {detailResource && <ResourceDetailsModal resource={detailResource} onClose={closeDetails} onBook={id => { setDetailResource(null); handleBookResource(id); }} />}
      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={galleryModal.isOpen}
        onClose={() => setGalleryModal({ isOpen: false, images: [], name: '', type: '' })}
        images={galleryModal.images}
        resourceName={galleryModal.name}
        resourceType={galleryModal.type}
      />

      
      <FloatingFeedbackButton />

    </>
  );
};

export default BrowseResources;
