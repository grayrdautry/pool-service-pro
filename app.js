const { useState, useEffect, useMemo } = React;

function ServiceApp() {
  const [tab, setTab] = useState("HOME");
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("PoolPro_V1") || "[]"));
  const [showEntry, setShowEntry] = useState(false);
  const [poolData, setPoolData] = useState(null);
  
  // Form State
  const [customer, setCustomer] = useState("");
  const [jobType, setJobType] = useState("SERVICE");
  const [partsList, setPartsList] = useState([]);
  const [photoB, setPhotoB] = useState(null);
  const [photoA, setPhotoA] = useState(null);
  const [photoS, setPhotoS] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Inventory (GPT Fix: Error Handling)
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

  // 2. Save History
  useEffect(() => {
    localStorage.setItem("PoolPro_V1", JSON.stringify(history));
  }, [history]);

  // 3. Image Compression (GPT Fix: Math.min prevents upscaling)
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

  const addPart = (part) => {
    setPartsList([...partsList, { ...part, id: Date.now() }]);
    setSearchTerm("");
  };

  const saveVisit = () => {
    if(!customer) return alert("Enter Customer Name");
    const entry = {
      id: Date.now(), name: customer, jobType, date: new Date().toLocaleDateString(),
      parts: [...partsList], total: partsList.reduce((s, p) => s + p.price, 0).toFixed(2),
      photos: { b: photoB, a: photoA, s: photoS }
    };
    setHistory([entry, ...history]);
    setCustomer(""); setPartsList([]); setPhotoB(null); setPhotoA(null); setPhotoS(null); setShowEntry(false);
  };

  return (
    <div className="app-container">
      <div className="dash-header">
        <h1>Pool Service Pro</h1>
        <div className="welcome">Field Operator V1.0</div>
      </div>

      {tab === "HOME" && (
        <div style={{paddingBottom: '100px'}}>
          <button className="add-job-btn" onClick={() => setShowEntry(true)}>
            <i className="fa-solid fa-plus"></i> NEW JOB ENTRY
          </button>
          
          <div style={{padding: '0 20px'}}>
            <h3 style={{color: '#1e3a8a'}}>Recent History</h3>
            {history.length === 0 && <p style={{color: '#64748b'}}>No jobs saved yet.</p>}
            {history.map(h => (
              <div key={h.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '12px', borderLeft: '5px solid #10b981'}}>
                <div>
                  <strong style={{fontSize: '16px'}}>{h.name.toUpperCase()}</strong>
                  <div style={{fontSize: '12px', color: '#64748b'}}>{h.date} — {h.parts.length} parts added</div>
                </div>
                <div style={{textAlign: 'right'}}>
                   <div style={{fontWeight: '800', color: '#1e3a8a'}}>${h.total}</div>
                   <i className="fa-solid fa-chevron-right" style={{color: '#cbd5e1', fontSize: '12px'}}></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEntry && (
        <div className="modal-overlay">
          <div style={{padding: '20px', background: '#f8fafc', minHeight: '100vh'}}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                <h2 style={{margin:0}}>New Job</h2>
                <button onClick={() => setShowEntry(false)} style={{border:'none', background:'none', color:'#ef4444', fontWeight:'bold'}}>CANCEL</button>
             </div>
             
             <div className="card">
                <label style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b'}}>CUSTOMER NAME</label>
                <input className="input-field" placeholder="Search or Enter Client..." value={customer} onChange={e => setCustomer(e.target.value)} />
                
                <div style={{marginTop: '20px'}}>
                   <label style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b'}}>JOB PHOTOS</label>
                   <div style={{display:'flex', gap: '15px', marginTop: '10px'}}>
                      <div onClick={() => document.getElementById('f1').click()} className="photo-tile" style={{background: photoB ? 'none' : '#fff', border: '2px dashed #cbd5e1', width: '90px', height: '90px', borderRadius: '15px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                         {photoB ? <img src={photoB} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{textAlign:'center'}}><i className="fa-solid fa-camera"></i><div style={{fontSize: '10px'}}>BEFORE</div></div>}
                      </div>
                      <input type="file" id="f1" hidden accept="image/*" onChange={e => compressImage(e.target.files[0], setPhotoB)} />
                   </div>
                </div>
             </div>

             <div className="card" style={{marginTop: '15px'}}>
                <label style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b'}}>PARTS & INVENTORY</label>
                <input className="input-field" style={{marginTop: '10px'}} placeholder="Search parts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                
                {searchTerm.length > 1 && (
                   <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '5px'}}>
                      {Object.keys(poolData || {}).map(brand => 
                        Object.keys(poolData[brand]).map(cat => 
                          poolData[brand][cat].filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                            <div key={p.partNum} onClick={() => addPart(p)} style={{padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px'}}>
                               {p.name} — <span style={{color: '#10b981'}}>${p.price}</span>
                            </div>
                          ))
                        )
                      )}
                   </div>
                )}

                {partsList.map(p => (
                   <div key={p.id} style={{display:'flex', justifyContent:'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9'}}>
                      <span>{p.name}</span>
                      <strong>${p.price}</strong>
                   </div>
                ))}
             </div>

             <button className="add-job-btn" style={{width:'100%', background: '#1e3a8a', marginTop: '30px', boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.3)'}} onClick={saveVisit}>
                COMPLETE & SAVE JOB
             </button>
          </div>
        </div>
      )}

      <div className="bottom-toolbar">
        <div className={`nav-item ${tab === "HOME" ? 'active' : ''}`} onClick={() => setTab("HOME")}>
          <i className="fa-solid fa-house"></i><span>Dashboard</span>
        </div>
        <div className="nav-item"><i className="fa-solid fa-file-invoice"></i><span>Invoices</span></div>
        <div className="nav-item"><i className="fa-solid fa-gear"></i><span>Settings</span></div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ServiceApp />);
