const CSV_URL = "https://docs.google.com/spreadsheets/d/1-4_vmBPcswsiePsrr9nMPOR2eTapY4f867uPkUuB4YU/export?format=csv";

function App() {
  const [view, setView] = React.useState("dashboard");
  const [customers, setCustomers] = React.useState(
    JSON.parse(localStorage.getItem("customers") || "[]")
  );
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [partsData, setPartsData] = React.useState({});
  const [brand, setBrand] = React.useState(null);
  const [category, setCategory] = React.useState(null);
  const [jobParts, setJobParts] = React.useState([]);
  const [search, setSearch] = React.useState("");

  React.useEffect(function () {
    loadParts();
  }, []);

  React.useEffect(function () {
    localStorage.setItem("customers", JSON.stringify(customers));
  }, [customers]);

  async function loadParts() {
    const response = await fetch(CSV_URL);
    const text = await response.text();

    const rows = text.split("\n").map(r =>
      r.split(",").map(c => c.replace(/^"|"$/g, "").trim())
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
        price: price
      });
    });

    setPartsData(structured);
  }

  function addCustomer(customer) {
    const newCustomer = {
      id: Date.now(),
      ...customer,
      jobs: []
    };
    setCustomers([...customers, newCustomer]);
    setSelectedCustomer(newCustomer);
    setView("customer");
  }

  function deleteCustomer(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer and all their jobs?"
    );
    if (!confirmDelete) return;

    setCustomers(customers.filter(c => c.id !== id));
    setSelectedCustomer(null);
    setView("dashboard");
  }

  function addPart(part) {
    setJobParts([...jobParts, { ...part, quantity: 1 }]);
  }

  function updateQty(index, delta) {
    const copy = [...jobParts];
    copy[index].quantity += delta;
    if (copy[index].quantity <= 0) copy.splice(index, 1);
    setJobParts(copy);
  }

  function saveJob() {
    if (!selectedCustomer || jobParts.length === 0) return;

    const total = jobParts.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );

    const newJob = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      parts: jobParts,
      total: total
    };

    const updated = customers.map(c =>
      c.id === selectedCustomer.id
        ? { ...c, jobs: [...c.jobs, newJob] }
        : c
    );

    setCustomers(updated);
    setJobParts([]);
    setBrand(null);
    setCategory(null);
    setView("customer");
  }

  const brands = Object.keys(partsData);
  const categories = brand ? Object.keys(partsData[brand] || {}) : [];
  const parts = brand && category ? partsData[brand][category] : [];

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">

      {view === "dashboard" && (
        <div>
          <input
            placeholder="Search Customer"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <button className="primary" onClick={() => setView("selectCustomer")}>
            Start Job
          </button>

          <button onClick={() => setView("addCustomer")}>
            Add Customer
          </button>

          <div className="card">
            <h3>Recent Customers</h3>
            {filteredCustomers.slice(-5).reverse().map(c => (
              <div
                key={c.id}
                className="listItem"
                onClick={() => {
                  setSelectedCustomer(c);
                  setView("customer");
                }}
              >
                {c.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "addCustomer" && (
        <CustomerForm
          onSave={addCustomer}
          onBack={() => setView("dashboard")}
        />
      )}

      {view === "selectCustomer" && (
        <div>
          <input
            placeholder="Search Customer"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {filteredCustomers.map(c => (
            <div
              key={c.id}
              className="listItem"
              onClick={() => {
                setSelectedCustomer(c);
                setView("newJob");
              }}
            >
              {c.name}
            </div>
          ))}

          <button onClick={() => setView("addCustomer")}>
            + Add New Customer
          </button>
        </div>
      )}

      {view === "customer" && selectedCustomer && (
        <div className="card">
          <h2>{selectedCustomer.name}</h2>
          <div>{selectedCustomer.address}</div>
          <div>{selectedCustomer.phone}</div>

          <button
            className="primary"
            onClick={() => setView("newJob")}
          >
            Add Job
          </button>

          <button
            className="danger"
            onClick={() => deleteCustomer(selectedCustomer.id)}
          >
            Delete Customer
          </button>

          <h3>Job History</h3>

          {selectedCustomer.jobs.map(job => (
            <details key={job.id} className="jobHistory">
              <summary>
                {job.date} — ${job.total.toFixed(2)}
              </summary>
              {job.parts.map((p, i) => (
                <div key={i}>
                  {p.quantity} × {p.partName}
                </div>
              ))}
            </details>
          ))}
        </div>
      )}

      {view === "newJob" && (
        <div>
          <div className="card">
            <h3>{selectedCustomer.name}</h3>
          </div>

          {!brand && (
            <div className="card">
              <h3>Select Brand</h3>
              {brands.map(b => (
                <button key={b} onClick={() => setBrand(b)}>
                  {b}
                </button>
              ))}
            </div>
          )}

          {brand && !category && (
            <div className="card">
              <button onClick={() => setBrand(null)}>← Back</button>
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {brand && category && (
            <div className="card">
              <button onClick={() => setCategory(null)}>← Back</button>

              {parts.map((p, i) => (
                <div key={i} className="partRow">
                  <div>
                    <strong>{p.partName}</strong>
                    <div>${p.price.toFixed(2)}</div>
                  </div>
                  <button onClick={() => addPart(p)}>Add</button>
                </div>
              ))}
            </div>
          )}

          {jobParts.length > 0 && (
            <div className="card">
              {jobParts.map((p, i) => (
                <div key={i} className="partRow">
                  <div>
                    {p.quantity} × {p.partName}
                  </div>
                  <div>
                    <button onClick={() => updateQty(i, -1)}>-</button>
                    <button onClick={() => updateQty(i, 1)}>+</button>
                  </div>
                </div>
              ))}

              <button className="primary" onClick={saveJob}>
                Save Job
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function CustomerForm({ onSave, onBack }) {
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");

  return (
    <div className="card">
      <h2>New Customer</h2>

      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
      <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
      <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />

      <button className="primary" onClick={() => onSave({ name, address, phone, notes })}>
        Save Customer
      </button>

      <button onClick={onBack}>Cancel</button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
