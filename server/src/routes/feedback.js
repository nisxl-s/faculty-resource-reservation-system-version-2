const express = require('express');
const router = express.Router();
router.param('id', (req, res, next, value) => {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) return res.status(400).json({ success: false, message: 'Invalid record ID' });
  next();
});

router.use((req, res, next) => {
  if (['PUT','PATCH'].includes(req.method)) {
    if (req.body.status !== undefined && !["new","in_progress","resolved","closed"].includes(req.body.status)) return res.status(400).json({success:false,message:'Invalid status'});
    if (req.method === 'PUT' && (typeof req.body.admin_response !== 'string' || !req.body.admin_response.trim() || req.body.admin_response.length > 5000)) return res.status(400).json({success:false,message:'Response must contain 1 to 5000 characters'});
  }
  next();
});

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
