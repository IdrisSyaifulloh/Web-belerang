// src/components/Navbar.jsx
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const routes = ['tiang1', 'tiang2', 'tiang3', 'tiang4', 'tiang5'];
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <nav className="bg-green-800 dark:bg-gray-900 text-white shadow-md transition-colors duration-300">
      <div className="w-full px-4">
        <div className="relative flex items-center h-16">
          {/* Logo / Judul - Kiri */}
          <div className="flex items-center space-x-2">
            <img 
              src="/logo-rg.png" 
              alt="Logo" 
              className="h-10 w-auto" 
              onError={(e) => {
                console.error('Error loading logo:', e);
                e.target.style.display = 'none';
              }}
            />
            <span className="font-bold text-lg whitespace-nowrap">Dashboard Belerang</span>
          </div>

          {/* Navigasi Horizontal - Tengah */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex space-x-2">
            {routes.map((route, i) => (
              <NavLink
                key={route}
                to={`/${route}`}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-green-800 dark:bg-gray-700 dark:text-white'
                      : 'hover:bg-green-700 dark:hover:bg-gray-800'
                  }`
                }
              >
                Tiang {i + 1}
              </NavLink>
            ))}
          </div>

          {/* Dark Mode Toggle - Kanan */}
          <div className="ml-auto">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-green-700 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? (
                // Sun Icon (Light Mode)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon Icon (Dark Mode)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}