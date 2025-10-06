import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Availability.css'

function Availability() {
  const navigate = useNavigate()
  const [filteredResources, setFilteredResources] = useState([])
  const [currentView, setCurrentView] = useState('grid')
  const [selectedResource, setSelectedResource] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({
    resourceType: '',
    date: '',
    timeFilter: '',
    capacity: '',
    building: '',
    search: ''
  })

  // Sample data 
  const resources = [
    {
      id: 'eng-lab-01',
      name: 'Computer Lab A',
      type: 'laboratory',
      faculty: 'engineering',
      building: 'Engineering Building A',
      capacity: 40,
      equipment: ['Computers', 'Projector', 'Whiteboard'],
      status: 'available',
      location: 'Floor 2, Room 201'
    },
    {
      id: 'eng-lab-02',
      name: 'Computer Lab B',
      type: 'laboratory',
      faculty: 'engineering',
      building: 'Engineering Building A',
      capacity: 35,
      equipment: ['Computers', 'Projector', 'Interactive Board'],
      status: 'available',
      location: 'Floor 2, Room 202'
    },
    {
      id: 'eng-hall-01',
      name: 'Engineering Lecture Hall',
      type: 'lecture-hall',
      faculty: 'engineering',
      building: 'Engineering Building B',
      capacity: 80,
      equipment: ['Projector', 'Sound System', 'Microphone'],
      status: 'available',
      location: 'Floor 1, Hall 101'
    },
    {
      id: 'eng-hall-02',
      name: 'Engineering Seminar Room',
      type: 'lecture-hall',
      faculty: 'engineering',
      building: 'Engineering Building B',
      capacity: 50,
      equipment: ['Projector', 'Whiteboard', 'Video Conferencing'],
      status: 'occupied',
      location: 'Floor 2, Room 210'
    },
    {
      id: 'sci-lab-01',
      name: 'Chemistry Lab',
      type: 'laboratory',
      faculty: 'science',
      building: 'Science Complex',
      capacity: 30,
      equipment: ['Lab Equipment', 'Fume Hoods', 'Safety Equipment'],
      status: 'available',
      location: 'Floor 3, Lab 301'
    },
    {
      id: 'sci-lab-02',
      name: 'Physics Lab',
      type: 'laboratory',
      faculty: 'science',
      building: 'Science Complex',
      capacity: 25,
      equipment: ['Oscilloscopes', 'Multimeters', 'Lab Benches'],
      status: 'maintenance',
      location: 'Floor 2, Lab 201'
    },
    {
      id: 'sci-hall-01',
      name: 'Science Lecture Hall',
      type: 'lecture-hall',
      faculty: 'science',
      building: 'Science Complex',
      capacity: 60,
      equipment: ['Projector', 'Lab Demo Setup'],
      status: 'occupied',
      location: 'Floor 1, Hall 105'
    },
    {
      id: 'bus-room-01',
      name: 'Business Meeting Room',
      type: 'meeting-room',
      faculty: 'business',
      building: 'Business Building',
      capacity: 20,
      equipment: ['Conference Table', 'Projector', 'Flipchart'],
      status: 'available',
      location: 'Floor 3, Room 301'
    },
    {
      id: 'bus-hall-01',
      name: 'Business Lecture Hall',
      type: 'lecture-hall',
      faculty: 'business',
      building: 'Business Building',
      capacity: 100,
      equipment: ['Projector', 'Sound System', 'Document Camera'],
      status: 'available',
      location: 'Floor 1, Hall 110'
    },
    {
      id: 'arts-room-01',
      name: 'Art Studio A',
      type: 'meeting-room',
      faculty: 'arts',
      building: 'Arts Building',
      capacity: 15,
      equipment: ['Easels', 'Art Supplies', 'Natural Lighting'],
      status: 'available',
      location: 'Floor 2, Studio 201'
    },
    {
      id: 'arts-hall-01',
      name: 'Arts Lecture Hall',
      type: 'lecture-hall',
      faculty: 'arts',
      building: 'Arts Building',
      capacity: 45,
      equipment: ['Projector', 'Art Display Screens'],
      status: 'available',
      location: 'Floor 1, Hall 101'
    },
    {
      id: 'med-lab-01',
      name: 'Medical Simulation Lab',
      type: 'laboratory',
      faculty: 'medicine',
      building: 'Medical Building',
      capacity: 20,
      equipment: ['Medical Simulators', 'Monitoring Equipment', 'Emergency Cart'],
      status: 'available',
      location: 'Floor 2, Lab 205'
    },
    {
      id: 'med-room-01',
      name: 'Medical Conference Room',
      type: 'meeting-room',
      faculty: 'medicine',
      building: 'Medical Building',
      capacity: 12,
      equipment: ['Medical Imaging Display', 'Conference Table', 'Video Conferencing'],
      status: 'reserved',
      location: 'Floor 3, Room 310'
    },
    {
      id: 'gen-aud-01',
      name: 'Main Auditorium',
      type: 'auditorium',
      faculty: 'general',
      building: 'Main Building',
      capacity: 300,
      equipment: ['Stage Lighting', 'Sound System', 'Projector', 'Microphones'],
      status: 'available',
      location: 'Ground Floor'
    },
    {
      id: 'gen-aud-02',
      name: 'Secondary Auditorium',
      type: 'auditorium',
      faculty: 'general',
      building: 'Main Building',
      capacity: 150,
      equipment: ['Sound System', 'Projector', 'Stage'],
      status: 'maintenance',
      location: 'Floor 1, Hall 120'
    },
    {
      id: 'gen-meet-01',
      name: 'Conference Room A',
      type: 'meeting-room',
      faculty: 'general',
      building: 'Administration Building',
      capacity: 15,
      equipment: ['Conference Table', 'Projector', 'Video Conferencing'],
      status: 'available',
      location: 'Floor 2, Room 205'
    },
    {
      id: 'gen-meet-02',
      name: 'Conference Room B',
      type: 'meeting-room',
      faculty: 'general',
      building: 'Administration Building',
      capacity: 10,
      equipment: ['Round Table', 'TV Display', 'Whiteboard'],
      status: 'occupied',
      location: 'Floor 2, Room 206'
    }
  ]

  const faculties = [
    { id: 'engineering', name: 'Engineering' },
    { id: 'science', name: 'Science' },
    { id: 'business', name: 'Business' },
    { id: 'arts', name: 'Arts & Humanities' },
    { id: 'medicine', name: 'Medicine' },
    { id: 'general', name: 'General' }
  ]

  const timeSlots = [
    { id: '1', startTime: '08:00', endTime: '09:00', status: 'available' },
    { id: '2', startTime: '09:00', endTime: '10:00', status: 'available' },
    { id: '3', startTime: '10:00', endTime: '11:00', status: 'booked' },
    { id: '4', startTime: '11:00', endTime: '12:00', status: 'available' },
    { id: '5', startTime: '12:00', endTime: '13:00', status: 'lunch' },
    { id: '6', startTime: '13:00', endTime: '14:00', status: 'available' },
    { id: '7', startTime: '14:00', endTime: '15:00', status: 'available' },
    { id: '8', startTime: '15:00', endTime: '16:00', status: 'booked' },
    { id: '9', startTime: '16:00', endTime: '17:00', status: 'available' }
  ]

  const formatLocation = (resource) => {
    const building = resource.building?.trim()
    const location = resource.location?.trim()
    if (building && location) return `${building}, ${location}`
    return building || location || ''
  }

  const filterResources = useCallback(() => {
    let filtered = resources.filter(
      (resource) => !resource.name.toLowerCase().includes('gymnasium') && !resource.name.toLowerCase().includes('gym')
    )

    if (filters.resourceType) {
      filtered = filtered.filter((r) => r.type === filters.resourceType)
    }
    if (filters.building) {
      filtered = filtered.filter((r) => r.faculty === filters.building)
    }
    if (filters.capacity) {
      filtered = filtered.filter((r) => r.capacity >= parseInt(filters.capacity))
    }
    if (filters.search) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          r.faculty.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    setFilteredResources(filtered)
  }, [filters])

  useEffect(() => {
    filterResources()
  }, [filterResources])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      resourceType: '',
      date: '',
      timeFilter: '',
      capacity: '',
      building: '',
      search: ''
    })
  }

  const switchView = (view) => {
    setCurrentView(view)
  }

  const openResourceModal = (resource) => {
    setSelectedResource(resource)
    setShowModal(true)
  }

  const closeResourceModal = () => {
    setShowModal(false)
    setSelectedResource(null)
  }

  const bookResource = () => {
    if (selectedResource) {
      navigate(`/reservation?resourceId=${selectedResource.id}&faculty=${selectedResource.faculty}&type=${selectedResource.type}`)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'status-available'
      case 'occupied': return 'status-occupied'
      case 'maintenance': return 'status-maintenance'
      case 'reserved': return 'status-reserved'
      default: return 'status-default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return '✅'
      case 'occupied': return '❌'
      case 'maintenance': return '🔧'
      case 'reserved': return '📅'
      default: return '❓'
    }
  }

  const stats = {
    available: filteredResources.filter((r) => r.status === 'available').length,
    occupied: filteredResources.filter((r) => r.status === 'occupied').length,
    maintenance: filteredResources.filter((r) => r.status === 'maintenance').length,
    total: filteredResources.length
  }

  return (
    <div className="availability">
      <div className="availability-container">
        {/* Header */}
        <header className="page-header">
          <div className="header-content">
            <div className="header-left">
              <h1>Resource Availability</h1>
              <p>Check real-time availability of university resources</p>
            </div>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search resources, faculties..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
        </header>

        {/* Filters */}
        <section className="filters-section">
          <div className="filters-container">
            <h3>🔧 Filter Resources</h3>
            <div className="filters-grid">
              <select
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="lecture-hall">Lecture Halls</option>
                <option value="laboratory">Laboratories</option>
                <option value="auditorium">Auditoriums</option>
                <option value="meeting-room">Meeting Rooms</option>
                <option value="equipment">Equipment</option>
              </select>

              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="filter-input"
              />

              <select
                value={filters.timeFilter}
                onChange={(e) => handleFilterChange('timeFilter', e.target.value)}
                className="filter-select"
              >
                <option value="">All Day</option>
                <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
                <option value="evening">Evening (5:00 PM - 9:00 PM)</option>
              </select>

              <input
                type="number"
                placeholder="Min Capacity"
                value={filters.capacity}
                onChange={(e) => handleFilterChange('capacity', e.target.value)}
                className="filter-input"
              />

              <select
                value={filters.building}
                onChange={(e) => handleFilterChange('building', e.target.value)}
                className="filter-select"
              >
                <option value="">All Faculties</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-buttons">
              <button onClick={filterResources} className="btn btn-primary">
                🔍 Apply Filters
              </button>
              <button onClick={clearFilters} className="btn btn-secondary">
                ❌ Clear All
              </button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card available">
              <div className="stat-icon">✅</div>
              <div className="stat-number">{stats.available}</div>
              <div className="stat-label">Available Now</div>
            </div>
            <div className="stat-card occupied">
              <div className="stat-icon">❌</div>
              <div className="stat-number">{stats.occupied}</div>
              <div className="stat-label">Currently Occupied</div>
            </div>
            <div className="stat-card maintenance">
              <div className="stat-icon">🔧</div>
              <div className="stat-number">{stats.maintenance}</div>
              <div className="stat-label">Under Maintenance</div>
            </div>
            <div className="stat-card total">
              <div className="stat-icon">🏢</div>
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Resources</div>
            </div>
          </div>
        </section>

        {/* View Toggle */}
        <section className="view-toggle">
          <div className="toggle-container">
            <button
              onClick={() => switchView('grid')}
              className={`toggle-btn ${currentView === 'grid' ? 'active' : ''}`}
            >
              🔲 Grid View
            </button>
            <button
              onClick={() => switchView('list')}
              className={`toggle-btn ${currentView === 'list' ? 'active' : ''}`}
            >
              📋 List View
            </button>
          </div>
        </section>

        {/* Resources Display */}
        <section className="resources-section">
          {currentView === 'grid' && (
            <div className="resources-grid">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="resource-card"
                  onClick={() => openResourceModal(resource)}
                >
                  <div className="resource-header">
                    <h3>{resource.name}</h3>
                    <span className={`status-icon ${getStatusColor(resource.status)}`}>
                      {getStatusIcon(resource.status)}
                    </span>
                  </div>
                  <p className="resource-location">{formatLocation(resource)}</p>
                  <div className="resource-info">
                    <span>👥 {resource.capacity} people</span>
                    <span className={`status-text ${getStatusColor(resource.status)}`}>
                      {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                    </span>
                  </div>
                  <div className="equipment-tags">
                    {resource.equipment.slice(0, 2).map((eq, idx) => (
                      <span key={idx} className="equipment-tag">
                        {eq}
                      </span>
                    ))}
                    {resource.equipment.length > 2 && (
                      <span className="equipment-tag more">
                        +{resource.equipment.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentView === 'list' && (
            <div className="resources-list">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="resource-list-item"
                  onClick={() => openResourceModal(resource)}
                >
                  <div className="list-content">
                    <div className="list-header">
                      <h3>{resource.name}</h3>
                      <span className={`status-icon ${getStatusColor(resource.status)}`}>
                        {getStatusIcon(resource.status)}
                      </span>
                      <span className={`status-badge ${getStatusColor(resource.status)}`}>
                        {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                      </span>
                    </div>
                    <p className="list-location">{formatLocation(resource)}</p>
                    <div className="list-details">
                      <span>👥 {resource.capacity} people</span>
                      <span>🏢 {resource.faculty}</span>
                      <span>🔧 {resource.equipment.join(', ')}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openResourceModal(resource)
                    }}
                    className="btn btn-primary"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Legend */}
        <section className="legend-section">
          <div className="legend-container">
            <h4>ℹ️ Status Legend</h4>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color available"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="legend-color occupied"></div>
                <span>Occupied</span>
              </div>
              <div className="legend-item">
                <div className="legend-color maintenance"></div>
                <span>Maintenance</span>
              </div>
              <div className="legend-item">
                <div className="legend-color reserved"></div>
                <span>Reserved</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Resource Details Modal */}
      {showModal && selectedResource && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>{selectedResource.name}</h2>
                <span className={`status-badge ${getStatusColor(selectedResource.status)}`}>
                  {selectedResource.status.charAt(0).toUpperCase() + selectedResource.status.slice(1)}
                </span>
              </div>
              <button onClick={closeResourceModal} className="close-btn">
                ❌
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  <span>Location: <strong>{formatLocation(selectedResource)}</strong></span>
                </div>
                <div className="info-item">
                  <span className="info-icon">👥</span>
                  <span>Capacity: <strong>{selectedResource.capacity} people</strong></span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🎓</span>
                  <span>Faculty: <strong>{selectedResource.faculty}</strong></span>
                </div>
                <div className="info-item">
                  <span className="info-icon">⚙️</span>
                  <span>Equipment: <strong>{selectedResource.equipment.join(', ')}</strong></span>
                </div>
              </div>

              <div className="schedule-section">
                <h4>Today's Schedule</h4>
                <div className="schedule-grid">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`schedule-slot ${slot.status}`}
                    >
                      <div className="slot-time">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="slot-status">
                        {slot.status === 'lunch' ? 'Lunch Break' : slot.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={bookResource} className="btn btn-primary">
                📅 Book This Resource
              </button>
              <button onClick={closeResourceModal} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Availability