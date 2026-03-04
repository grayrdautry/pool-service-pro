const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1-4_vmBPcswsiePsrr9nMPOR2eTapY4f867uPkUuB4YU/export?format=csv";

function App() {
  const [partsData, setPartsData] = React.useState({});
  const [brand, setBrand] = React.useState(null);
  const [category, setCategory] = React.useState(null);
  const [jobParts, setJobParts] = React.useState([]);

  React.useEffect(() => {
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

    const rows = text.split("\n").map(r =>
      r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c =>
        c.replace(/^"|"$/g, "").trim()
      )
    );

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const iBrand = headers.indexOf("Brand");
    const iCategory = headers.indexOf("Category");
    const iPartName = headers.indexOf("Part Name");
    const iPartNumber = headers.indexOf("Part #");
    const iPrice = headers.indexOf("Price");

    const structured = {};

    dataRows.forEach(row => {
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
        price
      });
    });

    localStorage.setItem("partsData", JSON.stringify(structured));
    setPartsData(structured);
  }

  function addPart(part) {
    setJobParts(prev => [...prev, { ...part, quantity: 1 }]);
  }

  function updateQty(index, delta) {
    setJobParts(prev => {
      const copy = [...prev];
      copy[index].quantity += delta;
      if (copy[index].quantity <= 0) copy.splice(index, 1);
      return copy;
    });
  }

  const brands = Object.keys(partsData);
  const categories = brand ? Object.keys(partsData[brand] || {}) : [];
  const parts = brand && category ? partsData[brand][category] : [];

  const total = jobParts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  return (
    <div className="app">
      <header className="header">
        <h1>Pool Service Pro</h1>
        <div className="total">${total.toFixed(2)}</div>
      </header>

      <div className="layout">
        <div className="left">
          {!brand && (
            <>
              <h2>Select Brand</h2>
              {brands.map(b => (
                <button key={b} onClick={() => setBrand(b)}>
                  {b}
                </button>
              ))}
            </>
          )}

          {brand && !category && (
            <>
              <h2>{brand}</h2>
              <button onClick={() => setBrand(null)}>← Back</button>
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </>
          )}

          {brand && category && (
            <>
              <h2>{brand} → {category}</h2>
              <button onClick={() => setCategory(null)}>← Back</button>
              {parts.map((p, i) => (
                <div key={i} className="partCard">
                  <div>
                    <strong>{p.partName}</strong>
                    <div>Part #: {p.partNumber}</div>
                    <div>${p.price.toFixed(2)}</div>
                  </div>
                  <button onClick={() => addPart(p)}>Add</button>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="right">
          <h2>Current Job</h2>

          {jobParts.map((p, i) => (
            <div key={i} className="jobRow">
              <div>
                <strong>{p.partName}</strong>
                <div>{p.quantity} × ${p.price.toFixed(2)}</div>
              </div>

              <div>
                <button onClick={() => updateQty(i, -1)}>-</button>
                <button onClick={() => updateQty(i, 1)}>+</button>
              </div>
            </div>
          ))}

          <div className="jobTotal">
            Total: ${total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
