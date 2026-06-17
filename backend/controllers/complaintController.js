const { Complaint } = require('../utils/dbAdapter');
const AppError = require('../utils/AppError');
const { classifyGrievance } = require('../services/mlClassifier');
const { recordComplaint, getFrequencyStats, getRecentComplaints } = require('../services/hotspotDetector');

// helper: format a complaint doc for the API response
const fmt = (c) => ({
  id: c._id ? String(c._id).slice(-6).toUpperCase() : 'LOCAL',
  _id: c._id,
  title: c.title,
  category: c.category,
  mlCategory: c.mlCategory || null,
  mlConfidence: c.mlConfidence || null,
  status: c.status,
  date: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  userEmail: c.userEmail || 'User',
  image: c.image || null,
  proofImage: c.proofImage || null,
  location: c.location || null,
  updates: c.updates || [],
  description: c.description,
  landmark: c.landmark || '',
  occurrenceDate: c.occurrenceDate || null,
  urgency: c.urgency || '',
  impactScale: c.impactScale || '',
  contactPreference: c.contactPreference || '',
  resolvedBy: c.resolvedBy || null,
  falseClosureReport: c.falseClosureReport || null,
  userId: c.user ? String(c.user) : null,
});

// ── GET ALL COMPLAINTS ────────────────────────────────────
exports.getComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json(complaints.map ? complaints.map(fmt) : []);
  } catch (error) {
    next(error);
  }
};

// ── GET LOGGED-IN USER'S COMPLAINTS ──────────────────────
exports.getMyComplaints = async (req, res, next) => {
  try {
    const userId = String(req.user._id);
    const complaints = await Complaint.find({ user: userId }).sort({ createdAt: -1 });
    const list = Array.isArray(complaints) ? complaints : [];
    res.status(200).json(list.map(fmt));
  } catch (error) {
    next(error);
  }
};

// ── GET NEARBY COMPLAINTS (2km Radius) ────────────────────
exports.getNearbyComplaints = async (req, res, next) => {
  try {
    const { lat, lng, radius = 2 } = req.query; // radius in km
    if (!lat || !lng) {
      return res.status(400).json({ status: 'fail', message: 'Please provide lat and lng' });
    }

    const complaints = await Complaint.find();
    const list = Array.isArray(complaints) ? complaints : [];
    
    // Haversine formula to calculate distance in km
    const R = 6371; // Earth's radius in km
    const toRad = (value) => (value * Math.PI) / 180;

    const nearby = list.filter((c) => {
      if (!c.location || !c.location.lat || !c.location.lng) return false;
      const dLat = toRad(c.location.lat - lat);
      const dLng = toRad(c.location.lng - lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) * Math.cos(toRad(c.location.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const cDist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * cDist;
      return distance <= radius;
    });

    res.status(200).json(nearby.map(c => ({ ...fmt(c), distance: undefined })));
  } catch (error) {
    next(error);
  }
};

// ── GET STATS ─────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const activeStatuses = ['Pending', 'initiated', 'under_review', 'construction_ongoing', 'In Progress', 'Escalated'];
    const resolvedStatuses = ['resolved', 'Resolved', 'fixing_issues'];

    const total    = await Complaint.countDocuments();
    const active   = await Complaint.countDocuments({ status: { $in: activeStatuses } });
    const resolved = await Complaint.countDocuments({ status: { $in: resolvedStatuses } });
    const escalated = await Complaint.countDocuments({ status: 'Escalated' });

    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const byStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({ total, active, resolved, escalated, byCategory, byStatus });
  } catch (error) {
    next(error);
  }
};

// ── GET HOTSPOT DATA ──────────────────────────────────────
exports.getHotspots = async (req, res, next) => {
  try {
    const stats = getFrequencyStats();
    const recentFeed = getRecentComplaints(30);
    res.status(200).json({ stats, recentFeed });
  } catch (error) {
    next(error);
  }
};

