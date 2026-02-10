export default function BazaarList({ bazaars, onApply }) {
  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Upcoming Bazaars</h2>
      <ul>
        {bazaars.map((bazaar) => (
          <li key={bazaar._id} className="mb-2 border p-2 rounded flex justify-between items-center">
            <div>
              <p className="font-semibold">{bazaar.name}</p>
              <p>{new Date(bazaar.date).toLocaleDateString()}</p>
              <p>{bazaar.location}</p>
            </div>
            <button
              className="bg-green-500 text-white px-2 py-1 rounded"
              onClick={() => onApply(bazaar)}
            >
              Apply
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
