const fs = require('fs').promises;
const chokidar = require('chokidar');
// const path = require('path');
const TaskResult = require('../models/taskResult'); // Assuming you have this Mongoose model
const config = require('../config');
const csvParse = require('csv-parse');

let watcher = null;
let monitoring = false;
// let filesSnapshot = {};
function convertToISODatetime(dateString, timeString) {
  const day = dateString.substring(0, 2);
  const month = dateString.substring(2, 4);
  const year = dateString.substring(4);
  // Assuming timeString is in the correct format, it can be directly appended
  // If the time is not in HH:MM format, ensure to format it correctly here
  return `${year}-${month}-${day}T${timeString}`;
}
function convertDateToISO(dateString) {
  const day = dateString.substring(0, 2);
  const month = dateString.substring(2, 4);
  const year = dateString.substring(4);
  return `${year}-${month}-${day}`;
}
// Processes a CSV file, converting its rows into JSON objects
async function processCsvFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');

  // Promisify the parse function
  return new Promise((resolve, reject) => {
    csvParse(content, {
      columns: false,
      skip_empty_lines: true
    }, (err, records) => {
      if (err) {
        console.error(`Error processing CSV file ${filePath}:`, err);
        reject(err);
      } else {
        const jsonRecords = records.map(([id, date, time, action]) => ({
          id,
          date: convertDateToISO(date),
          dateTime: convertToISODatetime(date, time),
          time,
          action
        }));
        resolve(jsonRecords);
      }
    });
  });
}

// Initialize MongoDB connection (Assuming Mongoose is used and initialized elsewhere in your app)

// Function to start monitoring
// const startMonitoring = async () => {
//     if (monitoring) {
//         console.log('Monitoring is already running.');
//         return;
//     }

//     monitoring = true;
//     filesSnapshot = await getCurrentFilesSnapshot(config.directoryPath);
//     watcher = chokidar.watch(config.directoryPath, { ignored: /^\./, persistent: true });

//     watcher
//         .on('add', async (filePath) => {
//             console.log(`File ${filePath} has been added.`);
//             if (!filesSnapshot[filePath]) {
//                 filesSnapshot[filePath] = { added: new Date() };
//                 // Optionally process file here for initial magic string count
//                 const magicStringCount = await countMagicStringOccurrences(filePath, config.magicString);
//                 filesSnapshot[filePath].magicStringCount = magicStringCount;
//             }
//         })
//         .on('unlink', (filePath) => {
//             console.log(`File ${filePath} has been removed.`);
//             if (filesSnapshot[filePath]) {
//                 filesSnapshot[filePath].deleted = new Date();
//                 // Optionally process file here
//             }
//         })
//         .on('error', (error) => console.log(`Watcher error: ${error}`))
//         .on('ready', () => console.log('Initial scan complete. Ready for changes'));

//     scheduleTask();
// };

// Assuming transformedData is your input data transformed with dateTime
async function insertNonDuplicates(records) {
  // Transform records to query format for $or operator
  const queryConditions = records.map(record => ({
    id: record.id,
    dateTime: record.dateTime,
    action: record.action
  }));

  // Find existing records that match any of the query conditions
  const existingRecords = await TaskResult.find({
    $or: queryConditions
  });

  // Create a map of existing records for quick lookup
  const existingMap = new Map(existingRecords.map(record => {
    const key = `${record.id}-${new Date(record.dateTime).toISOString()}-${record.action}`;
    return [key, true];
  }));

  // Filter out duplicates
  const nonDuplicates = records.filter(record => {
    const key = `${record.id}-${new Date(record.dateTime).toISOString()}-${record.action}`;
    return !existingMap.has(key);
  });

  // Perform bulk insert for non-duplicates
  if (nonDuplicates.length > 0) {
    await TaskResult.insertMany(nonDuplicates);
    console.log(`Inserted ${nonDuplicates.length} new records.`);
  } else {
    console.log("No new records to insert.");
  }
}
async function waitForFileAccess(filePath, maxRetries = 5, delay = 100000, successDelay = 50000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
          await fs.access(filePath);
          // Wait an additional short period after successful access
          await new Promise(resolve => setTimeout(resolve, successDelay));
          return true; // The file is accessible
      } catch (error) {
          if (attempt === maxRetries) {
              console.error(`Unable to access file ${filePath} after ${maxRetries} attempts.`);
              return false;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
      }
  }
}

