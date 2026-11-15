const express = require('express');
const router = express.Router();
router.param('id', (req, res, next, value) => {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) return res.status(400).json({ success: false, message: 'Invalid record ID' });
  next();
});

router.use((req, res, next) => {
  if (['PUT','PATCH'].includes(req.method)) {
    if (req.body.status !== undefined && !["open","in_progress","resolved","closed"].includes(req.body.status)) return res.status(400).json({success:false,message:'Invalid status'});
    if (req.method === 'PUT' && (typeof req.body.admin_response !== 'string' || !req.body.admin_response.trim() || req.body.admin_response.length > 5000)) return res.status(400).json({success:false,message:'Response must contain 1 to 5000 characters'});
  }
  next();
});

const helpController = require('../controllers/helpController');
const { verifyToken, isFacultyOrAdmin } = require('../middleware/auth');

// Help submission is available to guests; history/details require authentication.
router.post('/', (req, res, next) => {
  if (req.header('Authorization')) return verifyToken(req, res, next);
  next();
}, helpController.submitHelpRequest);
router.post('/guest-status',helpController.trackGuestRequest);
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
