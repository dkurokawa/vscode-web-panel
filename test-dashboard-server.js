const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Set CORS headers to allow embedding in VSCode webview
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  
  if (parsedUrl.pathname === '/dashboard') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Dashboard</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .dashboard {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .metric {
            background: rgba(255,255,255,0.2);
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
        }
        .value {
            font-size: 1.5em;
            font-weight: bold;
        }
        .chart {
            height: 200px;
            background: rgba(255,255,255,0.1);
            margin: 20px 0;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>🚀 Test Dashboard</h1>
        <p>Current Time: <span id="time"></span></p>
        
        <div class="metric">
            <span>CPU Usage</span>
            <span class="value" id="cpu">0%</span>
        </div>
        
        <div class="metric">
            <span>Memory Usage</span>
            <span class="value" id="memory">0MB</span>
        </div>
        
        <div class="metric">
            <span>Active Users</span>
            <span class="value" id="users">0</span>
        </div>
        
        <div class="chart">
            📊 Real-time Chart (Updating...)
        </div>
        
        <div class="metric">
            <span>Status</span>
            <span class="value">✅ Running normally</span>
        </div>
    </div>

    <script>
        function updateDashboard() {
            // Current time
            document.getElementById('time').textContent = new Date().toLocaleTimeString();
            
            // Random metrics
            document.getElementById('cpu').textContent = Math.floor(Math.random() * 100) + '%';
            document.getElementById('memory').textContent = Math.floor(Math.random() * 1000 + 500) + 'MB';
            document.getElementById('users').textContent = Math.floor(Math.random() * 100 + 10);
        }
        
        // Initial update
        updateDashboard();
        
        // Update every second
        setInterval(updateDashboard, 1000);
    </script>
</body>
</html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = 3019;
server.listen(PORT, () => {
  console.log(`Test dashboard server running at http://localhost:${PORT}/dashboard`);
});
