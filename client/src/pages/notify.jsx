import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, X, User, Calendar, AlertCircle, Filter, Search, MoreVertical } from 'lucide-react';
import "../css/notify.css";

// Main Notifications Component
const NotificationsPage = () => {
  // State for notifications data
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Sample notifications data
  const initialNotifications = [
    {
      id: 1,
      type: 'approved',
      title: 'Reservation Approved',
      message: 'Reservation for Library SR 3 on 2025-06-11 has been approved.',
      time: '5 minutes ago',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'pending',
      title: 'Reservation Pending',
      message: 'Request for Lab Room 203 on 2025-06-14 is pending admin approval.',
      time: '2 hours ago',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'rejected',
      title: 'Reservation Rejected',
      message: 'Reservation for Conference Hall on 2025-06-12 has been rejected.',
      time: '1 day ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      priority: 'medium'
    },
    {
      id: 4,
      type: 'registration',
      title: 'User Registration',
      message: 'Amali is registered as a new user in the system.',
      time: '2 days ago',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
      priority: 'low'
    },
    {
      id: 5,
      type: 'approved',
      title: 'Booking Confirmed',
      message: 'Computer Lab A booking for 2025-06-15 has been confirmed.',
      time: '3 days ago',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
      priority: 'high'
    },
    {
      id: 6,
      type: 'pending',
      title: 'Equipment Request',
      message: 'New equipment request for Projector in Room 205 requires approval.',
      time: '4 days ago',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    }
  ];

  // Load notifications on component mount
  useEffect(() => {
    // Simulate API call
    const loadNotifications = async () => {
      setLoading(true);
      // Simulate loading delay
      setTimeout(() => {
        setNotifications(initialNotifications);
        setFilteredNotifications(initialNotifications);
        setLoading(false);
      }, 1000);
    };

    loadNotifications();
  }, []);

  // Filter notifications based on type and search term
  useEffect(() => {
    let filtered = notifications;

    // Filter by type
    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = filtered.filter(notification => !notification.read);
      } else {
        filtered = filtered.filter(notification => notification.type === filter);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter, searchTerm]);

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="background">
    <div className="notifications-page">
      {/* Page Header */}
      <div className="notifications-header">
        <div className="header-content">
          <div className="title-section">
            <div className="title-with-icon">
              <Bell className="header-icon" size={32} />
              <div>
                <h1>Notifications</h1>
                <p>Here are your recent updates</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button 
              className="mark-all-btn"
              onClick={markAllAsRead}
            >
              <Check size={16} />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="notifications-controls">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <Filter className="filter-icon" size={16} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="registration">Registration</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <EmptyState searchTerm={searchTerm} filter={filter} />
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>
    </div>
    </div>
  );
};

// Individual Notification Item Component
const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approved':
        return <Check className="notification-type-icon approved-icon" size={24} />;
      case 'pending':
        return <Clock className="notification-type-icon pending-icon" size={24} />;
      case 'rejected':
        return <X className="notification-type-icon rejected-icon" size={24} />;
      case 'registration':
        return <User className="notification-type-icon registration-icon" size={24} />;
      default:
        return <Bell className="notification-type-icon default-icon" size={24} />;
    }
  };

  // Get priority indicator
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className={`notification-item ${notification.type} ${!notification.read ? 'unread' : 'read'}`}>
      <div className={`priority-indicator ${getPriorityClass(notification.priority)}`}></div>
      
      <div className="notification-icon">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="notification-content">
        <div className="notification-header">
          <h3 className="notification-title">{notification.title}</h3>
          <div className="notification-actions">
            <span className="notification-time">{notification.time}</span>
            <button 
              className="menu-toggle"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="notification-menu">
                {!notification.read && (
                  <button 
                    onClick={() => {
                      onMarkAsRead(notification.id);
                      setShowMenu(false);
                    }}
                    className="menu-item"
                  >
                    <Check size={14} />
                    Mark as read
                  </button>
                )}
                <button 
                  onClick={() => {
                    onDelete(notification.id);
                    setShowMenu(false);
                  }}
                  className="menu-item delete"
                >
                  <X size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="notification-message">{notification.message}</p>
      </div>
      
      {!notification.read && <div className="unread-indicator"></div>}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ searchTerm, filter }) => {
  const getEmptyMessage = () => {
    if (searchTerm) {
      return `No notifications found for "${searchTerm}"`;
    }
    if (filter === 'unread') {
      return 'No unread notifications';
    }
    if (filter !== 'all') {
      return `No ${filter} notifications`;
    }
    return 'No notifications available';
  };

  return (
    <div className="empty-state">
      <AlertCircle className="empty-icon" size={64} />
      <h3>{getEmptyMessage()}</h3>
      <p>Check back later for new updates</p>
    </div>
  );
};

// Loading Skeleton Component
const NotificationsSkeleton = () => {
  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="skeleton skeleton-header"></div>
      </div>
      <div className="notifications-controls">
        <div className="skeleton skeleton-search"></div>
        <div className="skeleton skeleton-filter"></div>
      </div>
      <div className="notifications-list">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-notification">
            <div className="skeleton skeleton-icon"></div>
            <div className="skeleton-content">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-message"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;