const { useState, useEffect } = React;

function ServiceApp() {
  const [tab, setTab] = useState("HOME");
  const [showEntry, setShowEntry] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [zoomedImg, setZoomedImg] = useState(null);

  const [customer, setCustomer] = useState("");
  const [jobType, setJobType] = useState("SERVICE");
  const [partsList, setPartsList] = useState([]);
  const [photoB, setPhotoB] = useState(null);
  const [photoA, setPhotoA] = useState(null);
  const [photoS, setPhotoS] = useState(null);

  const [poolData, setPoolData] = useState(null);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("PoolPro_V140_Stable") || "[]"));

  // GPT-5.2 Improvement: Error handling for fetch
  useEffect(() => {
    fetch(`https://docs.google.com/spreadsheets/d/1-4_vmBPcswsiePsrr9nMPOR2eTapY4f867uPkUuB4YU/gviz/tq?tqx=out:csv`)
      .then(res => res.text())
      .then(csv => {
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
      }).catch(err => console.error("Inventory load failed", err));
  }, []);

  useEffect(() => localStorage.setItem("PoolPro_V140_Stable", JSON.stringify(history)), [history]);

  // GPT-5.2 Improvement: Math.min prevents upscaling/blurring
  const compressImage = (file, setter) => {
    if (!file) return; // GPT Safety Check
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width); 
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setter(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  };

  const saveVisit = () => {
    if(!customer) return alert("Enter Customer Name");
    const entry = {
      id: Date.now(), name: customer, jobType, date: new Date().toLocaleDateString(),
      parts: [...partsList], total: partsList.reduce((s, p) => s + p.price, 0).toFixed(2),
      photos: { b: photoB, a: photoA, s: photoS }
    };
    setHistory([...history, entry]);
    setCustomer(""); setPartsList([]); setPhotoB(null); setPhotoA(null); setPhotoS(null); setShowEntry(false);
  };

  return (
    <div className="app-container">
      <div className="dash-header">
        <h1>Pool Service Pro</h1>
        <div className="welcome">Dashboard</div>
      </div>

      {tab === "HOME" && !selectedJob && (
        <>
          <button className="add-job-btn" onClick={() => setShowEntry(true)}><i className="fa-solid fa-plus"></i> NEW JOB ENTRY</button>
          {history.map(h => (
            <div key={h.id} className="history-item" onClick={() => setSelectedJob(h)}>
              <div><strong>{h.name.toUpperCase()}</strong></div>
              <i className="fa-solid fa-chevron-right"></i>
            </div>
          ))}
        </>
      )}

      {showEntry && (
        <div className="modal-overlay">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}><h2>New Entry</h2><button onClick={() => setShowEntry(false)}>Cancel</button></div>
          <div className="card">
            <input className="input-field" placeholder="Client Name..." value={customer} onChange={(e)=>setCustomer(e.target.value)} />
            <div className="photo-row">
              <div onClick={() => document.getElementById('fb').click()} className={`photo-tile ${photoB?'has-img':''}`}>
                <span>Before</span>{photoB && <img src={photoB} className="img-thumb"/>}
              </div>
            </div>
            <input type="file" id="fb" hidden onChange={(e)=>compressImage(e.target.files[0], setPhotoB)} />
          </div>
          <button className="add-job-btn" style={{width:'100%', margin:0, background:'var(--cobalt)'}} onClick={saveVisit}>SAVE JOB</button>
        </div>
      )}

      {selectedJob && (
        <div className="modal-overlay">
          <button onClick={() => setSelectedJob(null)}>Back</button>
          <h2>{selectedJob.name}</h2>
          {/* Detailed breakdown logic here */}
        </div>
      )}

      <div className="bottom-toolbar">
        <div className="nav-item active" onClick={() => setTab("HOME")}><i className="fa-solid fa-house"></i><span>Home</span></div>
      </div>
    </div>
  );
}

// React 18 Root Logic
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ServiceApp />);
