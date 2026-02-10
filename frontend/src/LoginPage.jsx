import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import logo from './logo.png';
import illustration from './illustration.png';
import { api } from "./lib/api";
import useNotifications from "./stores/notifications";
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOformStyles,
  EOcardStyles,
  EOalertStyles,
  EObadgeStyles,
  EOradius,
  EOtransitions,
  getCitronGlowEffect,
  getTyrianGlowEffect,
} from "./styles/EOdesignSystem";

export default function LoginPage({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
const [resetEmail, setResetEmail] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [resetLoading, setResetLoading] = useState(false);

const [showPassword, setShowPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });

      console.log('✅ Login response:', data);

      // Save token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Save vendorId for vendors
      if (data.user.role === 'Vendor' || data.user.role === 'vendor') {
        const vendorId = data.user._id || data.user.id;
        console.log('💾 Saving vendorId to localStorage:', vendorId);
        localStorage.setItem('vendorId', vendorId);
      }

      addNotification({
        type: "success",
        message: "Login successful!",
        read: false,
        temporary: true,
      });
      
      if (onLogin) onLogin(data.user);

      // Redirect based on role
      switch (data.user.role) {
        case "vendor":
          navigate("/vendor-dashboard");
          break;
        case "student":
          navigate("/student-dashboard");
          break;
        case "staff":
          navigate("/staff-dashboard");
          break;
        case "ta":
          navigate("/ta-dashboard");
          break;
        case "professor":
          navigate("/professor-dashboard");
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "events_office":
          navigate("/events-office");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.message;

      if (message === "Your account is not yet verified. Please check your email.") {
        addNotification({
          type: "error",
          message: "Your account is not yet verified. Please check your email.",
          read: false,
          temporary: true,
        });
      } else if (message === "Invalid email or password.") {
        addNotification({
          type: "error",
          message: "Invalid email or password.",
          read: false,
          temporary: true,
        });
      } else if (message === "You must use your GUC email to log in") {
        addNotification({
          type: "error",
          message: "You must use your GUC email to log in",
          read: false,
          temporary: true,
        });
      } else {
        addNotification({
          type: "error",
          message: message || "Login failed. Please try again.",
          read: false,
          temporary: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

const handleForgotPassword = async (e) => {
  e.preventDefault();
  if (!resetEmail) {
    addNotification({
      type: "error",
      message: "Please enter your email",
      temporary: true,
    });
    return;
  }

  setResetLoading(true);
  try {
    const { data } = await api.post("/auth/forgot-password", {
      email: resetEmail,
    });

    const resetToken = data.resetToken; // ✅ real token from backend
    const resetLink = `${window.location.origin}/reset-password/${resetToken}`;

    addNotification({
      type: "success",
      title: "Reset Link Ready!",
      message: (
        <div className="space-y-2">
          <p>Password reset link generated!</p>
          <a
            href={resetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-[#2D5F4F] text-white rounded-lg font-bold hover:bg-[#3A6F5F] transition"
          >
            Open Reset Page
          </a>
        </div>
      ),
      duration: 10000,
      temporary: false,
    });

    setResetEmail("");
    setShowForgotPassword(false);
  } catch (err) {
    addNotification({
      type: "error",
      message: err.response?.data?.message || "Failed to send reset link",
      temporary: true,
    });
  } finally {
    setResetLoading(false);
  }
};

  return (
    <div className="min-h-screen flex bg-[#F8FAF9] relative">
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
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 py-10">
          {/* Welcome Text with modern styling */}
          <div className="text-center space-y-4 max-w-lg mb-6">
          <h1 style={{
                                fontSize: "4rem",
                                fontWeight: "800",
                                color: EOcolors.secondary,
                                margin: "0 0 0.5rem 0",
                                letterSpacing: "-0.02em",
                              }}>Welcome To</h1>
            <h2 style={{
                                fontSize: "2.5rem",
                                fontWeight: "800",
                                color: EOcolors.secondary,
                                margin: "0 0 0.5rem 0",
                                letterSpacing: "-0.02em",
                              }}>CampusHub</h2>
            <p className="text-[#4A7B6B] text-lg font-semibold pt-3">
              Connect • Collaborate • Celebrate
            </p>
            <div className="pt-4 flex items-center justify-center gap-2">
              <div className="w-16 h-1.5 bg-[#2D5F4F] rounded-full shadow-md"></div>
              <div className="w-6 h-1.5 bg-[#3A6F5F] rounded-full shadow-sm"></div>
              <div className="w-3 h-1.5 bg-[#B4D4C8] rounded-full"></div>
            </div>
          </div>
          
          {/* Illustration with glassmorphism container */}
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

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-start p-6 lg:pl-16 lg:pr-12 relative">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(#2D5F4F 1px, transparent 1px), linear-gradient(90deg, #2D5F4F 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        <div className="w-full max-w-2xl lg:max-w-4xl relative z-10">
        <Card className="border border-[#D7E5E0]/50 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-shadow duration-500 py-12 lg:py-16 min-h-[600px] lg:min-h-[800px] flex flex-col justify-center">
            <CardHeader className="space-y-3 pt-8 pb-6 px-8 relative">
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
              <CardTitle style={{
  fontSize: "2.3rem",
  fontWeight: "800",
  color: EOcolors.primary,
  margin: "0 0 0.5rem 0",
  letterSpacing: "-0.02em",
}}>
  {showForgotPassword ? "Reset Password" : "Login"}
</CardTitle>
<CardDescription style={{
  fontSize: "1.1rem",
  fontWeight: "800",
  color: EOcolors.dark,
  margin: "0 0 0.5rem 0",
  letterSpacing: "-0.02em",
}}>
  {showForgotPassword ? "Enter your email and new password" : "Enter your credentials to continue"}
</CardDescription>

              </div>
            </CardHeader>

            <CardContent className="space-y-5 pb-8 px-8">
            <form onSubmit={showForgotPassword ? handleForgotPassword : handleLogin} className="space-y-6">
  {/* Email Field */}
  <div className="space-y-2">
    <Label htmlFor="email" className="text-[#2D5F4F] font-semibold flex items-center gap-2">
      Email Address
    </Label>
    <Input
      id="email"
      type="email"
      placeholder="your.email@guc.edu.eg"
      value={showForgotPassword ? resetEmail : email}
      onChange={(e) => showForgotPassword ? setResetEmail(e.target.value) : setEmail(e.target.value)}
      required
      className="border-2 border-[#D7E5E0] bg-[#F8FAF9] focus:border-[#3A6F5F] h-12 rounded-xl"
    />
  </div>

  {/* Show Password Fields Only in Login Mode */}
  {!showForgotPassword && (
    <div className="space-y-2">
      <Label htmlFor="password" className="text-[#2D5F4F] font-semibold flex items-center gap-2">
        Password
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] focus:border-[#3A6F5F] h-12 rounded-xl pr-12"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8FB4A3] hover:text-[#3A6F5F]"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  )}

  {/* Toggle Link */}
  <div className="text-right">
    <button
      type="button"
      onClick={() => {
        setShowForgotPassword(!showForgotPassword);
        setResetEmail("");
        setEmail("");
        setPassword("");
      }}
      className="text-sm text-[#3A6F5F] hover:text-[#2D5F4F] font-semibold hover:underline"
    >
      {showForgotPassword ? "Back to Login" : "Forgot Password?"}
    </button>
  </div>

  {/* Submit Button */}
  <Button
    type="submit"
    disabled={loading || resetLoading}
    className="w-full bg-[#2D5F4F] hover:bg-[#3A6F5F] text-white font-bold py-3 rounded-xl shadow-lg h-12"
  >
    {loading || resetLoading ? (
      <span className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {showForgotPassword ? "Sending Link..." : "Signing In..."}
      </span>
    ) : (
      <span>{showForgotPassword ? "Send Reset Link" : "Sign In"}</span>
    )}
  </Button>
</form>

              {/* Divider */}
              {onSwitchToSignup && !showForgotPassword && (
                <>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#D7E5E0]"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 py-1 bg-white text-[#8FB4A3] font-medium">
                        New to GUC Events?
                      </span>
                    </div>
                  </div>

                  {/* Sign Up Button */}
                  <Button
                    variant="outline"
                    onClick={onSwitchToSignup}
                    className="w-full border-2 border-[#D7E5E0] bg-transparent text-[#2D5F4F] hover:bg-[#F8FAF9] hover:border-[#3A6F5F] font-semibold h-12 rounded-xl transition-all duration-300 text-base group"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Create New Account
                      <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
          @keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
      `}
      </style>
    </div>
  );
}