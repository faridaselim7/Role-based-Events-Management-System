import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Toaster, toast } from 'sonner';
import logo from './logo.png';
import illustration from './illustration.png';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

export default function SignupPage({ onSignup, onSwitchToLogin }) {
  const [userType, setUserType] = useState('student_staff');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    studentStaffId: '',
    role: 'student',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const mapRoleToBackend = (roleKey, userTypeKey) => {
    if (userTypeKey === 'vendor') return 'Vendor';
    switch (roleKey) {
      case 'student': return 'Student';
      case 'staff': return 'Staff';
      case 'ta': return 'TA';
      case 'professor': return 'Professor';
      default: return 'Student';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    // --- VALIDATION RULES ---
    const gucEmailRegex = /^[a-zA-Z0-9._%+-]+@(student\.)?guc\.edu\.eg$/;
    const idRegex = /^\d{2}-\d{4,5}$/;
    const generalEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (userType === 'student_staff') {
      if (!gucEmailRegex.test(formData.email)) {
        toast.error('Email must end with @guc.edu.eg');
        setLoading(false);
        return;
      }
  
      if (!idRegex.test(formData.studentStaffId)) {
        toast.error('ID must be in format XX-XXXXX (e.g. 12-34567)');
        setLoading(false);
        return;
      }
    } else if (userType === 'vendor') {
      if (!generalEmailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        setLoading(false);
        return;
      }
  
      if (gucEmailRegex.test(formData.email)) {
        toast.error('Vendor email cannot end with @guc.edu.eg');
        setLoading(false);
        return;
      }
    }
  
    // --- PAYLOAD ---
    const payload = {
      email: formData.email,
      password: formData.password,
      role: mapRoleToBackend(formData.role, userType),
    };
  
    if (userType === 'student_staff') {
      payload.firstName = formData.firstName;
      payload.lastName = formData.lastName;
      payload.studentOrStaffId = formData.studentStaffId;
    } else {
      payload.companyName = formData.companyName;
    }
  
    const url = `${API_BASE}/api/auth/signup`;
  
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = data?.message || `Signup failed (${res.status})`;
        toast.error(message);
        return;
      }
  
      toast.success(data?.message || 'Signup successful!');
      onSignup?.(data?.user || { registered: true });
    } catch (err) {
      console.error('❌ Network error during signup:', err);
      toast.error('Network error — check if backend (port 5001) is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAF9] relative">
      <Toaster />
      
      {/* Left Panel - Illustration & Welcome */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-gradient-to-br from-[#D7E5E0] via-[#E5E9D5] to-[#F5E6E8] relative overflow-hidden">
        {/* Smooth Curved Divider with Realistic Shadow */}
        <div className="absolute -right-12 top-0 bottom-0 w-24 z-20">
          {/* Shadow layer */}
          <div className="absolute inset-0 -left-2">
            <svg
              className="h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                  <feOffset dx="-2" dy="0" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M0,0 C35,15 35,85 0,100 L100,100 L100,0 Z"
                fill="#1a1a1a"
                opacity="0.08"
                filter="url(#shadow)"
              />
            </svg>
          </div>
          {/* Main curve */}
          <svg
            className="absolute h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,0 C35,15 35,85 0,100 L100,100 L100,0 Z"
              fill="#F8FAF9"
            />
          </svg>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-48 h-48 bg-[#B4D4C8]/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-32 right-32 w-40 h-40 bg-[#D7E5E0]/30 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-10 w-32 h-32 bg-[#E5E9D5]/25 rounded-full blur-2xl animate-float-slow"></div>
          
          {/* Modern geometric shapes */}
          <div className="absolute top-1/4 right-16 w-20 h-20 border-2 border-[#3A6F5F]/10 rounded-2xl rotate-12 animate-spin-slow"></div>
          <div className="absolute bottom-1/4 left-16 w-16 h-16 border-2 border-[#2D5F4F]/10 rounded-full animate-pulse-slow"></div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(#2D5F4F 1px, transparent 1px), linear-gradient(90deg, #2D5F4F 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 py-6">
          {/* Welcome Text */}
          <div className="text-center space-y-4 max-w-lg mb-5">
            <h1 className="text-5xl font-bold text-[#2D5F4F] leading-tight tracking-tight">
              Join Us
            </h1>
            <h2 className="text-4xl font-bold text-[#3A6F5F] leading-tight">
              GUC Events Management
            </h2>
            <p className="text-[#4A7B6B] text-lg font-semibold pt-3">
              Create Your Account Today
            </p>
            <div className="pt-4 flex items-center justify-center gap-2">
              <div className="w-16 h-1.5 bg-[#2D5F4F] rounded-full shadow-md"></div>
              <div className="w-6 h-1.5 bg-[#3A6F5F] rounded-full shadow-sm"></div>
              <div className="w-3 h-1.5 bg-[#B4D4C8] rounded-full"></div>
            </div>
          </div>
          
          {/* Illustration */}
          <div className="w-full max-w-2xl relative">
            <img 
              src={illustration}
              alt="GUC Events Community" 
              className="relative w-full h-auto object-contain drop-shadow-2xl"
            />
            
            {/* Floating stats cards */}
            <div className="absolute -top-4 -left-4 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-lg border border-white/60 animate-float-card">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-base font-bold text-[#2D5F4F]">Live Events</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-lg border border-white/60 animate-float-card-delayed">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#2D5F4F]">1000+ Users</span>
                <div className="w-3 h-3 bg-[#3A6F5F] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-start p-6 lg:pl-16 lg:pr-12 relative overflow-y-auto">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(#2D5F4F 1px, transparent 1px), linear-gradient(90deg, #2D5F4F 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        
          <div className="w-full max-w-2xl lg:max-w-3xl 2xl:max-w-4xl relative z-10 px-4 lg:px-0">
          <Card className="border border-[#D7E5E0]/50 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-500 py-4 lg:py-6">            
          <CardHeader className="space-y-2 pt-6 pb-4 px-6 lg:px-8">
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#3A6F5F] to-transparent"></div>
              
              {/* Logo */}
              <div className="flex items-center justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D7E5E0] to-[#B4D4C8] rounded-2xl blur-md group-hover:blur-lg transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-[#D7E5E0] to-[#B4D4C8] p-4 rounded-2xl shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src={logo}
                      alt="BRAINS704 Logo" 
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                </div>
              </div>
              
              {/* Title */}
              <div className="text-center space-y-2 pt-3">
                <CardTitle className="text-4xl font-bold text-[#2D5F4F] tracking-tight">
                  Sign Up
                </CardTitle>
                <CardDescription className="text-[#6B8E7F] text-base">
                  Create your account to get started
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-6 px-6 lg:px-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Account Type */}
                <div className="space-y-2 group">
                  <Label className="text-[#2D5F4F] font-semibold text-sm flex items-center gap-2 group-focus-within:text-[#3A6F5F] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Account Type
                  </Label>
                  <Select value={userType} onValueChange={(v) => setUserType(v)}>
                    <SelectTrigger className="border-2 border-[#D7E5E0] bg-[#F8FAF9] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 h-12 rounded-xl transition-all duration-300 text-[#2D5F4F] hover:border-[#B4D4C8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[#D7E5E0] rounded-xl shadow-lg z-50">
                      <SelectItem value="student_staff">Student/Staff/TA/Professor</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fields for Student/Staff */}
                {userType === 'student_staff' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#2D5F4F] font-semibold text-sm">First Name</Label>
                        <Input
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 h-12 rounded-xl transition-all duration-300 px-4 hover:border-[#B4D4C8]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#2D5F4F] font-semibold text-sm">Last Name</Label>
                        <Input
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 h-12 rounded-xl transition-all duration-300 px-4 hover:border-[#B4D4C8]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label className="text-[#2D5F4F] font-semibold text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Role
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(v) => setFormData({ ...formData, role: v })}
                      >
                        <SelectTrigger className="border-2 border-[#D7E5E0] bg-[#F8FAF9] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 h-12 rounded-xl transition-all duration-300 text-[#2D5F4F] hover:border-[#B4D4C8]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-[#D7E5E0] rounded-xl shadow-lg z-50">
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="ta">TA</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 group">
                      <Label className="text-[#2D5F4F] font-semibold text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        Student/Staff ID
                      </Label>
                      <Input
                        placeholder="e.g. 12-34567"
                        value={formData.studentStaffId}
                        onChange={(e) => setFormData({ ...formData, studentStaffId: e.target.value })}
                        required
                        className="border-2 border-[#D7E5E0] bg-[#F8FAF9] text-[#2D5F4F] placeholder:text-[#8FB4A3]/60 focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 h-12 rounded-xl transition-all duration-300 px-4 hover:border-[#B4D4C8]"
                      />
                    </div>
                  </>
                ) : (
                  // Vendor
                  <div className="space-y-2 group">
                    <Label className="text-[#2D5F4F] font-semibold text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Company Name
                    </Label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      className="border-2 border-[#D7E5E0] bg-[#F8FAF9] text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 h-12 rounded-xl transition-all duration-300 px-4 hover:border-[#B4D4C8]"
                    />
                  </div>
                )}

                <div className="space-y-2 group">
                  <Label className="text-[#2D5F4F] font-semibold text-sm flex items-center gap-2 group-focus-within:text-[#3A6F5F] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    placeholder={userType === 'student_staff' ? "example@guc.edu.eg" : "company@example.com"}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="border-2 border-[#D7E5E0] bg-[#F8FAF9] text-[#2D5F4F] placeholder:text-[#8FB4A3]/60 focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 h-12 rounded-xl transition-all duration-300 px-4 hover:border-[#B4D4C8]"
                  />
                </div>

                {/* Password Field with Show/Hide */}
<div className="space-y-2 group">
  <Label className="text-[#2D5F4F] font-semibold text-sm flex items-center gap-2 group-focus-within:text-[#3A6F5F] transition-colors">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
      />
    </svg>
    Password
  </Label>

  <div className="relative">
    <Input
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      value={formData.password}
      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      required
      className="border-2 border-[#D7E5E0] bg-[#F8FAF9] text-[#2D5F4F] 
                 placeholder:text-[#8FB4A3]/60 focus:border-[#3A6F5F] 
                 focus:ring-2 focus:ring-[#B4D4C8]/30 h-12 rounded-xl 
                 transition-all duration-300 px-4 pr-12 hover:border-[#B4D4C8]"
    />

    {/* Show/Hide Button */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-3 flex items-center 
                 text-[#8FB4A3] hover:text-[#2D5F4F] transition-colors"
    >
      {showPassword ? (
        // Eye Off Icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.03-10-7 
                0-1.148.49-2.36 1.375-3.425m3.252-2.602A9.986 9.986 0 0112 5c5.523 0 
                10 4.03 10 7 0 1.148-.49 2.36-1.375 3.425m-3.181 2.48L4 4" />
        </svg>
      ) : (
        // Eye On Icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 
                9.542 7-1.274 4.057-5.065 7-9.542 
                7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  </div>
</div>


                {/* Sign Up Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2D5F4F] hover:bg-[#3A6F5F] text-white font-bold py-3 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 h-12 mt-4 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></span>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              {onSwitchToLogin && (
                <>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#D7E5E0]"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 py-1 bg-white text-[#8FB4A3] font-medium">
                        Already have an account?
                      </span>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <Button
                    variant="outline"
                    onClick={onSwitchToLogin}
                    className="w-full border-2 border-[#D7E5E0] bg-transparent text-[#2D5F4F] hover:bg-[#F8FAF9] hover:border-[#3A6F5F] font-semibold h-12 rounded-xl transition-all duration-300 text-base group"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                    </span>
                  </Button>
                </>
              )}

              {/* Security Badge */}
              <div className="text-center pt-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F8FAF9] rounded-full border border-[#D7E5E0]">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-[#8FB4A3] font-medium">
                    Secure GUC Authentication
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
            opacity: 0.3; 
          }
          50% { 
            transform: translateY(-30px) translateX(20px); 
            opacity: 0.5; 
          }
        }
        
        @keyframes float-delayed {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
            opacity: 0.3; 
          }
          50% { 
            transform: translateY(-40px) translateX(-20px); 
            opacity: 0.6; 
          }
        }
        
        @keyframes float-slow {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
            opacity: 0.2; 
          }
          50% { 
            transform: translateY(-20px) translateX(15px); 
            opacity: 0.4; 
          }
        }
        
        @keyframes float-card {
          0%, 100% { 
            transform: translateY(0px);
          }
          50% { 
            transform: translateY(-8px);
          }
        }
        
        @keyframes float-card-delayed {
          0%, 100% { 
            transform: translateY(0px);
          }
          50% { 
            transform: translateY(-10px);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(12deg);
          }
          to {
            transform: rotate(372deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }
        
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 12s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 14s ease-in-out infinite;
        }
        
        .animate-float-card {
          animation: float-card 4s ease-in-out infinite;
        }
        
        .animate-float-card-delayed {
          animation: float-card-delayed 5s ease-in-out infinite 0.5s;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}