import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Tiang1 from './pages/Tiang1';
import Tiang2 from './pages/Tiang2';
import Tiang3 from './pages/Tiang3';
import Tiang4 from './pages/Tiang4';
import Tiang5 from './pages/Tiang5';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Navbar horizontal di atas */}
        <Navbar />

        {/* Konten utama memenuhi lebar layar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 min-h-screen transition-colors duration-300">
          <Routes>
            <Route path="/tiang1" element={<Tiang1 />} />
            <Route path="/tiang2" element={<Tiang2 />} />
            <Route path="/tiang3" element={<Tiang3 />} />
            <Route path="/tiang4" element={<Tiang4 />} />
            <Route path="/tiang5" element={<Tiang5 />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}