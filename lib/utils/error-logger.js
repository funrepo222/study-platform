(function() {
    if (typeof window !== 'undefined') { // Ensure it's running on the client-side (in the browser)
      const MAX_LOGS = 20;
      const ERROR_LOG_KEY = 'errorLogs';
  
      // Capture all console errors and push to error logs
      const originalConsoleError = console.error;
      console.error = function(message, ...args) {
        // Call the original console.error method
        originalConsoleError(message, ...args);
  
        // Get the current error logs from localStorage (or initialize if empty)
        let errorLogs = JSON.parse(localStorage.getItem(ERROR_LOG_KEY)) || [];
  
        // Add new error log
        const errorLog = {
          timestamp: new Date().toISOString(),
          message: message,
          args: args,
        };
  
        // Push new error log
        errorLogs.unshift(errorLog);
  
        // Trim the logs to keep only the last 20
        if (errorLogs.length > MAX_LOGS) {
          errorLogs = errorLogs.slice(0, MAX_LOGS);
        }
  
        // Save the error logs back to localStorage
        localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(errorLogs));
      };
  
      // Function to get the last N error logs
      function getErrorLogs() {
        return JSON.parse(localStorage.getItem(ERROR_LOG_KEY)) || [];
      }
  
      // Expose the function globally to the window object (so it's accessible in the console)
      window.getErrorLogs = getErrorLogs;
    }
  })();
  