// ── CREATE COMPLAINT (with ML classification + hotspot detection) ──
exports.createComplaint = async (req, res, next) => {
  try {
    let {
      title,
      category,
      location,
      description,
      landmark,
      occurrenceDate,
      urgency,
      impactScale,
      contactPreference
    } = req.body;

    if (typeof location === 'string' && location.startsWith('{')) {
      try { location = JSON.parse(location); } catch (e) { /* keep as string */ }
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // ── ML Classification ──────────────────────────────────
    let mlCategory = null;
    let mlConfidence = null;
    try {
      const classificationText = `${title || ''} ${description || ''}`;
      const result = await classifyGrievance(classificationText);
      mlCategory = result.label;
      mlConfidence = result.confidence;
      console.log(`🧠 ML classified: "${title}" → ${mlCategory} (${(mlConfidence * 100).toFixed(1)}%)`);
    } catch (mlErr) {
      console.warn('⚠️  ML classification failed, storing without ML data:', mlErr.message);
    }

    const newComplaint = await Complaint.create({
      title,
      category,
      location,
      description,
      landmark,
      occurrenceDate,
      urgency,
      impactScale,
      contactPreference,
      image: imagePath,
      user: String(req.user._id),
      status: 'initiated',
      mlCategory,
      mlConfidence,
      updates: [{
        status: 'initiated',
        message: 'Complaint successfully registered via CivicFlow.',
        timestamp: new Date().toISOString(),
      }],
    });

    // ── Hotspot Detection ──────────────────────────────────
    if (mlCategory) {
      const hotspotResult = recordComplaint(mlCategory, title, mlConfidence);

      // Get Socket.io instance from app
      const io = req.app.get('io');
      if (io) {
        // Emit new complaint to all connected clients
        io.emit('NEW_COMPLAINT', {
          complaint: fmt(newComplaint),
          mlCategory,
          mlConfidence,
          timestamp: Date.now(),
        });

        // Emit hotspot alert if threshold exceeded
        if (hotspotResult.isHotspot) {
          console.log(`🔥 HOTSPOT DETECTED: ${mlCategory} — ${hotspotResult.count} complaints in last 10 minutes!`);
          io.emit('HOTSPOT_ALERT', {
            category: mlCategory,
            count: hotspotResult.count,
            timestamp: Date.now(),
            message: `⚠️ SURGE DETECTED: ${hotspotResult.count} "${mlCategory}" complaints in the last 10 minutes!`,
          });
        }
      }
    }

    res.status(201).json(fmt(newComplaint));
  } catch (error) {
    next(error);
  }
};

// ── ADMIN: UPDATE STATUS ──────────────────────────────────
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, message, proofImage } = req.body;

    // find by full _id or partial suffix
    let complaint = await Complaint.findById(id);

    // If not found by full id, try suffix match (local IDs are stored as full hex)
    if (!complaint) {
      const all = await Complaint.find();
      const list = Array.isArray(all) ? all : [];
      complaint = list.find(c => String(c._id).slice(-6).toUpperCase() === id.toUpperCase());
    }

    if (!complaint) return next(new AppError('Complaint not found', 404));

    if (status) complaint.status = status;
    
    // Award point if resolving for the first time
    if ((status === 'resolved' || status === 'Resolved' || status === 'fixing_issues') && !complaint.resolvedBy) {
      complaint.resolvedBy = req.user._id;
      const { User } = require('../utils/dbAdapter');
      const adminUser = await User.findById(req.user._id);
      if (adminUser) {
        adminUser.points = (adminUser.points || 0) + 1;
        if (adminUser.save) await adminUser.save();
      }
    }

    if (message || status) {
      complaint.updates = complaint.updates || [];
      complaint.updates.push({
        status: status || complaint.status,
        message: message || `Status updated to ${status}`,
        timestamp: new Date().toISOString(),
      });
    }
    if (proofImage) complaint.proofImage = proofImage;

    await complaint.save();

    // Emit status update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('COMPLAINT_UPDATED', {
        complaint: fmt(complaint),
        timestamp: Date.now(),
      });
    }

    res.status(200).json(complaint);
  } catch (error) {
    next(error);
  }
};

// ── CITIZEN: REPORT FALSE CLOSURE ─────────────────────────────
exports.reportFalseClosure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    let complaint = await Complaint.findById(id);

    if (!complaint) {
      const all = await Complaint.find();
      const list = Array.isArray(all) ? all : [];
      complaint = list.find(c => String(c._id).slice(-6).toUpperCase() === id.toUpperCase());
    }
    if (!complaint) return next(new AppError('Complaint not found', 404));

    complaint.falseClosureReport = {
      isReported: true,
      reason,
      status: 'Pending'
    };
    
    if (complaint.save) await complaint.save();
    res.status(200).json(complaint);
  } catch (error) {
    next(error);
  }
};

// ── CM: HANDLE FALSE CLOSURE ─────────────────────────────
exports.handleFalseClosure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'Approve' or 'Reject'
    let complaint = await Complaint.findById(id);

    if (!complaint) {
      const all = await Complaint.find();
      const list = Array.isArray(all) ? all : [];
      complaint = list.find(c => String(c._id).slice(-6).toUpperCase() === id.toUpperCase());
    }
    if (!complaint) return next(new AppError('Complaint not found', 404));

    if (action === 'Approve') {
      complaint.falseClosureReport.status = 'Approved';
      complaint.status = 'In Progress'; // Reopen
      complaint.updates = complaint.updates || [];
      complaint.updates.push({
        status: 'In Progress',
        message: 'False closure report approved by CM. Complaint reopened.',
        timestamp: new Date().toISOString()
      });

      // Penalize Admin
      if (complaint.resolvedBy) {
        const { User } = require('../utils/dbAdapter');
        const adminUser = await User.findById(complaint.resolvedBy);
        if (adminUser) {
          adminUser.points = (adminUser.points || 0) - 5;
          if (adminUser.save) await adminUser.save();
        }
      }
    } else {
      complaint.falseClosureReport.status = 'Rejected';
    }

    if (complaint.save) await complaint.save();
    res.status(200).json(complaint);
  } catch (error) {
    next(error);
  }
};
