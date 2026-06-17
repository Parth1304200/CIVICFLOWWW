const express = require('express');
const { getComplaints, getStats, createComplaint, getMyComplaints, updateComplaintStatus, getHotspots, getNearbyComplaints, reportFalseClosure, handleFalseClosure } = require('../controllers/complaintController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

// Public routes (anyone can see complaints and stats on a public dashboard)
router.get('/', getComplaints);
router.get('/stats', getStats);
router.get('/hotspots', getHotspots);

// Protected routes (must be logged in to submit)
router.use(auth);
router.get('/me', getMyComplaints);
router.get('/nearby', getNearbyComplaints);
router.post('/', upload.single('image'), createComplaint);
router.patch('/:id/status', updateComplaintStatus);
router.post('/:id/false-closure', reportFalseClosure);
router.post('/:id/false-closure/handle', handleFalseClosure);

module.exports = router;
