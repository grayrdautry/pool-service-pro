const { useState, useEffect } = React;

function ServiceApp() {
  // --- NAVIGATION & VIEW STATE ---
  const [tab, setTab] = useState("HOME");
  const [showEntry, setShowEntry] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // --- DATA STATE ---
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("PoolPro_V1") || "[]"));
  const [poolData, setPoolData] = useState(null);
  
  // --- FORM STATE ---
  const [customer, setCustomer] = useState("");
  const [jobType, setJobType] = useState("SERVICE");
  const [partsList, setPartsList] = useState([]);
  const [photoB, setPhotoB] = useState(null);
  const [photoA, setPhotoA] = useState(null);
  const [photoS, setPhotoS] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. FETCH INVENTORY (Safe Mode)
  useEffect(() => {
    fetch(`https://docs.google.com/spreadsheets/d/1-4_vmBPcswsiePsrr9nMPOR2eTapY4f867uPkUuB4YU/gviz/tq?tqx=out:csv`)
      .then(res => res.text())
      .then(csv => {
        const rows = csv.split("\n").slice(1);
        const data = {};
        rows.forEach(row => {
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, "").trim());
          const [brand, cat, name, num, priceRaw] = cols;
          if (brand && cat && name) {
            if (!data[brand]) data[brand] = {};
            if (!data[brand][cat]) data[brand][cat] = [];
            data[brand][cat].push({ name, partNum: num || "N/A", price: parseFloat(priceRaw.replace(/[^\d.]/g, "")) || 0 });
          }
        });
        setPoolData(data);
      }).catch(err => console.error("Inventory Load Failed", err));
  }, []);

  // 2. PERSISTENCE
  useEffect(() => {
    localStorage.setItem("PoolPro_V1", JSON.stringify(history));
  }, [history]);

  // 3. IMAGE COMPRESSION (GPT-5.2 Math Fixed)
  const compressImage = (file, setter) => {
    if (!file) return; 
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_W = 800;
        const scale = Math.min(1, MAX_W / img.width); 
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setter(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  };

  // 4. ACTIONS
  const addPart = (part) => {
    setPartsList([...partsList, { ...part, id: Date.now() }]);
    setSearchTerm("");
  };

  const removePart = (id) => {
    setPartsList(partsList.filter(p => p.id !== id));
  };

  const saveVisit = () => {
    if(!customer) return alert("Please enter a customer name.");
    const entry = {
      id: Date.now(), name: customer, jobType, date: new Date().toLocaleDateString(),
      parts: [...partsList], total: partsList.reduce((s, p) => s + p.price, 0).toFixed(2),
      photos: { b: photoB, a: photoA, s: photoS }
    };
    setHistory([entry, ...history]);
    // Reset Everything
    setCustomer(""); setPartsList([]); setPhotoB(null); setPhotoA(null); setPhotoS(null); 
    setShowEntry(false); setTab("HOME");
  };

  // --- RENDER HELPERS ---
  const filteredResults = [];
  if (searchTerm.length > 1 && poolData) {
    Object.keys(poolData).forEach(brand => {
      Object.keys(poolData[brand]).forEach(cat => {
        poolData[brand][cat].forEach(p => {
          if (p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            filteredResults.push(p);
          }
        });
      });
    });
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <div className="dash-header">
        <h1>Pool Service Pro</h1>
        <div className="welcome">{tab === "HOME" ? "Dashboard" : tab}</div>
      </div>

      {/* VIEW: HOME / HISTORY */}
      {tab === "HOME" && !showEntry && !selectedJob && (
        <div style={{paddingBottom: '100px'}}>
          <button className="add-job-btn" onClick={() => setShowEntry(true)}>
            <i className="fa-solid fa-plus"></i> NEW JOB ENTRY
          </button>
          
          <div style={{padding: '0 20px'}}>
            <h3 style={{color: '#1e3a8a'}}>Recent History</h3>
            {history.length === 0 && <p style={{color: '#64748b'}}>No jobs saved yet.</p>}
            {history.map(h => (
              <div key={h.id} className="card" onClick={() => setSelectedJob(h)} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '12px', cursor: 'pointer'}}>
                <div>
                  <strong style={{fontSize: '16px'}}>{h.name.toUpperCase()}</strong>
                  <div style={{fontSize: '12px', color: '#64748b'}}>{h.date} — ${h.total}</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{color: '#cbd5e1'}}></i>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: NEW ENTRY MODAL */}
      {showEntry && (
        <div className="modal-overlay" style={{display: 'block', overflowY: 'auto'}}>
          <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh', paddingBottom: '100px'}}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                <h2 style={{margin:0}}>New Job</h2>
                <button onClick={() => setShowEntry(false)} style={{border:'none', background:'none', color:'#ef4444', fontWeight:'bold', fontSize: '16px'}}>CANCEL</button>
             </div>
             
             {/* Customer & Photos */}
             <div className="card">
                <label style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b'}}>CUSTOMER NAME</label>
                <input className="input-field" placeholder="Enter Client Name..." value={customer} onChange={e => setCustomer(e.target.value)} />
                
                <div style={{marginTop: '20px'}}>
                   <label style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b'}}>JOB PHOTOS</label>
                   <div style={{display:'flex', gap: '15px', marginTop: '10px'}}>
                      <div onClick={() => document.getElementById('f-before').click()} className="photo-tile" style={{background: photoB ? 'none' : '#fff', border: '2px dashed #cbd5e1', width: '90px', height: '90px', borderRadius: '15px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                         {photoB ? <img src={photoB} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <i className="fa-solid fa-camera"></i>}
                      </div>
                      <input type="file" id="f-before" hidden accept="image/*" onChange={e => compressImage(e.target.files[0], setPhotoB)} />
                   </div>
                </div>
             </div>

             {/* Inventory Search */}
             <div className="card" style={{marginTop: '15px'}}>
                <label style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b'}}>PARTS & INVENTORY</label>
                <input className="input-field" style={{marginTop: '10px'}} placeholder="Search parts list..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                
                {filteredResults.length > 0 && (
                   <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '5px', background: 'white'}}>
                      {filteredResults.map((p, idx) => (
                        <div key={idx} onClick={() => addPart(p)} style={{padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px'}}>
                           {p.name} — <span style={{color: '#10b981'}}>${p.price}</span>
                        </div>
                      ))}
                   </div>
                )}

                {partsList.map(p => (
                   <div key={p.id} style={{display:'flex', justifyContent:'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9'}}>
                      <span>{p.name}</span>
                      <div style={{display:'flex', alignItems:'center', gap: '10px'}}>
                        <strong>${p.price}</strong>
                        <i className="fa-solid fa-circle-xmark" style={{color: '#ef4444'}} onClick={() => removePart(p.id)}></i>
                      </div>
                   </div>
                ))}
             </div>

             <button className="add-job-btn" style={{width:'100%', background: '#1e3a8a', marginTop: '30px'}} onClick={saveVisit}>
                COMPLETE & SAVE JOB
             </button>
          </div>
        </div>
      )}

      {/* VIEW: JOB DETAILS */}
      {selectedJob && (
        <div className="modal-overlay" style={{display: 'block'}}>
           <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh'}}>
              <button onClick={() => setSelectedJob(null)} style={{background: 'none', border: 'none', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '20px'}}>
                <i className="fa-solid fa-chevron-left"></i> BACK
              </button>
              <h2>{selectedJob.name}</h2>
              <p>{selectedJob.date}</p>
              <div className="card">
                {selectedJob.photos.b && <img src={selectedJob.photos.b} style={{width: '100%', borderRadius: '10px'}} />}
                <div style={{marginTop: '15px'}}>
                  {selectedJob.parts.map((p, i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding: '5px 0'}}>
                      <span>{p.name}</span>
                      <span>${p.price}</span>
                    </div>
                  ))}
                  <hr />
                  <div style={{display:'flex', justifyContent:'space-between', fontWeight: 'bold'}}>
                    <span>Total</span>
                    <span>${selectedJob.total}</span>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* BOTTOM TOOLBAR - NOW FULLY WIRED */}
      <div className="bottom-toolbar">
        <div className={`nav-item ${tab === "HOME" ? 'active' : ''}`} onClick={() => { setTab("HOME"); setShowEntry(false); setSelectedJob(null); }}>
          <i className="fa-solid fa-house"></i><span>Home</span>
        </div>
        <div className={`nav-item ${tab === "INVENTORY" ? 'active' : ''}`} onClick={() => { setTab("INVENTORY"); setShowEntry(false); }}>
          <i className="fa-solid fa-boxes-stacked"></i><span>Parts</span>
        </div>
        <div className={`nav-item ${tab === "SETTINGS" ? 'active' : ''}`} onClick={() => { setTab("SETTINGS"); setShowEntry(false); }}>
          <i className="fa-solid fa-gear"></i><span>Settings</span>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ServiceApp />);
