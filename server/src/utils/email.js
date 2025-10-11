const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('./logger');

// Create transporter
let transporter = null;

const initializeTransporter = () => {
    try {
        transporter = nodemailer.createTransport(config.email);
        logger.info('Email transporter initialized');
    } catch (error) {
        logger.error('Failed to initialize email transporter:', error.message);
    }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text content
 * @param {String} options.html - HTML content
 * @returns {Promise} Send result
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!transporter) {
            initializeTransporter();
        }

        if (!transporter) {
            logger.warn('Email transporter not available. Email not sent.');
            return { success: false, message: 'Email service not configured' };
        }

        const mailOptions = {
            from: config.email.from,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error('Error sending email:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send booking confirmation email
 * @param {Object} booking - Booking details
 * @param {Object} user - User details
 * @param {Object} resource - Resource details
 */
const sendBookingConfirmation = async (booking, user, resource) => {
    const subject = 'Booking Confirmation - University Resource Management';
    const html = `
        <h2>Booking Confirmation</h2>
        <p>Dear ${user.full_name},</p>
        <p>Your booking has been confirmed with the following details:</p>
        <ul>
            <li><strong>Resource:</strong> ${resource.name}</li>
            <li><strong>Date:</strong> ${booking.date}</li>
            <li><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</li>
            <li><strong>Purpose:</strong> ${booking.purpose}</li>
        </ul>
        <p>Thank you for using our resource management system.</p>
        <p>Best regards,<br>University Administration</p>
    `;
    
    return await sendEmail({
        to: user.email,
        subject,
        html,
        text: `Booking confirmed for ${resource.name} on ${booking.date}`
    });
};

/**
 * Send booking approval notification
 * @param {Object} booking - Booking details
 * @param {Object} user - User details
 * @param {Object} resource - Resource details
 */
const sendBookingApproval = async (booking, user, resource) => {
    const subject = 'Booking Approved - University Resource Management';
    const html = `
        <h2>Booking Approved</h2>
        <p>Dear ${user.full_name},</p>
        <p>Your booking request has been approved:</p>
        <ul>
            <li><strong>Resource:</strong> ${resource.name}</li>
            <li><strong>Date:</strong> ${booking.date}</li>
            <li><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</li>
        </ul>
        <p>Please arrive on time and follow all facility guidelines.</p>
        <p>Best regards,<br>University Administration</p>
    `;
    
    return await sendEmail({
        to: user.email,
        subject,
        html,
        text: `Your booking for ${resource.name} has been approved`
    });
};

/**
 * Send booking rejection notification
 * @param {Object} booking - Booking details
 * @param {Object} user - User details
 * @param {Object} resource - Resource details
 * @param {String} reason - Rejection reason
 */
const sendBookingRejection = async (booking, user, resource, reason) => {
    const subject = 'Booking Rejected - University Resource Management';
    const html = `
        <h2>Booking Rejected</h2>
        <p>Dear ${user.full_name},</p>
        <p>Unfortunately, your booking request has been rejected:</p>
        <ul>
            <li><strong>Resource:</strong> ${resource.name}</li>
            <li><strong>Date:</strong> ${booking.date}</li>
            <li><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</li>
            <li><strong>Reason:</strong> ${reason || 'Not specified'}</li>
        </ul>
        <p>Please contact the administration for more information or submit a new request.</p>
        <p>Best regards,<br>University Administration</p>
    `;
    
    return await sendEmail({
        to: user.email,
        subject,
        html,
        text: `Your booking for ${resource.name} has been rejected`
    });
};

/**
 * Send booking reminder
 * @param {Object} booking - Booking details
 * @param {Object} user - User details
 * @param {Object} resource - Resource details
 */
const sendBookingReminder = async (booking, user, resource) => {
    const subject = 'Booking Reminder - University Resource Management';
    const html = `
        <h2>Booking Reminder</h2>
        <p>Dear ${user.full_name},</p>
        <p>This is a reminder for your upcoming booking:</p>
        <ul>
            <li><strong>Resource:</strong> ${resource.name}</li>
            <li><strong>Date:</strong> ${booking.date}</li>
            <li><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</li>
            <li><strong>Location:</strong> ${resource.location}</li>
        </ul>
        <p>Please arrive on time and bring any necessary materials.</p>
        <p>Best regards,<br>University Administration</p>
    `;
    
    return await sendEmail({
        to: user.email,
        subject,
        html,
        text: `Reminder: Your booking for ${resource.name} is tomorrow`
    });
};

/**
 * Send welcome email to new user
 * @param {Object} user - User details
 */
const sendWelcomeEmail = async (user) => {
    const subject = 'Welcome to University Resource Management System';
    const html = `
        <h2>Welcome to University Resource Management System</h2>
        <p>Dear ${user.full_name},</p>
        <p>Your account has been successfully created!</p>
        <p>You can now:</p>
        <ul>
            <li>Browse available resources</li>
            <li>Make booking requests</li>
            <li>View your booking history</li>
            <li>Manage your profile</li>
        </ul>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>University Administration</p>
    `;
    
    return await sendEmail({
        to: user.email,
        subject,
        html,
        text: 'Welcome to University Resource Management System'
    });
};

module.exports = {
    sendEmail,
    sendBookingConfirmation,
    sendBookingApproval,
    sendBookingRejection,
    sendBookingReminder,
    sendWelcomeEmail,
    initializeTransporter
};