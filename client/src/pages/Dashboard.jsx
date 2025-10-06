import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
      setCurrentTime(now.toLocaleDateString('en-US', options))
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Welcome Section */}
        <section className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome Back, Dr. John Smith</h1>
          <p>Faculty of Computing - Computer Science Department</p>
          <div className="current-time">{currentTime}</div>
        </div>
        <div className="user-avatar">
          <span className="avatar-icon">👤</span>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>12</h3>
              <p>Active Bookings</p>
            </div>
            <div className="stat-trend up">↑ 8%</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <h3>5</h3>
              <p>Pending Approvals</p>
            </div>
            <div className="stat-trend down">↓ 3%</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>48</h3>
              <p>Total Reservations</p>
            </div>
            <div className="stat-trend up">↑ 12%</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <h3>4.8</h3>
              <p>Rating Score</p>
            </div>
            <div className="stat-trend up">↑ 0.2</div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/reservation" className="action-card">
            <span className="action-icon">➕</span>
            <h3>New Booking</h3>
            <p>Reserve a resource</p>
          </Link>
          <Link to="/availability" className="action-card">
            <span className="action-icon">🔍</span>
            <h3>Check Availability</h3>
            <p>View available resources</p>
          </Link>
          <div className="action-card">
            <span className="action-icon">📋</span>
            <h3>My Bookings</h3>
            <p>Manage reservations</p>
          </div>
          <div className="action-card">
            <span className="action-icon">📈</span>
            <h3>View Reports</h3>
            <p>Usage analytics</p>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="content-grid">
        {/* Upcoming Bookings */}
        <div className="content-card">
          <div className="card-header">
            <h3>📅 Upcoming Bookings</h3>
            <a href="#" className="view-all">View All</a>
          </div>
          <div className="bookings-list">
            <div className="booking-item">
              <div className="booking-info">
                <h4>Computer Lab A-301</h4>
                <p>Programming Workshop</p>
                <span className="booking-time">Today, 2:00 PM - 4:00 PM</span>
              </div>
              <div className="booking-status approved">Approved</div>
            </div>
            <div className="booking-item">
              <div className="booking-info">
                <h4>Lecture Hall B-205</h4>
                <p>Data Structures Class</p>
                <span className="booking-time">Tomorrow, 10:00 AM - 12:00 PM</span>
              </div>
              <div className="booking-status pending">Pending</div>
            </div>
            <div className="booking-item">
              <div className="booking-info">
                <h4>Auditorium Main</h4>
                <p>Department Seminar</p>
                <span className="booking-time">Dec 20, 3:00 PM - 5:00 PM</span>
              </div>
              <div className="booking-status approved">Approved</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="content-card">
          <div className="card-header">
            <h3>🔔 Recent Activity</h3>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon success">✅</div>
              <div className="activity-info">
                <p>Booking approved for Lab A-301</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon info">➕</div>
              <div className="activity-info">
                <p>New booking created for Auditorium</p>
                <span className="activity-time">5 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon warning">⚠️</div>
              <div className="activity-info">
                <p>Booking reminder: Meeting in 1 hour</p>
                <span className="activity-time">1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Availability */}
        <div className="content-card full-width">
          <div className="card-header">
            <h3>📊 Resource Availability Today</h3>
            <Link to="/availability" className="btn btn-secondary">View Details</Link>
          </div>
          <div className="availability-grid">
            <div className="availability-item">
              <div className="resource-info">
                <h4>Computer Labs</h4>
                <p>8 available out of 12</p>
              </div>
              <div className="availability-bar">
                <div className="bar-fill" style={{ width: '67%' }}></div>
              </div>
              <span className="availability-percent">67%</span>
            </div>
            <div className="availability-item">
              <div className="resource-info">
                <h4>Lecture Halls</h4>
                <p>15 available out of 20</p>
              </div>
              <div className="availability-bar">
                <div className="bar-fill" style={{ width: '75%' }}></div>
              </div>
              <span className="availability-percent">75%</span>
            </div>
            <div className="availability-item">
              <div className="resource-info">
                <h4>Equipment</h4>
                <p>28 available out of 35</p>
              </div>
              <div className="availability-bar">
                <div className="bar-fill" style={{ width: '80%' }}></div>
              </div>
              <span className="availability-percent">80%</span>
            </div>
            <div className="availability-item">
              <div className="resource-info">
                <h4>Study Rooms</h4>
                <p>6 available out of 10</p>
              </div>
              <div className="availability-bar">
                <div className="bar-fill" style={{ width: '60%' }}></div>
              </div>
              <span className="availability-percent">60%</span>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}

export default Dashboard
