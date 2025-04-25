const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware to parse incoming JSON data
app.use(express.json());

app.post('/api/logs', (req, res) => {
  const logData = req.body; // Capture the incoming error log data
  console.log('Received error log:', logData);

  // Store the logs (e.g., append to a file)
  const logFilePath = path.join(__dirname, 'logs', 'errorLogs.json');
  
  let existingLogs = [];
  if (fs.existsSync(logFilePath)) {
    existingLogs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
  }
  
  // Push the new error log to the existing logs
  existingLogs.unshift(logData);

  // Keep only the last 20 logs
  if (existingLogs.length > 20) {
    existingLogs = existingLogs.slice(0, 20);
  }

  // Save the logs to the file
  fs.writeFileSync(logFilePath, JSON.stringify(existingLogs, null, 2));

  res.status(200).send('Log received and saved');
});

// Set up server to listen
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
