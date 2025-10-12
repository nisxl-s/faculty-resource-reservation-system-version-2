import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, X, User, Calendar, AlertCircle, Filter, Search, MoreVertical, Trash2, CheckCheck } from 'lucide-react';
import "../assets/css/notify.css";
import "../assets/css/user_management.css";
import "../assets/css/global.css";
import "../assets/css/navbar.css";
import AdminHeader from '../components/AdminHeader';
import Footer from '../components/footer/Footer';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';

// Main Notifications Component
const NotificationsPage = () => {
  const navigate = useNavigate();
  
  // State for notifications data
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return notificationDate.toLocaleDateString();
  };

  // Map notification type from database to UI type
  const mapNotificationType = (dbType) => {
    const typeMap = {
      // Database enum types (info, success, warning, error)
      'success': 'approved',
      'error': 'rejected',
      'warning': 'pending',
      'info': 'registration',
      // Legacy types for backward compatibility
      'reservation_approved': 'approved',
      'reservation_rejected': 'rejected',
      'reservation_pending': 'pending',
      'reservation_cancelled': 'rejected',
      'user_registered': 'registration',
      'system': 'registration'
    };
    return typeMap[dbType] || 'registration';
  };

  // Load notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        const user = getCurrentUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Use appropriate endpoint based on user role
        const endpoint = user.role === 'admin' 
          ? API_ENDPOINTS.NOTIFICATIONS_ALL 
          : API_ENDPOINTS.NOTIFICATIONS;

        // Fetch notifications from backend
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', response.status, errorText);
          throw new Error(`Failed to fetch notifications: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Notifications API Response:', data);
        
        // Check if response has data
        if (!data.success || !data.data || !data.data.notifications) {
          console.error('Invalid response structure:', data);
          throw new Error('Invalid response format from server');
        }
        
        // Transform backend data to match UI structure
        const transformedNotifications = data.data.notifications.map(notification => ({
          id: notification.notification_id,
          type: mapNotificationType(notification.type),
          title: notification.title,
          message: notification.message,
          time: formatRelativeTime(notification.created_at),
          timestamp: new Date(notification.created_at),
          read: notification.is_read === 1,
          priority: notification.type.includes('approved') ? 'high' : 
                   notification.type.includes('rejected') ? 'medium' : 'low',
          user_name: notification.user_name,
          resource_name: notification.resource_name,
          reservation_id: notification.reservation_id
        }));

        setNotifications(transformedNotifications);
        setFilteredNotifications(transformedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

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
  const markAsRead = async (id) => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATION_READ(id), {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATION_READ_ALL, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATION_DELETE(id), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== id)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="background" style={{paddingTop: '130px'}}>
          <NotificationsSkeleton />
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminHeader />
        <div className="background" style={{paddingTop: '130px'}}>
          <div className="user-management-page">
            <div className="error-state" style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(25px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <AlertCircle size={64} color="#ef4444" style={{marginBottom: '20px'}} />
              <h3 style={{color: '#fff', marginBottom: '10px'}}>Error Loading Notifications</h3>
              <p style={{color: 'rgba(255, 255, 255, 0.7)'}}>{error}</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
    <AdminHeader />
    <div className="background" style={{paddingTop: '160px'}}>
    <div className="user-management-page" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px'
    }}>
      {/* Page Header with Glassmorphism */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '30px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
              borderRadius: '15px',
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell size={32} color="#fff" />
            </div>
            <div>
              <h1 style={{
                color: '#fff',
                fontSize: '32px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}>Notifications</h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px',
                margin: 0
              }}>Stay updated with your recent activities</p>
            </div>
            {unreadCount > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '30px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}>{unreadCount} unread</span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3))';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search with Glassmorphism */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: '1',
          minWidth: '300px',
          position: 'relative'
        }}>
          <Search 
            size={20} 
            style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 15px 12px 45px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(25px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
        </div>

        <div style={{position: 'relative', minWidth: '200px'}}>
          <Filter 
            size={16} 
            style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none'
            }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 15px 12px 40px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(25px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <option value="all" style={{background: '#1a1a1a', color: '#fff'}}>All Notifications</option>
            <option value="unread" style={{background: '#1a1a1a', color: '#fff'}}>Unread Only</option>
            <option value="approved" style={{background: '#1a1a1a', color: '#fff'}}>Approved</option>
            <option value="pending" style={{background: '#1a1a1a', color: '#fff'}}>Pending</option>
            <option value="rejected" style={{background: '#1a1a1a', color: '#fff'}}>Rejected</option>
            <option value="registration" style={{background: '#1a1a1a', color: '#fff'}}>Registration</option>
          </select>
        </div>
      </div>

      {/* Notifications List with Glassmorphism */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
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
    <Footer />
    </>
  );
};

// Individual Notification Item Component
const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Get notification icon and color based on type
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'approved':
        return {
          icon: <Check size={24} />,
          bgColor: 'rgba(34, 197, 94, 0.15)',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          iconColor: '#22c55e'
        };
      case 'pending':
        return {
          icon: <Clock size={24} />,
          bgColor: 'rgba(234, 179, 8, 0.15)',
          borderColor: 'rgba(234, 179, 8, 0.3)',
          iconColor: '#eab308'
        };
      case 'rejected':
        return {
          icon: <X size={24} />,
          bgColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          iconColor: '#ef4444'
        };
      case 'registration':
        return {
          icon: <User size={24} />,
          bgColor: 'rgba(59, 130, 246, 0.15)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          iconColor: '#3b82f6'
        };
      default:
        return {
          icon: <Bell size={24} />,
          bgColor: 'rgba(168, 85, 247, 0.15)',
          borderColor: 'rgba(168, 85, 247, 0.3)',
          iconColor: '#a855f7'
        };
    }
  };

  const style = getNotificationStyle(notification.type);

  return (
    <div style={{
      background: notification.read 
        ? 'rgba(255, 255, 255, 0.03)' 
        : 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      borderRadius: '12px',
      padding: '14px 16px',
      border: `1px solid ${notification.read ? 'rgba(255, 255, 255, 0.05)' : style.borderColor}`,
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
      position: 'relative',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      boxShadow: notification.read 
        ? '0 3px 10px rgba(0, 0, 0, 0.08)' 
        : '0 4px 15px rgba(0, 0, 0, 0.15)'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = notification.read 
        ? '0 3px 10px rgba(0, 0, 0, 0.08)' 
        : '0 4px 15px rgba(0, 0, 0, 0.15)';
    }}>
      {/* Icon */}
      <div style={{
        background: style.bgColor,
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${style.borderColor}`,
        flexShrink: 0,
        color: style.iconColor,
        width: '40px',
        height: '40px'
      }}>
        {React.cloneElement(style.icon, { size: 20 })}
      </div>
      
      {/* Content */}
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '6px',
          gap: '12px'
        }}>
          <h3 style={{
            color: '#fff',
            fontSize: '15px',
            fontWeight: '600',
            margin: 0,
            flex: 1,
            lineHeight: '1.4'
          }}>{notification.title}</h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}>
            <span style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}>{notification.time}</span>
            
            <div style={{position: 'relative'}}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <MoreVertical size={16} />
              </button>
              
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'rgba(30, 30, 30, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                  zIndex: 1000,
                  minWidth: '160px',
                  overflow: 'hidden'
                }}>
                  {!notification.read && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Check size={14} />
                      Mark as read
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notification.id);
                      setShowMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '13px',
          margin: 0,
          lineHeight: '1.5'
        }}>{notification.message}</p>

        {/* Additional info if available */}
        {(notification.user_name || notification.resource_name) && (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {notification.user_name && (
              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <User size={11} />
                {notification.user_name}
              </span>
            )}
            {notification.resource_name && (
              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Calendar size={11} />
                {notification.resource_name}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Unread indicator */}
      {!notification.read && (
        <div style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: style.iconColor,
          boxShadow: `0 0 8px ${style.iconColor}`
        }}></div>
      )}
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
    <div style={{
      textAlign: 'center',
      padding: '80px 20px',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(25px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        background: 'rgba(168, 85, 247, 0.1)',
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        border: '2px solid rgba(168, 85, 247, 0.2)'
      }}>
        <Bell size={48} color="rgba(168, 85, 247, 0.8)" />
      </div>
      <h3 style={{
        color: '#fff',
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '12px'
      }}>{getEmptyMessage()}</h3>
      <p style={{
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '16px',
        margin: 0
      }}>Check back later for new updates</p>
    </div>
  );
};

// Loading Skeleton Component
const NotificationsSkeleton = () => {
  const skeletonAnimation = {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  };

  return (
    <div className="user-management-page">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
      `}</style>
      
      {/* Header Skeleton */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(25px)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '30px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        ...skeletonAnimation
      }}>
        <div style={{
          width: '300px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px'
        }}></div>
      </div>
      
      {/* Controls Skeleton */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          flex: 1,
          height: '48px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(25px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          ...skeletonAnimation
        }}></div>
        <div style={{
          width: '200px',
          height: '48px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(25px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          ...skeletonAnimation
        }}></div>
      </div>
      
      {/* Notification Items Skeleton */}
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(25px)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '20px',
          marginBottom: '15px',
          ...skeletonAnimation,
          animationDelay: `${i * 0.1}s`
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            flexShrink: 0
          }}></div>
          <div style={{flex: 1}}>
            <div style={{
              width: '60%',
              height: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              marginBottom: '12px'
            }}></div>
            <div style={{
              width: '100%',
              height: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              marginBottom: '8px'
            }}></div>
            <div style={{
              width: '80%',
              height: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px'
            }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationsPage;