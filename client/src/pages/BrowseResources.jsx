import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentHeader from '../components/StudentHeader';
import Footer from '../components/footer';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';
import FloatingHelpButton from '../components/FloatingHelpButton';
import { Search, Filter, BookOpen, Users, MapPin, Clock } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import '../assets/css/student.css';

const BrowseResources = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  const resourceTypes = [
    'all',
    'Classroom',
    'Laboratory',
    'Conference Room',
    'Auditorium',
    'Sports Facility',
    'Equipment',
    'Other'
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, typeFilter, availabilityFilter]);

  const fetchResources = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.RESOURCES, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const result = await response.json();
      // Handle both formats: direct array or nested in data.resources
      const resourcesData = result.data?.resources || result;
      setResources(Array.isArray(resourcesData) ? resourcesData : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources. Please try again.');
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = [...resources];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (resource) =>
          resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((resource) => resource.type === typeFilter);
    }

    // Availability filter
    if (availabilityFilter === 'available') {
      filtered = filtered.filter((resource) => resource.status === 'available');
    } else if (availabilityFilter === 'unavailable') {
      filtered = filtered.filter((resource) => resource.status === 'unavailable');
    }

    setFilteredResources(filtered);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'Classroom':
      case 'Laboratory':
        return <BookOpen className="resource-icon" />;
      case 'Conference Room':
      case 'Auditorium':
        return <Users className="resource-icon" />;
      default:
        return <MapPin className="resource-icon" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'available' ? 'status-badge-available' : 'status-badge-unavailable';
  };

  const handleBookResource = (resourceId) => {
    navigate(`/book-resource/${resourceId}`);
  };

  if (loading) {
    return (
      <>
        <StudentHeader />
        <div className="student-dashboard">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading resources...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <StudentHeader />
      <div className="student-dashboard browse-resources-page">
        <div className="dashboard-content">
          <div className="page-header">
            <h1 className="page-title">
              <span className="highlight-text">Browse</span> Resources
            </h1>
            <p className="page-subtitle">
              Explore and book available resources for your academic needs
            </p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {/* Filters Section */}
          <div className="filters-section">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search resources by name, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <Filter className="filter-icon" />
                <select
                  className="filter-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {resourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <Clock className="filter-icon" />
                <select
                  className="filter-select"
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <option value="all">All Resources</option>
                  <option value="available">Available Only</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="results-count">
            <p>
              Found <span className="count-highlight">{filteredResources.length}</span>{' '}
              {filteredResources.length === 1 ? 'resource' : 'resources'}
            </p>
          </div>

          {/* Resources Grid */}
          {filteredResources.length === 0 ? (
            <div className="no-resources">
              <BookOpen size={64} className="no-resources-icon" />
              <h3>No Resources Found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="resources-grid">
              {filteredResources.map((resource, index) => (
                <div
                  key={resource.resource_id}
                  className="resource-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="resource-card-header">
                    <div className="resource-icon-wrapper">
                      {getResourceIcon(resource.type)}
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(resource.status)}`}>
                      {resource.status}
                    </span>
                  </div>

                  <div className="resource-card-body">
                    <h3 className="resource-name">{resource.name}</h3>
                    <p className="resource-type">{resource.type}</p>
                    <p className="resource-description">{resource.description}</p>

                    <div className="resource-details">
                      <div className="resource-detail-item">
                        <MapPin size={16} />
                        <span>{resource.location}</span>
                      </div>
                      <div className="resource-detail-item">
                        <Users size={16} />
                        <span>Capacity: {resource.capacity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="resource-card-footer">
                    <button
                      className="book-button"
                      onClick={() => handleBookResource(resource.id || resource.resource_id)}
                      disabled={resource.status !== 'available'}
                    >
                      {resource.status === 'available' ? 'Book Now' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <FloatingFeedbackButton />
      <FloatingHelpButton />
    </>
  );
};

export default BrowseResources;
