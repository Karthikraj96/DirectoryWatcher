module.exports = {
    // Path to the directory to be monitored
    directoryPath: 'E:/dirwatcher/directoryForMonitoring',
  
    // The magic string to count occurrences in files
    magicString: 'magicStringToSearch',
  
    // Interval for the background task in milliseconds (e.g., 60000 for 1 minute)
    schedule: 60000,
  
    // Database configuration (assuming MongoDB for this example)
    db: {
      uri: 'mongodb://localhost:27017/dirWatcherDB',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
  };
  