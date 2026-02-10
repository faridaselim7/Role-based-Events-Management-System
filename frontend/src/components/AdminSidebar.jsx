import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCheck, FaUserShield, FaListUl } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";

export default function AdminSidebar({ onSelect, active = "users", onLogout }) {
  const [selected, setSelected] = useState(active);
  const expanded = true;
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      // Clear auth state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Allow parent to do extra cleanup if passed
      if (onLogout) onLogout();
    } finally {
      // Always navigate to login
      navigate("/login", { replace: true });
    }
  };

  const handleSelect = (key) => {
    setSelected(key);
    if (onSelect) onSelect(key);
  };

  const menuItems = [
    { id: "users", icon: <FaUserCheck />, label: "Admin Management" },
    { id: "admins", icon: <FaUserShield />, label: "User Management" },
    { id: "events", icon: <FaListUl />, label: "All Events" },
  ];

  return (
    <aside
      className={`${expanded ? "w-72" : "w-16"} bg-[#0D1E16] text-white flex flex-col justify-between h-full transition-all duration-300 ease-in-out border-r border-[#1E3B2A]`}
    >
      <div>
        <div className="p-5 text-lg font-semibold border-b border-[#1E3B2A] bg-[#0D1E16] text-white">
          <div className={`flex items-center ${expanded ? "justify-start" : "justify-center"}`}>
            <FaUserShield className="text-xl text-white" aria-hidden="true" />
            <span
              className={`${expanded ? "ml-2 opacity-100 w-auto overflow-visible" : "ml-0 opacity-0 w-0 overflow-hidden"} transition-all duration-200 whitespace-nowrap`}
            >
              Brains704
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-2 p-3 mt-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`group flex items-center ${expanded ? "gap-3 px-4" : "gap-0 px-2 justify-center"} py-3 rounded-lg text-sm font-medium transition-colors ${
                selected === item.id
                  ? "bg-white text-[#0D1E16]"
                  : "text-white hover:bg-white hover:text-[#0D1E16]"
              }`}
            >
              <span className={`${
                selected === item.id
                  ? "text-[#0D1E16]"
                  : "text-white group-hover:text-[#0D1E16]"
              }`}>{item.icon}</span>
              <span
                className={`${expanded ? "opacity-100 w-auto ml-2" : "opacity-0 w-0 ml-0"} transition-all duration-200 overflow-hidden whitespace-nowrap`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className={`${expanded ? "p-4" : "p-2"} border-t border-[#1E3B2A]`}>
        <button
          type="button"
          title="Logout"
          aria-label={expanded ? "Logout from Admin" : "Logout"}
          onClick={handleLogout}
          className={`relative mb-2 w-full overflow-hidden rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D1E16] focus:ring-white/30 ${
            expanded
              ? "flex items-center gap-3 px-4 py-3 bg-transparent text-white border border-white/20 hover:bg-white/10"
              : "flex items-center justify-center p-3 bg-transparent text-white border border-white/20 hover:bg-white/10"
          }`}
        >
          <span
            className={`flex items-center justify-center rounded-full ${
              expanded ? "h-10 w-10" : "h-9 w-9"
            }`}
          >
            <FiLogOut className="text-lg text-white" />
          </span>
          {expanded && (
            <div className="flex flex-col text-left leading-tight">
              <span className="text-sm font-semibold text-white">Admin</span>
              <span className="text-xs text-white/80">Logout</span>
            </div>
          )}
        </button>
        {expanded && <div className="text-[10px] text-white/80 text-center">© GUC Admin 2025</div>}
      </div>
    </aside>
  );
}
