import React, { useState, useRef, useEffect } from 'react';
import BorderGlow from '../components/BorderGlow';
import { Camera, UserPlus, Trash2 } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const fileInputRef = useRef(null);

  // Load students from Backend CSV
  useEffect(() => {
    const fetchStudents = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '';
      try {
        const res = await fetch(`${apiUrl}/api/students`);
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        console.error("Could not connect to backend", err);
      }
    };
    fetchStudents();
  }, []);

  const handleDelete = async (idToRemove) => {
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '';
    try {
      await fetch(`${apiUrl}/api/students/${idToRemove}`, { method: 'DELETE' });
      setStudents(students.filter(student => String(student.id) !== String(idToRemove)));
    } catch (err) {
      alert("Failed to delete. Is the python backend server running?");
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const personName = prompt("Please enter the person's name:") || "New Member";
      
      // Prepare form data for Flask upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', personName);

      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '';
      try {
        const res = await fetch(`${apiUrl}/api/students`, {
          method: 'POST',
          body: formData
        });
        
        if (res.ok) {
          const newStudent = await res.json();
          setStudents([...students, newStudent]);
        } else {
          alert('Failed to upload image via Backend API.');
        }
      } catch (err) {
        alert("Could not connect! Please make sure you are running 'python backend.py' in a separate terminal.");
        console.error(err);
      }
      
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 mt-6 gap-6 md:gap-0">
        <div>
          <h2 className="text-4xl font-extrabold mb-3 text-white">Member Profiles</h2>
          <p className="text-gray-400 text-lg">Manage registered faces for the AI to recognize.</p>
        </div>
        
        <button 
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-gradient-to-r from-[#f472b6] to-[#c084fc] hover:from-[#f472b6] hover:to-[#e879f9] text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(244,114,182,0.4)] hover:shadow-[0_0_30px_rgba(244,114,182,0.6)] transition-all transform hover:-translate-y-1"
        >
          <UserPlus size={20} /> Register New
        </button>
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {students.map((student) => (
          <BorderGlow 
            key={student.id} 
            glowColor="340 100 70" 
            colors={['#f472b6', '#c084fc', '#38bdf8']} 
            borderRadius={24}
            glowRadius={30}
          >
            <div className="p-6 h-[300px] flex flex-col items-center text-center bg-[#060010] rounded-[24px]">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/10 mb-4 shadow-xl shrink-0 bg-gray-900">
                <img 
                  src={`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/images/${student.image_filename}`} 
                  alt={student.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.target.src = "https://i.pravatar.cc/150?u=placeholder" }}
                />
              </div>
              <h3 className="text-xl font-bold mb-1">{student.name}</h3>
              <p className="text-[#f472b6] text-sm font-medium mb-auto flex-1 flex items-center">
                ID: #{student.id.toString().slice(-4).padStart(4, '0')}
              </p>
              
              <div className="w-full border-t border-white/10 mt-3 pt-3 flex justify-between items-center">
                <span className="text-xs text-green-400 flex items-center gap-1"><Camera size={12}/> DB Synced</span>
                <button 
                  onClick={() => handleDelete(student.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg"
                  title="Delete User"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </BorderGlow>
        ))}

        {/* Empty Add Card */}
        <BorderGlow glowColor="200 100 70" colors={['#ffffff', '#888888', '#444444']} borderRadius={24}>
           <div 
              onClick={handleAddClick}
              className="p-6 h-[300px] flex flex-col items-center justify-center text-center bg-[#060010]/50 rounded-[24px] cursor-pointer hover:bg-white/[0.05] transition-colors border-2 border-dashed border-white/10 group"
           >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <UserPlus size={32} className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 group-hover:text-white transition-colors">Add Person</h3>
           </div>
        </BorderGlow>
      </div>
    </div>
  );
}
