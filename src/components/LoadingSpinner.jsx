export default function LoadingSpinner({ size = 'w-8 h-8' }) {
  return (
    <div className="flex justify-center items-center">
      <div className={`${size} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}></div>
    </div>
  );
}