import React, { useState } from 'react';
import ClickSpark from './components/ClickSpark';
import Recognition from './pages/Recognition';
import Students from './pages/Students';
import History from './pages/History';
import { Camera, Users, FileText, Sparkles } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('recognition');

  return (
    <ClickSpark sparkColor='#c084fc' sparkSize={20} sparkRadius={40} sparkCount={12} duration={500}>
      <div className="min-h-screen bg-[#060010] text-white font-sans flex flex-col relative overflow-visible custom-scrollbar">
        
        {/* Navigation Bar */}
        <nav className="w-full bg-[#10081c]/80 border-b border-white/10 px-8 py-4 flex justify-between items-center z-50 backdrop-blur-xl sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c084fc] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#c084fc] via-[#f472b6] to-[#38bdf8] tracking-widest drop-shadow-sm">AuraTrack</h1>
          </div>

          <div className="flex items-center gap-2 bg-[#0a0512] p-1.5 rounded-full border border-white/5 shadow-inner">
            <button 
              onClick={() => setActiveTab('recognition')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === 'recognition' ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-[#38bdf8] font-semibold border border-[#38bdf8]/30 shadow-lg' : 'hover:bg-white/5 text-gray-400 border border-transparent'}`}>
              <Camera size={18} /> Run Scanner
            </button>
            <button 
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === 'students' ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-[#f472b6] font-semibold border border-[#f472b6]/30 shadow-lg' : 'hover:bg-white/5 text-gray-400 border border-transparent'}`}>
              <Users size={18} /> Members
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === 'history' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-[#c084fc] font-semibold border border-[#c084fc]/30 shadow-lg' : 'hover:bg-white/5 text-gray-400 border border-transparent'}`}>
              <FileText size={18} /> History
            </button>
          </div>
        </nav>

        {/* Dynamic Page Content */}
        <div className="flex-1 w-full p-8 flex flex-col items-center">
          {activeTab === 'recognition' && <Recognition />}
          {activeTab === 'students' && <Students />}
          {activeTab === 'history' && <History />}
        </div>
      </div>
    </ClickSpark>
  );
}

export default App;
