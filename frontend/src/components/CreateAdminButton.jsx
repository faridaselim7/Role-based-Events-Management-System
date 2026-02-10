import { Plus } from "lucide-react";

export default function CreateAdminButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-white border border-gray-200 shadow-md rounded-2xl px-6 py-3 hover:shadow-lg transition-all duration-200"
    >
  <Plus className="text-gray-600" size={18} />
      <span className="text-gray-800 font-medium">Create Admin</span>
    </button>
  );
}
