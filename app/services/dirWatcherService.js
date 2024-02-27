const fs = require('fs').promises;
const chokidar = require('chokidar');
const path = require('path');
const TaskResult = require('../models/taskResult'); // Assuming you have this Mongoose model
const config = require('../config');

let watcher = null;
let monitoring = false;
let filesSnapshot = {};

// Initialize MongoDB connection (Assuming Mongoose is used and initialized elsewhere in your app)

// Function to start monitoring
const startMonitoring = async () => {
    if (monitoring) {
        console.log('Monitoring is already running.');
        return;
    }

    monitoring = true;
    filesSnapshot = await getCurrentFilesSnapshot(config.directoryPath);
    watcher = chokidar.watch(config.directoryPath, { ignored: /^\./, persistent: true });

    watcher
        .on('add', async (filePath) => {
            console.log(`File ${filePath} has been added.`);
            if (!filesSnapshot[filePath]) {
                filesSnapshot[filePath] = { added: new Date() };
                // Optionally process file here for initial magic string count
                const magicStringCount = await countMagicStringOccurrences(filePath, config.magicString);
                filesSnapshot[filePath].magicStringCount = magicStringCount;
            }
        })
        .on('unlink', (filePath) => {
            console.log(`File ${filePath} has been removed.`);
            if (filesSnapshot[filePath]) {
                filesSnapshot[filePath].deleted = new Date();
                // Optionally process file here
            }
        })
        .on('error', (error) => console.log(`Watcher error: ${error}`))
        .on('ready', () => console.log('Initial scan complete. Ready for changes'));

    scheduleTask();
};

// Function to stop monitoring
const stopMonitoring = () => {
    if (!monitoring) {
        console.log('No monitoring task to stop.');
        return;
    }

    if (watcher) {
        watcher.close();
    }
    monitoring = false;
    console.log('Monitoring stopped.');
};

// Function to update configuration
const updateConfig = async (directoryPath, magicString, schedule) => {
    config.directoryPath = directoryPath;
    config.magicString = magicString;
    config.schedule = schedule;

    if (monitoring) {
        stopMonitoring();
        await startMonitoring();
    }
};
const fetchTaskDetails = async (limit = 10, skip = 0) => {
    try {
        // Use the limit and skip parameters for pagination
        const taskDetails = await TaskResult.find()
            .sort({ startTime: -1 })
            .limit(limit)
            .skip(skip);
        return taskDetails;
    } catch (error) {
        console.error('Error fetching task details:', error);
        return []; // Return an empty array or appropriate error handling
    }
}


// Function to get current files snapshot
async function getCurrentFilesSnapshot(directory) {
    let snapshot = {};
    try {
        const files = await fs.readdir(directory);
        for (let file of files) {
            const filePath = path.join(directory, file);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
                snapshot[filePath] = { added: stats.birthtime, modified: stats.mtime };
            }
        }
    } catch (error) {
        console.error('Error creating files snapshot:', error);
    }
    return snapshot;
}

// Function to count magic string occurrences in a file
async function countMagicStringOccurrences(filePath, magicString) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return (content.match(new RegExp(magicString, 'g')) || []).length;
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return 0; // Assuming we return 0 if an error occurs
    }
}


// Function to check for duplicate task result
async function isDuplicateTaskResult(taskData) {
    // Use aggregation to find a match
    const matches = await TaskResult.aggregate([
        {
            $match: {
                magicString:config.magicString,
                // Match by magicStringOccurrences to narrow down potential duplicates
                magicStringOccurrences: taskData.magicStringOccurrences
            }
        },
        {
            $addFields: {
                // Add a field that checks if filesAdded arrays are equal
                isFilesAddedEqual: { $eq: ["$filesAdded", taskData.filesAdded] },
                // Add a field that checks if filesDeleted arrays are equal
                isFilesDeletedEqual: { $eq: ["$filesDeleted", taskData.filesDeleted] }
            }
        },
        {
            $match: {
                // Only consider documents where both arrays match
                isFilesAddedEqual: true,
                isFilesDeletedEqual: true
            }
        },
        {
            $limit: 1 // Limit to 1 to check if at least one duplicate exists
        }
    ]);

    // If matches array is not empty, a duplicate exists
    return matches.length > 0;
}

  
  function scheduleTask() {
      setInterval(async () => {
          if (!monitoring) return;
          console.log('Processing directory changes...');
          const filesAdded = Object.keys(filesSnapshot).filter(key => filesSnapshot[key].added && !filesSnapshot[key].deleted);
          // Calculate magicStringOccurrences excluding deleted files
          const magicStringOccurrences = filesAdded.reduce((acc, filePath) => {
              // Ensure only added (and not subsequently deleted) files are considered
              return acc + (filesSnapshot[filePath].magicStringCount || 0);
          }, 0);
          // Calculate your taskData here based on filesSnapshot...
          const taskData = {
              startTime: new Date(),
              endTime: new Date(),
              filesAdded: Object.keys(filesSnapshot).filter(key => filesSnapshot[key].added && !filesSnapshot[key].deleted),
              filesDeleted: Object.keys(filesSnapshot).filter(key => filesSnapshot[key].deleted),
              magicString:config.magicString,
              magicStringOccurrences: magicStringOccurrences,
          };
  
          // Check for duplicate
          const isDuplicate = await isDuplicateTaskResult(taskData);
          if (isDuplicate) {
              console.log('Duplicate task result detected. Skipping save.');
              return;
          }
  
          // Save the task result if not a duplicate
          const taskResult = new TaskResult(taskData);
          await taskResult.save();
          console.log('Directory changes processed and saved.');
      }, config.schedule);
  }

module.exports = { startMonitoring, stopMonitoring, updateConfig, fetchTaskDetails };