const startMonitoring = async () => {
  if (monitoring) {
    console.log('Monitoring is already running.');
    return;
  }

  monitoring = true;
  // filesSnapshot = await getCurrentFilesSnapshot(config.directoryPath);
  watcher = chokidar.watch(config.directoryPath, { ignored: /^\./, persistent: true });

  watcher.on('add', async (filePath) => {
    console.log(`File ${filePath} has been added.`);
    // Wait for file to become accessible
    const isAccessible = await waitForFileAccess(filePath);
    if (!isAccessible) {
      console.log(`Skipping inaccessible file: ${filePath}`);
      return; // Skip processing if the file is not accessible
    }

    try {
      // Process the file
      const processedRecords = await processCsvFile(filePath);
      // Insert non-duplicates into MongoDB
      await insertNonDuplicates(processedRecords);
      const path = require('path');
      // const data = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
        // Write the content to the destination file
        let dest = path.join(config.destinationPath, fileName);
        // await fs.writeFile(config.destinationPath, data);
        await fs.copyFile(filePath, dest);
      // fs.copyFile(filePath,config.destinationPath);
      await fs.unlink(filePath);
      console.log(`Processed and deleted file: ${filePath}`);
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  })
    .on('error', (error) => console.log(`Watcher error: ${error}`))
    .on('ready', () => console.log('Initial scan complete. Ready for changes'));

  // scheduleTask();
};

let toAddAttendenace = async () => {

 }

















// Function to stop monitoring
// const stopMonitoring = () => {
//     if (!monitoring) {
//         console.log('No monitoring task to stop.');
//         return;
//     }

//     if (watcher) {
//         watcher.close();
//     }
//     monitoring = false;
//     console.log('Monitoring stopped.');
// };

// // Function to update configuration
// const updateConfig = async (directoryPath, magicString, schedule) => {
//     config.directoryPath = directoryPath;
//     config.magicString = magicString;
//     config.schedule = schedule;

//     if (monitoring) {
//         stopMonitoring();
//         await startMonitoring();
//     }
// };
// const fetchTaskDetails = async (limit = 10, skip = 0) => {
//     try {
//         // Use the limit and skip parameters for pagination
//         const taskDetails = await TaskResult.find()
//             .sort({ startTime: -1 })
//             .limit(limit)
//             .skip(skip);
//         return taskDetails;
//     } catch (error) {
//         console.error('Error fetching task details:', error);
//         return []; // Return an empty array or appropriate error handling
//     }
// }


// // Function to get current files snapshot
// async function getCurrentFilesSnapshot(directory) {
//     let snapshot = {};
//     try {
//         const files = await fs.readdir(directory);
//         for (let file of files) {
//             const filePath = path.join(directory, file);
//             const stats = await fs.stat(filePath);
//             if (stats.isFile()) {
//                 snapshot[filePath] = { added: stats.birthtime, modified: stats.mtime };
//             }
//         }
//     } catch (error) {
//         console.error('Error creating files snapshot:', error);
//     }
//     return snapshot;
// }

// // Function to count magic string occurrences in a file
// async function countMagicStringOccurrences(filePath, magicString) {
//     try {
//         const content = await fs.readFile(filePath, 'utf8');
//         return (content.match(new RegExp(magicString, 'g')) || []).length;
//     } catch (error) {
//         console.error(`Error reading file ${filePath}:`, error);
//         return 0; // Assuming we return 0 if an error occurs
//     }
// }


// // Function to check for duplicate task result
// async function isDuplicateTaskResult(taskData) {
//     // Use aggregation to find a match
//     const matches = await TaskResult.aggregate([
//         {
//             $match: {
//                 magicString:config.magicString,
//                 // Match by magicStringOccurrences to narrow down potential duplicates
//                 magicStringOccurrences: taskData.magicStringOccurrences
//             }
//         },
//         {
//             $addFields: {
//                 // Add a field that checks if filesAdded arrays are equal
//                 isFilesAddedEqual: { $eq: ["$filesAdded", taskData.filesAdded] },
//                 // Add a field that checks if filesDeleted arrays are equal
//                 isFilesDeletedEqual: { $eq: ["$filesDeleted", taskData.filesDeleted] }
//             }
//         },
//         {
//             $match: {
//                 // Only consider documents where both arrays match
//                 isFilesAddedEqual: true,
//                 isFilesDeletedEqual: true
//             }
//         },
//         {
//             $limit: 1 // Limit to 1 to check if at least one duplicate exists
//         }
//     ]);

//     // If matches array is not empty, a duplicate exists
//     return matches.length > 0;
// }


//   function scheduleTask() {
//       setInterval(async () => {
//           if (!monitoring) return;
//           console.log('Processing directory changes...');
//           const filesAdded = Object.keys(filesSnapshot).filter(key => filesSnapshot[key].added && !filesSnapshot[key].deleted);
//           // Calculate magicStringOccurrences excluding deleted files
//           const magicStringOccurrences = filesAdded.reduce((acc, filePath) => {
//               // Ensure only added (and not subsequently deleted) files are considered
//               return acc + (filesSnapshot[filePath].magicStringCount || 0);
//           }, 0);
//           // Calculate your taskData here based on filesSnapshot...
//           const taskData = {
//               startTime: new Date(),
//               endTime: new Date(),
//               filesAdded: Object.keys(filesSnapshot).filter(key => filesSnapshot[key].added && !filesSnapshot[key].deleted),
//               filesDeleted: Object.keys(filesSnapshot).filter(key => filesSnapshot[key].deleted),
//               magicString:config.magicString,
//               magicStringOccurrences: magicStringOccurrences,
//           };

//           // Check for duplicate
//           const isDuplicate = await isDuplicateTaskResult(taskData);
//           if (isDuplicate) {
//               console.log('Duplicate task result detected. Skipping save.');
//               return;
//           }

//           // Save the task result if not a duplicate
//           const taskResult = new TaskResult(taskData);
//           await taskResult.save();
//           console.log('Directory changes processed and saved.');
//       }, config.schedule);
//   }

module.exports = { startMonitoring, };
