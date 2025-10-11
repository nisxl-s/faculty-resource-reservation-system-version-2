const moment = require('moment');

/**
 * Format date to YYYY-MM-DD
 * @param {Date|String} date - Date to format
 * @returns {String} Formatted date
 */
const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD');
};

/**
 * Format time to HH:mm:ss
 * @param {String} time - Time to format
 * @returns {String} Formatted time
 */
const formatTime = (time) => {
    return moment(time, 'HH:mm').format('HH:mm:ss');
};

/**
 * Calculate time ago from timestamp
 * @param {Date|String} timestamp - Timestamp to calculate from
 * @returns {String} Time ago string
 */
const timeAgo = (timestamp) => {
    return moment(timestamp).fromNow();
};

/**
 * Check if time slot overlaps with existing bookings
 * @param {String} startTime1 - Start time of first slot
 * @param {String} endTime1 - End time of first slot
 * @param {String} startTime2 - Start time of second slot
 * @param {String} endTime2 - End time of second slot
 * @returns {Boolean} True if overlaps
 */
const checkTimeOverlap = (startTime1, endTime1, startTime2, endTime2) => {
    const start1 = moment(startTime1, 'HH:mm:ss');
    const end1 = moment(endTime1, 'HH:mm:ss');
    const start2 = moment(startTime2, 'HH:mm:ss');
    const end2 = moment(endTime2, 'HH:mm:ss');
    
    return (start1.isBefore(end2) && end1.isAfter(start2));
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} True if valid
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {String} phone - Phone number to validate
 * @returns {Boolean} True if valid
 */
const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{3}-[0-9]{7}$/;
    return phoneRegex.test(phone);
};

/**
 * Generate random string
 * @param {Number} length - Length of string
 * @returns {String} Random string
 */
const generateRandomString = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Sanitize user input
 * @param {String} input - Input to sanitize
 * @returns {String} Sanitized input
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};

/**
 * Paginate results
 * @param {Array} data - Data to paginate
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Object} Paginated data
 */
const paginate = (data, page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return {
        data: data.slice(startIndex, endIndex),
        currentPage: page,
        totalPages: Math.ceil(data.length / limit),
        totalItems: data.length,
        itemsPerPage: limit
    };
};

/**
 * Calculate duration between two times
 * @param {String} startTime - Start time
 * @param {String} endTime - End time
 * @returns {Number} Duration in minutes
 */
const calculateDuration = (startTime, endTime) => {
    const start = moment(startTime, 'HH:mm:ss');
    const end = moment(endTime, 'HH:mm:ss');
    return end.diff(start, 'minutes');
};

/**
 * Check if date is in the past
 * @param {String|Date} date - Date to check
 * @returns {Boolean} True if in past
 */
const isPastDate = (date) => {
    return moment(date).isBefore(moment(), 'day');
};

/**
 * Check if date is today
 * @param {String|Date} date - Date to check
 * @returns {Boolean} True if today
 */
const isToday = (date) => {
    return moment(date).isSame(moment(), 'day');
};

/**
 * Get date range
 * @param {String|Date} startDate - Start date
 * @param {String|Date} endDate - End date
 * @returns {Array} Array of dates
 */
const getDateRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = moment(startDate);
    const end = moment(endDate);
    
    while (currentDate.isSameOrBefore(end)) {
        dates.push(currentDate.format('YYYY-MM-DD'));
        currentDate.add(1, 'day');
    }
    
    return dates;
};

module.exports = {
    formatDate,
    formatTime,
    timeAgo,
    checkTimeOverlap,
    isValidEmail,
    isValidPhone,
    generateRandomString,
    sanitizeInput,
    paginate,
    calculateDuration,
    isPastDate,
    isToday,
    getDateRange
};