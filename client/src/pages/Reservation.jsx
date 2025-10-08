import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link, useSearchParams } from 'react-router-dom'
import './Reservation.css'

function Reservation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState({
    faculty: '',
    resourceType: '',
    specificResource: '',
    title: '',
    date: '',
    reason: '',
    startTime: '',
    endTime: '',
    attendees: '',
    purpose: '',
    requirements: ''
  })

  // Handle URL parameters for direct booking from availability page
  useEffect(() => {
    const resourceId = searchParams.get('resourceId')
    const faculty = searchParams.get('faculty')
    const type = searchParams.get('type')

    if (resourceId && faculty && type) {
      // Auto-fill the data and skip to step 3 (details)
      setBookingData(prev => ({
        ...prev,
        faculty: faculty,
        resourceType: type,
        specificResource: resourceId
      }))
      setCurrentStep(3) // Skip to details step
    }
  }, [searchParams])

  const faculties = [
    { id: 'engineering', name: 'Engineering', icon: '⚙️', description: 'Computer Science, Mechanical, Electrical, Civil Engineering' },
    { id: 'science', name: 'Science', icon: '⚛️', description: 'Physics, Chemistry, Biology, Mathematics' },
    { id: 'business', name: 'Business', icon: '📈', description: 'Management, Finance, Marketing, Economics' },
    { id: 'arts', name: 'Arts & Humanities', icon: '🎨', description: 'Literature, History, Philosophy, Fine Arts' },
    { id: 'medicine', name: 'Medicine', icon: '💓', description: 'Medical Studies, Nursing, Pharmacy' },
    { id: 'general', name: 'General', icon: '🏢', description: 'Auditoriums, Common spaces' }
  ]

  const resourceTypes = [
    { id: 'laboratory', name: 'Laboratory', icon: '🔬', desc: 'Labs and practical sessions' },
    { id: 'lecture-hall', name: 'Lecture Hall', icon: '👨‍🏫', desc: 'Presentations and seminars' },
    { id: 'meeting-room', name: 'Meeting Room', icon: '👥', desc: 'Small group discussions' },
    { id: 'auditorium', name: 'Auditorium', icon: '🎭', desc: 'Large events and conferences' },
    { id: 'equipment', name: 'Equipment', icon: '🔧', desc: 'Projectors and other equipment' }
  ]

  const updateBookingData = (field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return bookingData.faculty !== ''
      case 2:
        return bookingData.resourceType !== ''
      case 3:
        return bookingData.title !== '' &&
               bookingData.date !== '' &&
               bookingData.reason !== '' &&
               bookingData.attendees !== '' &&
               bookingData.startTime !== '' &&
               bookingData.endTime !== ''
      case 4:
        // For step 4, check if we have faculty and resource type (either from URL or user selection) and all required details
        return bookingData.faculty !== '' && 
               bookingData.resourceType !== '' && 
               validateStep(3)
      default:
        return false
    }
  }

  const nextStep = () => {
    if (currentStep < 4 && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    } else if (!validateStep(currentStep)) {
      alert('Please fill in all required fields before proceeding.')
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Final validation before submission
    if (!validateStep(4)) {
      alert('Please fill in all required fields before submitting.')
      return
    }

    console.log('Booking submitted:', bookingData)
    alert('Booking submitted successfully!')
    
    // Reset form
    setBookingData({
      faculty: '',
      resourceType: '',
      specificResource: '',
      title: '',
      date: '',
      reason: '',
      startTime: '',
      endTime: '',
      attendees: '',
      purpose: '',
      requirements: ''
    })
    setCurrentStep(1)

    navigate('/reservation', { replace: true })

  }

  const getProgressWidth = () => {
    // If we have URL parameters, we start from step 3, so adjusting progress calculation
    const resourceId = searchParams.get('resourceId')
    const faculty = searchParams.get('faculty')
    const type = searchParams.get('type')
    
    if (resourceId && faculty && type) {
      const adjustedStep = currentStep - 2 // Step 3 becomes 1, Step 4 becomes 2
      return `${(adjustedStep / 2) * 100}%`
    }
    
    return `${(currentStep / 4) * 100}%`
  }

  return (
    <div className="reservation">
      <div className="reservation-container">
        {/* Header */}
        <header className="page-header">
        <div className="header-content">
          <h1>➕ New Reservation</h1>
          <p>Book university resources for your activities</p>
          <Link to="/" className="back-btn">
            ⬅️ Back to Dashboard
          </Link>
        </div>
      </header>

          {/* Progress Steps */}
          <section className="progress-section">
            <div className="progress-container">
              <div className="progress-steps">
                {(() => {
                  const resourceId = searchParams.get('resourceId')
                  const faculty = searchParams.get('faculty')
                  const type = searchParams.get('type')
                  
                  // If we have URL parameters, show simplified progress
                  if (resourceId && faculty && type) {
                    return [
                      { num: 1, label: 'Details' },
                      { num: 2, label: 'Review' }
                    ].map((step) => {
                      const adjustedStepNum = step.num + 2 // Map to actual step numbers (3, 4)
                      return (
                        <div key={step.num} className={`step ${currentStep >= adjustedStepNum ? 'active' : ''}`}>
                          <div className="step-number">{step.num}</div>
                          <span className="step-label">{step.label}</span>
                        </div>
                      )
                    })
                  }
                  
                  // Normal progress for manual booking
                  return [
                    { num: 1, label: 'Faculty' },
                    { num: 2, label: 'Resource Type' },
                    { num: 3, label: 'Details' },
                    { num: 4, label: 'Review' }
                  ].map((step) => (
                    <div key={step.num} className={`step ${currentStep >= step.num ? 'active' : ''}`}>
                      <div className="step-number">{step.num}</div>
                      <span className="step-label">{step.label}</span>
                    </div>
                  ))
                })()}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: getProgressWidth() }}></div>
              </div>
            </div>
          </section>

      {/* Form */}
      <form onSubmit={handleSubmit} className="reservation-form">
        {/* Step 1: Faculty Selection */}
        {currentStep === 1 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Select Faculty</h2>
              <p>Choose the faculty for your reservation</p>
            </div>
            <div className="faculty-grid">
              {faculties.map((faculty) => (
                <div
                  key={faculty.id}
                  className={`faculty-card ${bookingData.faculty === faculty.id ? 'selected' : ''}`}
                  onClick={() => updateBookingData('faculty', faculty.id)}
                >
                  <div className="faculty-icon">{faculty.icon}</div>
                  <h3>{faculty.name}</h3>
                  <p>{faculty.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Resource Type Selection */}
        {currentStep === 2 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Select Resource Type</h2>
              <p>Choose the type of resource you want to book</p>
            </div>
            <div className="resource-grid">
              {resourceTypes.map((type) => (
                <div
                  key={type.id}
                  className={`resource-card ${bookingData.resourceType === type.id ? 'selected' : ''}`}
                  onClick={() => updateBookingData('resourceType', type.id)}
                >
                  <div className="resource-icon">{type.icon}</div>
                  <h3>{type.name}</h3>
                  <p>{type.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

            {/* Step 3: Booking Details */}
            {currentStep === 3 && (
              <div className="form-step">
                <div className="step-header">
                  <h2>Booking Details</h2>
                  <p>Fill in the details for your reservation</p>
                  {(() => {
                    const resourceId = searchParams.get('resourceId')
                    const faculty = searchParams.get('faculty')
                    const type = searchParams.get('type')
                    
                    if (resourceId && faculty && type) {
                      const facultyName = faculties.find(f => f.id === faculty)?.name || faculty
                      const resourceTypeName = resourceTypes.find(r => r.id === type)?.name || type
                      
                      return (
                        <div className="pre-selected-info">
                          <div className="info-card">
                            <h3>📋 Pre-selected Resource</h3>
                            <div className="info-details">
                              <span><strong>Faculty:</strong> {facultyName}</span>
                              <span><strong>Resource Type:</strong> {resourceTypeName}</span>
                              <span><strong>Resource ID:</strong> {resourceId}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Booking Title</label>
                <input
                  type="text"
                  value={bookingData.title}
                  onChange={(e) => updateBookingData('title', e.target.value)}
                  placeholder="e.g., Programming Assignment"
                  required
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => updateBookingData('date', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Booking Reason</label>
                <select
                  value={bookingData.reason}
                  onChange={(e) => updateBookingData('reason', e.target.value)}
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="class">Class/Lecture</option>
                  <option value="exam">Examination</option>
                  <option value="meeting">Meeting</option>
                  <option value="workshop">Workshop/Training</option>
                  <option value="event">Event/Conference</option>
                  <option value="research">Research</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Number of Attendees</label>
                <input
                  type="number"
                  value={bookingData.attendees}
                  onChange={(e) => updateBookingData('attendees', e.target.value)}
                  placeholder="e.g., 5"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={bookingData.startTime}
                  onChange={(e) => updateBookingData('startTime', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={bookingData.endTime}
                  onChange={(e) => updateBookingData('endTime', e.target.value)}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Purpose/Description</label>
                <textarea
                  value={bookingData.purpose}
                  onChange={(e) => updateBookingData('purpose', e.target.value)}
                  placeholder="Describe the purpose of your booking..."
                  rows="3"
                />
              </div>

              <div className="form-group full-width">
                <label>Special Requirements</label>
                <textarea
                  value={bookingData.requirements}
                  onChange={(e) => updateBookingData('requirements', e.target.value)}
                  placeholder="Any special equipment or setup needed..."
                  rows="2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Review Your Booking</h2>
              <p>Please review your booking details before submitting</p>
            </div>
            <div className="review-container">
              <div className="review-card">
                <div className="review-section">
                  <h3>🏛️ Faculty Information</h3>
                  <div className="review-item">
                    <span className="label">Faculty:</span>
                    <span className="value">
                      {faculties.find(f => f.id === bookingData.faculty)?.name || '-'}
                    </span>
                  </div>
                </div>

                <div className="review-section">
                  <h3>ℹ️ Resource Information</h3>
                  <div className="review-item">
                    <span className="label">Resource Type:</span>
                    <span className="value">{bookingData.resourceType || '-'}</span>
                  </div>
                </div>

                <div className="review-section">
                  <h3>📅 Booking Details</h3>
                  <div className="review-item">
                    <span className="label">Title:</span>
                    <span className="value">{bookingData.title || '-'}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Date:</span>
                    <span className="value">{bookingData.date || '-'}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Time:</span>
                    <span className="value">
                      {bookingData.startTime && bookingData.endTime
                        ? `${bookingData.startTime} - ${bookingData.endTime}`
                        : '-'}
                    </span>
                  </div>
                  <div className="review-item">
                    <span className="label">Reason:</span>
                    <span className="value">{bookingData.reason || '-'}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Attendees:</span>
                    <span className="value">{bookingData.attendees || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="booking-summary">
                <h3>Booking Summary</h3>
                <div className="summary-item">
                  <span>⏰ Duration: <strong>
                    {bookingData.startTime && bookingData.endTime
                      ? `${Math.abs(new Date(`1970-01-01T${bookingData.endTime}:00`).getTime() - new Date(`1970-01-01T${bookingData.startTime}:00`).getTime()) / (1000 * 60 * 60)} hours`
                      : '-'}
                  </strong></span>
                </div>
                <div className="summary-item">
                  <span>✅ Status: <strong>Pending Approval</strong></span>
                </div>
                <div className="summary-item">
                  <span>🔔 You'll receive email confirmation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="form-navigation">
          <button
            type="button"
            onClick={previousStep}
            className={`btn btn-secondary ${currentStep === 1 ? 'hidden' : ''}`}
          >
            ⬅️ Previous
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                nextStep()
              }}
              className={`btn btn-primary ${!validateStep(currentStep) ? 'disabled' : ''}`}
              disabled={!validateStep(currentStep)}
            >
              Next ➡️
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e)
              }}
              className={`btn btn-success ${!validateStep(4) ? 'disabled' : ''}`}
              disabled={!validateStep(4)}
            >
              ✅ Submit Booking
            </button>
          )}
        </div>
      </form>
      </div>
    </div>
  )
}

export default Reservation
