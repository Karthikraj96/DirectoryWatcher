module.exports = {
    // Path to the directory to be monitored
    directoryPath: 'D:/FTPFiles',
    destinationPath:'D:/ftpReaded',
    // The magic string to count occurrences in files
    magicString: 'magicStringToSearch',
  
    // Interval for the background task in milliseconds (e.g., 60000 for 1 minute)
    schedule: 60000,
  
    // Database configuration (assuming MongoDB for this example)
    db: {
      uri: 'mongodb://localhost:27017/weverwin_hr',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
  };
  