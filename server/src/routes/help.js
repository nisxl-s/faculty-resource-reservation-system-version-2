const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');
const { verifyToken, isFacultyOrAdmin } = require('../middleware/auth');

// User routes (authenticated)
router.post('/', verifyToken, helpController.submitHelpRequest);
router.get('/my-requests', verifyToken, helpController.getUserHelpRequests);
router.get('/:id', verifyToken, helpController.getHelpRequestById);

// Admin routes
router.get('/admin/all', 
  verifyToken, 
  isFacultyOrAdmin, 
  helpController.getAllHelpRequests
);

router.put('/admin/:id/respond', 
  verifyToken, 
  isFacultyOrAdmin, 
  helpController.respondToHelpRequest
);

router.patch('/admin/:id/status', 
  verifyToken, 
  isFacultyOrAdmin, 
  helpController.updateHelpRequestStatus
);

module.exports = router;
