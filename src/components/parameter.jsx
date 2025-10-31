export default function ParameterCard({ name, status, isSelected }) {
  // Variant classes for the whole card depending on status
  const variant = {
    danger: 'bg-red-100 text-red-900 ring-1 ring-red-300 shadow-red-200',
    aman: 'bg-green-100 text-green-900 ring-1 ring-green-300 shadow-green-200',
    warning: 'bg-yellow-100 text-yellow-900 ring-1 ring-yellow-300 shadow-yellow-200',
    normal: 'bg-white text-gray-900 ring-1 ring-gray-200 shadow-sm'
  }[status || 'normal'];

  // subtle pulse for critical state
  const pulse = status === 'danger' ? 'animate-pulse' : '';

  return (
    <div
      className={`rounded-lg p-4 shadow-md transition-all duration-700 ease-in-out transform hover:scale-105 ${variant} ${pulse} ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{name}</h3>
        <span className="text-sm font-medium uppercase tracking-wide">{status}</span>
      </div>
      <p className="text-sm mt-2 text-gray-700/80">&nbsp;</p>
    </div>
  );
}