import React, { useState, useRef, useEffect } from 'react';
import BorderGlow from '../components/BorderGlow';
import { Upload, Users, CheckCircle, Clock, ScanFace, X, Edit2, Trash2, Save, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Recognition() {
  const [fileObject, setFileObject] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  // App Phases: idle -> scanning -> extraction -> recognition -> review -> saved
  const [phase, setPhase] = useState('idle');
  const [records, setRecords] = useState([]);
  const [imageSize, setImageSize] = useState({ w: 1, h: 1 });
  const imgRef = useRef(null);

  const handleUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileObject(e.target.files[0]);
      setFilePreview(URL.createObjectURL(e.target.files[0]));
      setPhase('idle');
      setRecords([]);
    }
  };

  const handleImageLoad = (e) => {
    setImageSize({
      w: e.target.naturalWidth,
      h: e.target.naturalHeight
    });
  };

  const handleRecognize = async () => {
    if (!fileObject) return;
    setPhase('scanning'); // Start scan line animation
    
    const formData = new FormData();
    formData.append('image', fileObject);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '';
      const res = await fetch(`${apiUrl}/api/recognize`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.records) {
        // Prepare records with UI state
        const formattedRecords = data.records.map((r, i) => ({
          id: i,
          name: r.Name,
          originalName: r.Name,
          time: r.Timestamp ? r.Timestamp.split(' ')[1] : '-', 
          conf: parseFloat(r.Confidence_Percentage),
          status: r.Status,
          box: r.box, // [x1, y1, x2, y2]
          isEditing: false
        }));
        setRecords(formattedRecords);
        
        // Progress through phases
        setPhase('extraction');
        setTimeout(() => {
          setPhase('recognition');
          setTimeout(() => {
            setPhase('review');
          }, formattedRecords.length * 500 + 1000); // Wait for recognition flip
        }, 1500); // 1.5s for extraction
        
      } else {
        alert("No records returned from AI Model.");
        setPhase('idle');
      }
    } catch(err) {
      alert("Error calling recognizing backend! Make sure python backend server is running.");
      console.error(err);
      setPhase('idle');
    }
  };
  
  const handleClear = () => {
    setFileObject(null);
    setFilePreview(null);
    setPhase('idle');
    setRecords([]);
  };

  const handleRemoveRecord = (id) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const toggleEdit = (id) => {
    setRecords(records.map(r => r.id === id ? { ...r, isEditing: !r.isEditing } : r));
  };

  const updateName = (id, newName) => {
    setRecords(records.map(r => r.id === id ? { ...r, name: newName, status: newName !== 'Unknown' ? 'Present' : 'Unknown' } : r));
  };

  const saveAttendance = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '';
      const res = await fetch(`${apiUrl}/api/attendance/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          records: records.map(r => ({
            Name: r.name,
            Timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            Confidence_Percentage: r.conf,
            Status: r.status
          }))
        })
      });
      if(res.ok) {
        setPhase('saved');
      }
    } catch(err) {
      alert("Error saving attendance.");
    }
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Name,Status,Match\n";
    records.forEach(r => {
      csvContent += `${r.name},${r.status},${r.conf}%\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_export.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500 pb-20">
      <header className="mb-10 text-center mt-6">
        <h2 className="text-4xl font-extrabold mb-3 text-white drop-shadow-md">Scan & Recognize</h2>
        <p className="text-gray-400">Upload a group photo to automatically mark attendance.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 w-full max-w-7xl z-10">
        
        {/* Upload & Image Preview Section */}
        <BorderGlow glowColor="280 100 70" colors={['#c084fc', '#f472b6', '#38bdf8']} borderRadius={28}>
          <div className="p-8 h-[600px] flex flex-col items-center justify-center text-center relative group w-full">
            
            {filePreview ? (
              <div className="flex flex-col items-center w-full h-full relative">
                
                <div className="relative w-full h-[85%] rounded-2xl overflow-hidden shadow-2xl mb-4 border border-white/10 flex items-center justify-center bg-black/40">
                  <motion.img 
                    ref={imgRef}
                    onLoad={handleImageLoad}
                    src={filePreview} 
                    className="max-w-full max-h-full object-contain"
                    animate={phase === 'scanning' ? { filter: ["blur(0px)", "blur(3px)", "blur(0px)"] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {/* Scanning Animation */}
                  {phase === 'scanning' && (
                    <>
                      <motion.div 
                        className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_#38bdf8]"
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
                    </>
                  )}

                  {/* Extracting & Recognition Bounding Boxes */}
                  {(phase === 'extraction' || phase === 'recognition' || phase === 'review' || phase === 'saved') && imgRef.current && records.map((r, i) => {
                    // Calculate visual coordinates based on object-contain
                    const imgRatio = imageSize.w / imageSize.h;
                    const containerRatio = imgRef.current.clientWidth / imgRef.current.clientHeight;
                    
                    let renderW = imgRef.current.clientWidth;
                    let renderH = imgRef.current.clientHeight;
                    let offsetX = 0;
                    let offsetY = 0;

                    if (imgRatio > containerRatio) {
                      renderH = renderW / imgRatio;
                      offsetY = (imgRef.current.clientHeight - renderH) / 2;
                    } else {
                      renderW = renderH * imgRatio;
                      offsetX = (imgRef.current.clientWidth - renderW) / 2;
                    }

                    const scaleX = renderW / imageSize.w;
                    const scaleY = renderH / imageSize.h;

                    const [bx1, by1, bx2, by2] = r.box;
                    const left = offsetX + bx1 * scaleX;
                    const top = offsetY + by1 * scaleY;
                    const width = (bx2 - bx1) * scaleX;
                    const height = (by2 - by1) * scaleY;

                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.2, duration: 0.4 }}
                        className={`absolute border-2 ${r.name === 'Unknown' ? 'border-red-500 shadow-[0_0_10px_red]' : 'border-green-400 shadow-[0_0_10px_#4ade80]'}`}
                        style={{ left, top, width, height }}
                      >
                        {/* Recognition Flip Card over the face */}
                        {(phase === 'recognition' || phase === 'review' || phase === 'saved') && (
                          <motion.div 
                            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                            initial={{ rotateY: 90 }}
                            animate={{ rotateY: 0 }}
                            transition={{ delay: (records.length * 0.2) + (i * 0.3), duration: 0.5 }}
                          >
                            <div className={`px-2 py-1 text-xs font-bold rounded text-white ${r.name === 'Unknown' ? 'bg-red-500' : 'bg-green-500'}`}>
                              {r.name}
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Loading ring during recognition transition */}
                        {phase === 'recognition' && (
                          <motion.div
                            className="absolute inset-0 border-4 border-t-transparent border-white rounded-full m-auto w-8 h-8"
                            animate={{ rotate: 360, opacity: [1, 0] }}
                            transition={{ duration: 1, repeat: 1 }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Cancel Button */}
                {phase === 'idle' && (
                  <button onClick={handleClear} className="absolute top-4 right-4 bg-black/50 hover:bg-red-500/80 backdrop-blur-md p-2 rounded-full transition-all">
                      <X size={20} className="text-white"/>
                  </button>
                )}
                
                {/* Recognize Trigger Button */}
                {phase === 'idle' && (
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRecognize} 
                        className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#c084fc] to-[#38bdf8] p-4 rounded-xl font-bold tracking-wider shadow-[0_0_20px_rgba(192,132,252,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] transition-all"
                    >
                        <ScanFace size={24}/> START SCAN
                    </motion.button>
                )}
                
                {phase === 'scanning' && <p className="text-cyan-400 font-mono animate-pulse mt-4">Detecting people...</p>}
                {phase === 'extraction' && <p className="text-pink-400 font-mono animate-pulse mt-4">Extracting faces...</p>}
                {phase === 'recognition' && <p className="text-purple-400 font-mono animate-pulse mt-4">Recognizing identities...</p>}
                {phase === 'review' && <p className="text-green-400 font-mono mt-4 font-bold">Analysis Complete. Please Review.</p>}
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full border-[3px] border-dashed border-white/10 hover:border-[#c084fc]/60 rounded-2xl transition-all duration-500 hover:bg-white/[0.02]">
                <div className="bg-gradient-to-tr from-[#c084fc] to-[#38bdf8] p-6 rounded-full mb-8 shadow-[0_0_40px_rgba(192,132,252,0.4)] group-hover:scale-110 transition-transform duration-500">
                  <Upload size={40} color="#fff" />
                </div>
                <h3 className="text-3xl font-semibold mb-3">Upload Group Photo</h3>
                <p className="text-gray-400 text-base">Drag and drop or click to browse</p>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
              </label>
            )}
          </div>
        </BorderGlow>

        {/* Results / Attendance Generation Section */}
        <AnimatePresence>
          {(phase === 'review' || phase === 'saved') && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <BorderGlow glowColor="190 100 70" colors={['#38bdf8', '#c084fc', '#f472b6']} borderRadius={28}>
                <div className="p-8 h-[600px] flex flex-col w-full relative">
                  
                  <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-5">
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                      <span className="bg-[#1a1025] p-2.5 rounded-xl shadow-lg border border-white/5"><CheckCircle size={28} className="text-[#38bdf8]" /></span>
                      Live Roster
                    </h2>
                    <div className="bg-gradient-to-r from-[#1a1025] to-[#251030] px-6 py-3 rounded-full border border-purple-500/20 flex items-center gap-3 text-base font-bold shadow-lg">
                      <Users size={18} className="text-[#f472b6]" />
                      {records.length} Detected
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar mb-20">
                    <AnimatePresence>
                      {records.map((r, i) => (
                        <motion.div 
                          key={r.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: i * 0.1 }}
                          className={`flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.06] hover:border-purple-500/40 transition-all duration-300 shadow-md group ${r.name === 'Unknown' ? 'border-red-500/30 bg-red-500/5' : ''}`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${r.name === 'Unknown' ? 'bg-red-500/20 text-red-400' : 'bg-gradient-to-tr from-[#38bdf8] to-[#c084fc] text-white'}`}>
                              {r.name === 'Unknown' ? '?' : r.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              {r.isEditing ? (
                                <input 
                                  type="text" 
                                  value={r.name} 
                                  onChange={(e) => updateName(r.id, e.target.value)}
                                  className="bg-black/50 border border-purple-500/50 rounded px-2 py-1 text-white outline-none w-[150px]"
                                  autoFocus
                                  onBlur={() => toggleEdit(r.id)}
                                  onKeyDown={(e) => e.key === 'Enter' && toggleEdit(r.id)}
                                />
                              ) : (
                                <p className="font-bold text-lg tracking-wide">{r.name}</p>
                              )}
                              
                              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden max-w-[150px]">
                                <motion.div 
                                  className={`h-full ${r.name === 'Unknown' ? 'bg-red-500' : 'bg-[#38bdf8]'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${r.conf}%` }}
                                  transition={{ delay: i * 0.1 + 0.5, duration: 0.8 }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-sm font-mono font-bold mb-1 ${r.name === 'Unknown' ? 'text-red-400' : 'text-[#f472b6]'}`}>{r.conf}% Match</p>
                            </div>
                            
                            {/* Action Buttons */}
                            {phase === 'review' && (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => toggleEdit(r.id)} className="p-2 bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleRemoveRecord(r.id)} className="p-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Footer Actions (Absolute positioned at bottom of card) */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#060010] to-transparent border-t border-white/5 flex gap-4">
                    {phase === 'review' ? (
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={saveAttendance}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white p-3 rounded-xl font-bold shadow-[0_0_15px_rgba(74,222,128,0.4)] transition-all"
                      >
                        <Save size={20} /> Save to Database
                      </motion.button>
                    ) : phase === 'saved' ? (
                      <div className="flex-1 flex gap-4">
                        <div className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 text-green-400 p-3 rounded-xl font-bold border border-green-500/30">
                          <CheckCircle size={20} /> Saved Successfully
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={exportCSV}
                          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 rounded-xl font-bold transition-all"
                        >
                          <Download size={20} /> CSV
                        </motion.button>
                      </div>
                    ) : null}
                  </div>

                </div>
              </BorderGlow>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
