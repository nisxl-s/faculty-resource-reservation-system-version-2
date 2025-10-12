const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// User routes (authenticated)
router.post('/', verifyToken, feedbackController.submitFeedback);
router.get('/my-feedback', verifyToken, feedbackController.getUserFeedback);
router.get('/:id', verifyToken, feedbackController.getFeedbackById);

// Admin routes
router.get('/admin/all', 
  verifyToken, 
  isAdmin, 
  feedbackController.getAllFeedback
);

router.put('/admin/:id/respond', 
  verifyToken, 
  isAdmin, 
  feedbackController.respondToFeedback
);

module.exports = router;
