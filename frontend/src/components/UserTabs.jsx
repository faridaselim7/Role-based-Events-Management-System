/*
import PropTypes from "prop-types";

export default function UserTabs({ active = "pending", onChange, pendingCount = 0, allCount = 0 }) {
  const tabs = [
    { id: "pending", label: `Pending Verifications (${pendingCount})` },
    { id: "all", label: `All Users (${allCount})` },
  ];

  return (
    <div className="w-full flex justify-center">
      <div className="bg-gray-100 rounded-full flex p-1 w-full max-w-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
              active === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

UserTabs.propTypes = {
  active: PropTypes.string,
  onChange: PropTypes.func,
  pendingCount: PropTypes.number,
  allCount: PropTypes.number,
};
*/