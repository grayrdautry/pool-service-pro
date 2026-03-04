const { useState, useEffect } = React;

function ServiceApp() {
  return (
    <div className="app-container">
      <div className="dash-header" style={{background: '#1e3a8a', color: 'white', padding: '40px 20px'}}>
        <h1>Pool Service Pro</h1>
        <p>If you see this, it works!</p>
      </div>
      <div style={{padding: '20px'}}>
        <button style={{padding: '15px', width: '100%', borderRadius: '10px', background: '#10b981', color: 'white', fontWeight: 'bold'}}>
          SYSTEMS ACTIVE
        </button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ServiceApp />);
