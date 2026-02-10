import { FaUserShield } from "react-icons/fa";

export default function Navbar() {
  return (
    <header className="bg-white text-[#816251] border-b border-[#E5E9D5] px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6F7EEA] rounded-xl flex items-center justify-center">
            <FaUserShield className="text-white text-lg" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#816251]">Brains704</h1>
            <p className="text-sm text-[#8A8A8A]">Event Management System</p>
          </div>
        </div>
        
        {/* Optional: Add user menu or notifications here */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#E5E59B] rounded-full flex items-center justify-center text-sm font-semibold text-[#816251]">
            U
          </div>
        </div>
      </div>
    </header>
  );
}