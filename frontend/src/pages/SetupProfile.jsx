import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, MapPin, Phone, Mail, ShieldCheck, Image as ImageIcon, X } from 'lucide-react';

export function SetupProfile() {
  const navigate = useNavigate();
  const { user, setupProfile, logout } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Navigate to dashboard as soon as isProfileSetup becomes true
  useEffect(() => {
    if (user?.isProfileSetup) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.isProfileSetup, navigate]);
  
  const [formData, setFormData] = useState({
    name: user?.name || user?.displayName || '',
    surname: user?.surname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    address: user?.address || '',
    dob: user?.dob || '',
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError('You must accept the Terms and Conditions to continue.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!formData.surname.trim()) {
      setError('Surname is required.');
      return;
    }
    if (!formData.dob) {
      setError('Date of birth is required.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Address is required.');
      return;
    }
    if (!formData.gender) {
      setError('Please select your gender.');
      return;
    }
    if (!formData.phone.trim() || !/^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim())) {
      setError('Please enter a valid phone number (10-15 digits).');
      return;
    }
    if (!file) {
      setError('Please upload a profile photo with your face clearly visible.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('surname', formData.surname.trim());
      data.append('email', formData.email.trim());
      data.append('address', formData.address.trim());
      data.append('gender', formData.gender);
      data.append('phone', formData.phone.trim());
      data.append('dob', formData.dob);
      data.append('photo', file);

      await setupProfile(data);
      // Navigation is handled by the useEffect above that watches user.isProfileSetup
    } catch (err) {
      setError(err.message || 'Failed to complete profile setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo-clean.png" 
            alt="Civic Flow Logo" 
            className="h-16 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden h-12 items-center justify-center text-2xl font-bold text-slate-800">
            CIVIC FLOW
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Complete Your Account Setup
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Please fill in the details below to create your official Citizen Identity Card.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name and Surname Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="surname" className="block text-sm font-medium text-slate-700 mb-1">
                  Surname / Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type="text"
                    name="surname"
                    id="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    placeholder="Surname"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email (Disabled) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  disabled
                  className="pl-10 bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone and Date of Birth Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-slate-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  id="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                  required
                />
              </div>
            </div>

            {/* Gender Select */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                id="gender"
                value={formData.gender}
                onChange={handleChange}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                Residential Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                id="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your full residential address..."
                className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                required
              />
            </div>

            {/* Profile Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Profile Photo (Face clearly visible) <span className="text-red-500">*</span>
              </label>
              {!preview ? (
                <label
                  htmlFor="file-upload"
                  className="mt-1 flex flex-col items-center justify-center px-6 pt-6 pb-7 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer"
                >
                  <ImageIcon className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-blue-600">Click to upload photo</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG up to 5MB</span>
                  <input id="file-upload" name="photo" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} required />
                </label>
              ) : (
                <div className="relative mt-1 inline-block">
                  <img src={preview} alt="Profile preview" className="h-40 w-40 rounded-xl object-cover border border-slate-200 shadow-sm" />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute -top-3 -right-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1.5 transition-colors shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Terms and Conditions Block */}
            <div className="border border-slate-200 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-sm">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Terms and Conditions
              </div>
              <div className="h-32 overflow-y-auto text-xs text-slate-500 space-y-2 pr-1 border-t border-slate-200 pt-2 leading-relaxed">
                <p><strong>1. Reporting Integrity:</strong> You agree that all complaints and details submitted through CivicFlow are genuine, accurate, and relate to real public issues. Falsifying reports or submitting deliberate misinformation is strictly prohibited.</p>
                <p><strong>2. Profile Verification:</strong> You declare that the contact information, address, and gender provided above belong to you and can be used by civic authorities to contact you regarding the resolution of your complaints.</p>
                <p><strong>3. Usage Policy:</strong> CivicFlow is built to facilitate citizen-authority collaboration. Spamming the submission form or using inappropriate language in descriptions may lead to immediate account suspension.</p>
                <p><strong>4. Privacy:</strong> Your personal information is securely stored. Location tags and evidence pictures are used exclusively to process your filed complaints and display aggregated, anonymous data on public dashboards.</p>
              </div>
              <div className="flex items-start mt-4">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                  />
                </div>
                <label htmlFor="terms" className="ml-2 block text-sm text-slate-700 cursor-pointer select-none">
                  I read and accept all the terms and conditions listed above.
                </label>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex justify-between items-center gap-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Log Out
              </button>
              <Button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="px-8"
              >
                {loading ? 'Setting up...' : 'Accept & Activate Account'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
