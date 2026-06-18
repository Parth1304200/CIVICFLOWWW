const mongoose = require('mongoose');
const { Complaint } = require('../utils/dbAdapter');
const AppError = require('../utils/AppError');
const { classifyGrievance } = require('../services/mlClassifier');
const { recordComplaint, getFrequencyStats, getRecentComplaints } = require('../services/hotspotDetector');

// helper: Haversine distance between two coordinates, in metres
const distanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// statuses that count as still "open" (used for duplicate detection)
const ACTIVE_STATUSES = ['Pending', 'initiated', 'under_review', 'construction_ongoing', 'fixing_issues', 'In Progress', 'Escalated'];

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
  resolvedAt: c.resolvedAt || null,
  resolverName: c.resolverName || '',
  resolverEmail: c.resolverEmail || '',
  falseClosureReport: c.falseClosureReport || null,
  userId: c.user ? String(c.user) : null,
  votes: c.votes || 0,
  voters: Array.isArray(c.voters) ? c.voters.map(String) : [],
  createdAt: c.createdAt || null,
});

// Ordered status pipeline — used to enforce forward-only transitions.
const STATUS_FLOW = ['initiated', 'under_review', 'construction_ongoing', 'fixing_issues', 'resolved'];

/**
 * Find a complaint by either a full Mongo ObjectId OR the 6-char short id the
 * frontend displays (last 6 hex chars of _id, uppercased).
 *
 * Calling Mongoose's findById() with a non-ObjectId (like "A3872B") throws a
 * CastError and 500s the request, so we only use findById for real 24-char ids
 * and fall back to a suffix scan otherwise. Works in both Atlas and local mode.
 */
const findComplaintByAnyId = async (id) => {
  if (!id) return null;
  let complaint = null;
  if (String(id).length === 24 && mongoose.Types.ObjectId.isValid(id)) {
    complaint = await Complaint.findById(id);
  }
  if (!complaint) {
    const all = await Complaint.find();
    const list = Array.isArray(all) ? all : [];
    const needle = String(id).toUpperCase();
    complaint = list.find(c => String(c._id).slice(-6).toUpperCase() === needle) || null;
  }
  return complaint;
};

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

