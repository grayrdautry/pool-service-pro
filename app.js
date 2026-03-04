const CSV_URL = "https://docs.google.com/spreadsheets/d/1-4_vmBPcswsiePsrr9nMPOR2eTapY4f867uPkUuB4YU/export?format=csv";

function App() {
  const [view, setView] = React.useState("dashboard");
  const [partsData, setPartsData] = React.useState({});
  const [brand, setBrand] = React.useState(null);
  const [category, setCategory] = React.useState(null);
  const [jobParts, setJobParts] = React.useState([]);
  const [jobs, setJobs] = React.useState(
    JSON.parse(localStorage.getItem("jobs") || "[]")
  );

  React.useEffect(function () {
    loadParts();
  }, []);

  async function loadParts() {
    const cached = localStorage.getItem("partsData");
    if (cached) {
      setPartsData(JSON.parse(cached));
      return;
    }

    const response = await fetch(CSV_URL);
    const text = await response.text();

    const rows = text.split("\n").map(function (r) {
      return r.split(",").map(function (c) {
        return c.replace(/^"|"$/g, "").trim();
      });
    });

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const iBrand = headers.indexOf("Brand");
    const iCategory = headers.indexOf("Category");
    const iPartName = headers.indexOf("Part Name");
    const iPartNumber = headers.indexOf("Part #");
    const iPrice = headers.indexOf("Price");

    const structured = {};

    dataRows.forEach(function (row) {
      const b = row[iBrand];
      const c = row[iCategory];
      const name = row[iPartName];
      const number = row[iPartNumber];
      const price = parseFloat(row[iPrice] || 0);

      if (!b || !c || !name) return;

      if (!structured[b]) structured[b] = {};
      if (!structured[b][c]) structured[b][c] = [];

      structured[b][c].push({
        partName: name,
        partNumber: number,
        price: price
      });
    });

    localStorage.setItem("partsData", JSON.stringify(structured));
    setPartsData(structured);
  }

  function addPart(part) {
    setJobParts(function (prev) {
      return prev.concat([{ ...part, quantity: 1 }]);
    });
  }

  function updateQty(index, delta) {
    setJobParts(function (prev) {
      const copy = prev.slice();
      copy[index].quantity += delta;
      if (copy[index].quantity <= 0) copy.splice(index, 1);
      return copy;
    });
  }

  function saveJob() {
    if (jobParts.length === 0) return;

    const total = jobParts.reduce(function (sum, p) {
      return sum + p.price * p.quantity;
    }, 0);

    const newJob = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      parts: jobParts,
      total: total
    };

    const updatedJobs = jobs.concat([newJob]);
    setJobs(updatedJobs);
    localStorage.setItem("jobs", JSON.stringify(updatedJobs));

    setJobParts([]);
    setBrand(null);
    setCategory(null);
    setView("dashboard");
  }

  const brands = Object.keys(partsData);
  const categories = brand ? Object.keys(partsData[brand] || {}) : [];
  const parts = brand && category ? partsData[brand][category] : [];

  const currentTotal = jobParts.reduce(function (sum, p) {
    return sum + p.price * p.quantity;
  }, 0);

  const totalRevenue = jobs.reduce(function (sum, j) {
    return sum + j.total;
  }, 0);

  return (
    <div className="app">
      <header className="header">
        <h1>Pool Service Pro</h1>
        <div className="nav">
          <button onClick={function () { setView("dashboard"); }}>Dashboard</button>
          <button onClick={function () { setView("new"); }}>New Job</button>
          <button onClick={function () { setView("history"); }}>History</button>
        </div>
      </header>

      {view === "dashboard" && (
        <div className="dashboard">
          <div className="statGrid">
            <div className="statCard">
              <div className="statLabel">Total Revenue</div>
              <div className="statValue">${totalRevenue.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Total Jobs</div>
              <div className="statValue">{jobs.length}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Avg Job</div>
              <div className="statValue">
                ${jobs.length ? (totalRevenue / jobs.length).toFixed(2) : "0.00"}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "30px" }}>
            <h2>Quick Actions</h2>
            <button onClick={function () { setView("new"); }}>
              Start New Job
            </button>
          </div>
        </div>
      )}

      {view === "new" && (
        <div className="layout">
          <div className="left card">
            {!brand && (
              <div>
                <h2>Select Brand</h2>
                {brands.map(function (b) {
                  return (
                    <button key={b} onClick={function () { setBrand(b); }}>
                      {b}
                    </button>
                  );
                })}
              </div>
            )}

            {brand && !category && (
              <div>
                <h2>{brand}</h2>
                <button onClick={function () { setBrand(null); }}>← Back</button>
                {categories.map(function (c) {
                  return (
                    <button key={c} onClick={function () { setCategory(c); }}>
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {brand && category && (
              <div>
                <h2>{brand} → {category}</h2>
                <button onClick={function () { setCategory(null); }}>← Back</button>

                {parts.map(function (p, i) {
                  return (
                    <div key={i} className="partCard">
                      <div>
                        <strong>{p.partName}</strong>
                        <div>Part #: {p.partNumber}</div>
                        <div>${p.price.toFixed(2)}</div>
                      </div>
                      <button onClick={function () { addPart(p); }}>
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="right card">
            <h2>Current Job</h2>

            {jobParts.map(function (p, i) {
              return (
                <div key={i} className="jobRow">
                  <div>
                    <strong>{p.partName}</strong>
                    <div>{p.quantity} × ${p.price.toFixed(2)}</div>
                  </div>

                  <div>
                    <button onClick={function () { updateQty(i, -1); }}>-</button>
                    <button onClick={function () { updateQty(i, 1); }}>+</button>
                  </div>
                </div>
              );
            })}

            <div className="jobTotal">
              Total: ${currentTotal.toFixed(2)}
            </div>

            <button onClick={saveJob}>
              Save Job
            </button>
          </div>
        </div>
      )}

      {view === "history" && (
        <div className="card">
          <h2>Job History</h2>
          {jobs.map(function (j) {
            return (
              <div key={j.id} className="historyItem">
                <div>
                  <strong>{j.date}</strong>
                  <div>${j.total.toFixed(2)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
