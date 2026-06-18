import api from './api';

export const complaintService = {
  getComplaints: async () => {
    return api.get('/complaints');
  },

  getMyComplaints: async () => {
    return api.get('/complaints/me');
  },

  getStats: async () => {
    return api.get('/complaints/stats');
  },

  getHotspots: async () => {
    return api.get('/complaints/hotspots');
  },

  getNearbyComplaints: async (lat, lng, radius = 2) => {
    return api.get('/complaints/nearby', { params: { lat, lng, radius } });
  },

  submitComplaint: async (complaintData) => {
    return api.post('/complaints', complaintData);
  },

  // Citizen: upvote (or toggle vote on) a complaint
  voteComplaint: async (id) => {
    return api.post(`/complaints/${id}/vote`);
  },

  // Admin: update status & add message to tracking timeline
  updateComplaintStatus: async (id, payload) => {
    return api.patch(`/complaints/${id}/status`, payload);
  },

  // CM: handle false closure reports (action: 'Approve' | 'Reject')
  handleFalseClosure: async (id, action) => {
    return api.post(`/complaints/${id}/false-closure/handle`, { action });
  },
};