// ── VOTE ON A COMPLAINT (upvote / toggle) ─────────────────
exports.voteComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;

    const complaint = await findComplaintByAnyId(id);
    if (!complaint) return next(new AppError('Complaint not found', 404));

    const uid = String(req.user._id);

    // Citizens cannot vote on their own complaint
    if (String(complaint.user) === uid) {
      return res.status(400).json({ status: 'fail', message: 'You cannot vote on your own complaint.' });
    }

    complaint.voters = Array.isArray(complaint.voters) ? complaint.voters.map(String) : [];
    let voted;
    if (complaint.voters.includes(uid)) {
      complaint.voters = complaint.voters.filter(v => v !== uid);
      voted = false;
    } else {
      complaint.voters.push(uid);
      voted = true;
    }
    complaint.votes = complaint.voters.length;

    if (complaint.save) await complaint.save();

    // Broadcast so the author, admin, and CM dashboards update live
    const io = req.app.get('io');
    if (io) {
      io.emit('COMPLAINT_UPDATED', {
        complaint: fmt(complaint),
        timestamp: Date.now(),
      });
    }

    res.status(200).json({ ...fmt(complaint), voted });
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

    // ── Duplicate / spam detection ─────────────────────────
    // If an OPEN complaint of the same category already exists within 100m,
    // block the resubmission and point the citizen to the existing one to vote on.
    if (location && typeof location === 'object' && location.lat && location.lng) {
      const all = await Complaint.find();
      const list = Array.isArray(all) ? all : [];
      const dup = list.find((c) => {
        if (!c.location || !c.location.lat || !c.location.lng) return false;
        if (c.category !== category) return false;
        if (!ACTIVE_STATUSES.includes(c.status)) return false;
        return distanceMeters(location.lat, location.lng, c.location.lat, c.location.lng) <= 100;
      });

      if (dup) {
        const ownComplaint = String(dup.user) === String(req.user._id);
        return res.status(409).json({
          status: 'fail',
          duplicate: true,
          ownComplaint,
          message: ownComplaint
            ? 'You have already reported this issue at this location. You cannot submit the same complaint twice.'
            : 'This complaint is already registered for this location. Please vote for it instead.',
          existingComplaint: fmt(dup),
        });
      }
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

    const complaint = await findComplaintByAnyId(id);
    if (!complaint) return next(new AppError('Complaint not found', 404));

    if (status) {
      // Enforce forward-only progression: a complaint can never move back to an
      // earlier stage once it has advanced. Unknown/legacy statuses are allowed
      // through so other flows (e.g. CM reopen) are not blocked.
      const currentIdx = STATUS_FLOW.indexOf(complaint.status);
      const targetIdx = STATUS_FLOW.indexOf(status);
      if (currentIdx !== -1 && targetIdx !== -1 && targetIdx < currentIdx) {
        return next(new AppError('Status can only move forward, not back to a previous state.', 400));
      }
      complaint.status = status;
    }

    // Award point if resolving for the first time
    let adminUser = null;
    if ((status === 'resolved' || status === 'Resolved' || status === 'fixing_issues') && !complaint.resolvedBy) {
      complaint.resolvedBy = req.user._id;
      const { User } = require('../utils/dbAdapter');
      adminUser = await User.findById(req.user._id);
      if (adminUser) {
        adminUser.points = (adminUser.points || 0) + 1;
        if (adminUser.save) await adminUser.save();
      }
    }

    // Stamp resolution metadata so the "Solved Problems" view can show who/when
    if (status === 'resolved' || status === 'Resolved') {
      complaint.resolvedAt = complaint.resolvedAt || new Date().toISOString();
      let resolver = adminUser;
      if (!resolver && req.user?._id) {
        const { User } = require('../utils/dbAdapter');
        resolver = await User.findById(req.user._id);
      }
      resolver = resolver || req.user;
      if (resolver) {
        complaint.resolverName = resolver.name || resolver.displayName || complaint.resolverName || '';
        complaint.resolverEmail = resolver.email || complaint.resolverEmail || '';
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

    res.status(200).json(fmt(complaint));
  } catch (error) {
    next(error);
  }
};

// ── CM/ADMIN: OFFICER (ADMIN) PERFORMANCE OVERVIEW ────────────
// Powers the CM's oversight of the team: who is handling what, their active
// workload (bandwidth), resolution count, performance points, and how many of
// their resolutions were overturned as false closures (corruption signal).
exports.getOfficers = async (req, res, next) => {
  try {
    const { User } = require('../utils/dbAdapter');
    const allUsers = await User.find();
    const userList = Array.isArray(allUsers) ? allUsers : [];
    const officers = userList.filter(u => ['admin', 'manager', 'sales'].includes(u.role));

    const allComplaints = await Complaint.find();
    const complaintList = Array.isArray(allComplaints) ? allComplaints : [];

    const RESOLVED = ['resolved', 'Resolved'];
    const ACTIVE = ['initiated', 'under_review', 'construction_ongoing', 'fixing_issues', 'In Progress', 'Pending', 'Escalated'];

    const data = officers.map(o => {
      const oid = String(o._id);
      const handled = complaintList.filter(c => c.resolvedBy && String(c.resolvedBy) === oid);
      const resolved = handled.filter(c => RESOLVED.includes(c.status)).length;
      const active = handled.filter(c => ACTIVE.includes(c.status)).length;
      const falseClosures = complaintList.filter(c =>
        c.resolvedBy && String(c.resolvedBy) === oid &&
        c.falseClosureReport?.isReported === true &&
        c.falseClosureReport?.status === 'Approved'
      ).length;
      return {
        id: String(o._id).slice(-6).toUpperCase(),
        name: o.name || 'Officer',
        email: o.email || '',
        role: o.role,
        phone: o.phone || '',
        points: o.points || 0,
        active,                 // current workload / bandwidth
        resolved,
        totalHandled: handled.length,
        falseClosures,          // overturned resolutions (integrity flag)
      };
    });

    // Most reliable first (points desc), then by workload
    data.sort((a, b) => (b.points - a.points) || (b.resolved - a.resolved));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// ── CITIZEN: REPORT FALSE CLOSURE ─────────────────────────────
exports.reportFalseClosure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const complaint = await findComplaintByAnyId(id);
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
    const complaint = await findComplaintByAnyId(id);
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
