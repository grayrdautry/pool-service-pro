const { useState, useEffect } = React;

function ServiceApp() {
  const [tab, setTab] = useState("HOME");
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem("PoolPro_DarkMode") || "false"));
  const [showEntry, setShowEntry] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [zoomedImg, setZoomedImg] = useState(null);

  const [customer, setCustomer] = useState("");
  const [jobType, setJobType] = useState("SERVICE");
  const [arrival, setArrival] = useState("8:00 AM");
  const [departure, setDeparture] = useState("8:30 AM");
  const [notes, setNotes] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [partsList, setPartsList] = useState([]);
  const [photoB, setPhotoB] = useState(null);
  const [photoA, setPhotoA] = useState(null);
  const [photoS, setPhotoS] = useState(null);

  const [poolData, setPoolData] = useState(null);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("PoolPro_V140_Stable") || "[]"));

  const times = [];
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h > 12 ? h - 12 : h;
      const mm = m === 0 ? "00" : m;
      times.push(`${hh}:${mm} ${h < 12 ? "AM" : "PM"}`);
      if (h === 20 && m === 0) break;
    }
  }

  useEffect(() => {
    fetch(`https://docs.google.com/spreadsheets/d/1-4_vmBPcswsiePsrr9nMPOR2eTapY4f867uPkUuB4YU/gviz/tq?tqx=out:csv`)
      .then(res => res.text()).then(csv => {
        const rows = csv.split("\n").slice(1);
        const data = {};
        rows.forEach(row => {
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, "").trim());
          const [b, cat, name, num, priceRaw] = cols;
          if (b && cat && name) {
            if (!data[b]) data[b] = {};
            if (!data[b][cat]) data[b][cat] = [];
            data[b][cat].push({ name, partNum: num || "N/A", price: parseFloat(priceRaw.replace(/[^\d.]/g, "")) || 0 });
          }
        });
        setPoolData(data);
      });
  }, []);

  useEffect(() => localStorage.setItem("PoolPro_V140_Stable", JSON.stringify(history)), [history]);
  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
  }, [darkMode]);

  const compressImage = (file, setter) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH; canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setter(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  };

  const saveVisit = () => {
    if(!customer) return alert("Enter Customer Name");
    const entry = {
      id: Date.now(), name: customer, jobType, arrival, departure, date: new Date().toLocaleDateString(),
      notes, parts: [...partsList], total: partsList.reduce((s, p) => s + p.price, 0).toFixed(2),
      photos: { b: photoB, a: photoA, s: photoS }
    };
    setHistory([...history, entry]);
    setCustomer(""); setNotes(""); setPartsList([]); setPhotoB(null); setPhotoA(null); setPhotoS(null); setShowEntry(false);
  };

  return (
    <div className="app-container">
      <div className="dash-header">
        <h1>Pool Service Pro</h1>
        <div className="welcome">{tab === "HOME" ? "Jobs Dashboard" : "Settings"}</div>
      </div>

      {tab === "HOME" && !selectedJob && (
        <>
          <button className="add-job-btn" onClick={() => setShowEntry(true)}><i className="fa-solid fa-plus"></i> NEW JOB ENTRY</button>
          {history.filter(h => h.date === new Date().toLocaleDateString()).map(h => (
            <div key={h.id} className={`history-item ${h.jobType === 'SERVICE' ? 'service-tag' : 'install-tag'}`} onClick={() => setSelectedJob(h)}>
              <div><strong>{h.name.toUpperCase()}</strong><div style={{fontSize:11}}>{h.arrival} - {h.departure}</div></div>
              <i className="fa-solid fa-chevron-right"></i>
            </div>
          ))}
        </>
      )}

      {tab === "SETTINGS" && (
        <div className="section"><div className="card"><div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><span>Dark Mode</span><button onClick={() => setDarkMode(!darkMode)}>{darkMode ? 'ON' : 'OFF'}</button></div></div></div>
      )}

      {showEntry && (
        <div className="modal-overlay">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}><h2>New Entry</h2><button onClick={() => setShowEntry(false)}>Cancel</button></div>
          <div className="card">
            <label>Job Info</label>
            <div className="category-toggle">
              <div className={`type-btn ${jobType === 'SERVICE' ? 'active service' : ''}`} onClick={() => setJobType('SERVICE')}>Service</div>
              <div className={`type-btn ${jobType === 'INSTALL' ? 'active install' : ''}`} onClick={() => setJobType('INSTALL')}>Install</div>
            </div>
            <input className="input-field" placeholder="Client Name..." value={customer} onChange={(e)=>setCustomer(e.target.value)} />
          </div>

          <div className="card">
            <label>Photos</label>
            <div className="photo-row">
              <div onClick={() => document.getElementById('fb').click()} className={`photo-tile ${photoB?'has-img':''}`}>
                <i className="fa-solid fa-camera"></i><span>Before</span>{photoB && <img src={photoB} className="img-thumb"/>}
              </div>
              <div onClick={() => document.getElementById('fa').click()} className={`photo-tile ${photoA?'has-img':''}`}>
                <i className="fa-solid fa-camera"></i><span>After</span>{photoA && <img src={photoA} className="img-thumb"/>}
              </div>
              <div onClick={() => document.getElementById('fs').click()} className={`photo-tile ${photoS?'has-img':''}`}>
                <i className="fa-solid fa-barcode"></i><span>Serial</span>{photoS && <img src={photoS} className="img-thumb"/>}
              </div>
            </div>
            <input type="file" id="fb" hidden capture="environment" onChange={(e)=>compressImage(e.target.files[0], setPhotoB)} />
            <input type="file" id="fa" hidden capture="environment" onChange={(e)=>compressImage(e.target.files[0], setPhotoA)} />
            <input type="file" id="fs" hidden capture="environment" onChange={(e)=>compressImage(e.target.files[0], setPhotoS)} />
          </div>

          <div className="card">
            <label>Inventory</label>
            <div style={{display:'flex', overflowX:'auto', gap:10, paddingBottom:10}}>
              {["Hayward", "Pentair", "RayPak", "Jandy", "Misc"].map(b => (
                <button key={b} onClick={() => {setBrand(b); setCategory("");}} style={{background: brand === b ? 'var(--cobalt)' : 'white', color: brand === b ? 'white' : 'black', border:'1px solid #ddd', borderRadius:20, padding:'8px 15px', flexShrink:0}}>{b}</button>
              ))}
            </div>
            {brand && poolData && poolData[brand] && (
              <select className="input-field" value={category} onChange={(e)=>setCategory(e.target.value)}>
                <option value="">-- Category --</option>
                {Object.keys(poolData[brand]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {category && (
              <select className="input-field" onChange={e => {
                const p = poolData[brand][category].find(x => x.name === e.target.value);
                if(p) setPartsList([...partsList, p]);
                e.target.value = "";
              }}>
                <option value="">-- Add Part --</option>
                {poolData[brand][category].map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            )}
            {partsList.map((p, i) => <div key={i} style={{fontSize:12, marginTop:5}}>• {p.name} (${p.price.toFixed(2)})</div>)}
          </div>

          <button className="add-job-btn" style={{width:'100%', margin:0, background:'var(--cobalt)'}} onClick={saveVisit}>SAVE JOB</button>
        </div>
      )}

      {selectedJob && (
        <div className="modal-overlay">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}><h2 style={{margin:0}}>{selectedJob.name.toUpperCase()}</h2><button onClick={() => setSelectedJob(null)}>Back</button></div>
          <div className="card" style={{borderLeft:`10px solid ${selectedJob.jobType === 'SERVICE' ? 'var(--sky)' : 'var(--orange)'}`}}>
            <div style={{fontSize:14, fontWeight:800}}>{selectedJob.arrival} - {selectedJob.departure}</div>
          </div>
          <div className="card">
            <label>Photos (Tap to Zoom)</label>
            <div className="photo-row">
              {['b','a','s'].map(k => selectedJob.photos?.[k] && <img key={k} src={selectedJob.photos[k]} className="img-thumb" onClick={() => setZoomedImg(selectedJob.photos[k])} />)}
            </div>
          </div>
          <div className="card">
            <label>Notes & Parts</label>
            <p>{selectedJob.notes}</p>
            {selectedJob.parts?.map((p, i) => <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:13}}><span>{p.name}</span><strong>${p.price.toFixed(2)}</strong></div>)}
            <div style={{textAlign:'right', fontWeight:900, marginTop:10, borderTop:'1px solid #eee'}}>Total: ${selectedJob.total}</div>
          </div>
        </div>
      )}

      {zoomedImg && (
        <div className="zoom-overlay" onClick={() => setZoomedImg(null)}>
          <img src={zoomedImg} className="zoom-img" />
        </div>
      )}

      <div className="bottom-toolbar">
        <div className={`nav-item ${tab === 'HOME' ? 'active' : ''}`} onClick={() => setTab('HOME')}><i className="fa-solid fa-house"></i><span>Home</span></div>
        <div className={`nav-item ${tab === 'SETTINGS' ? 'active' : ''}`} onClick={() => setTab('SETTINGS')}><i className="fa-solid fa-sliders"></i><span>Settings</span></div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ServiceApp />);
