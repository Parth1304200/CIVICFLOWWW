const express = require('express');
const { getComplaints, getStats, createComplaint, getMyComplaints, updateComplaintStatus, getHotspots, getNearbyComplaints, reportFalseClosure, handleFalseClosure, voteComplaint, getOfficers } = require('../controllers/complaintController');
const auth = require('../middlewares/auth');
const restrictTo = require('../middlewares/restrictTo');
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
// CM/officers oversight of the team's performance & workload
router.get('/officers', restrictTo('admin', 'manager', 'cm'), getOfficers);
router.post('/', upload.single('image'), createComplaint);
// Only staff (not citizens) may change a complaint's status
router.patch('/:id/status', restrictTo('admin', 'manager', 'sales', 'cm'), updateComplaintStatus);
router.post('/:id/vote', voteComplaint);
router.post('/:id/false-closure', reportFalseClosure);
// Only the CM may rule on false-closure reports (prevents admins clearing reports against themselves)
router.post('/:id/false-closure/handle', restrictTo('cm'), handleFalseClosure);

module.exports = router;
