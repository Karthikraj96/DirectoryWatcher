
---

# Directory Watcher and Task Scheduler

This project is a Node.js application designed to monitor changes in a specified directory, detect added or deleted files, and perform scheduled tasks based on these changes. It includes MongoDB integration for efficiently checking and preventing duplicate task records.

## Features

- Monitors a specified directory for file additions and deletions.
- Schedules and executes tasks based on directory changes.
- Checks for duplicates using MongoDB to prevent processing the same directory changes multiple times.
- Configurable through a simple JSON configuration file.

## Prerequisites

Before running this project, ensure you have the following installed:
- Node.js (v15.0 or later)
- MongoDB (v4.4 or later)

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-repository/directory-watcher.git
cd directory-watcher
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure the application**

Edit the `config.json` file in the root directory to set your directory path, MongoDB connection string, and other configurations.

Example `config.json`:
```json
{
  "directoryPath": "path/to/watched/directory",
  "mongodbUri": "mongodb://localhost:27017/directoryWatcher",
  "schedule": 60000, // Task schedule in milliseconds
  "magicString": "yourMagicString"
}
```

4. **Start MongoDB**

Ensure MongoDB is running on your system. Refer to MongoDB's official documentation for instructions on starting MongoDB on your platform.

5. **Run the application**

```bash
node app.js
```

For the API endpoints description suitable for a `README.md` file in a table format, see below. This format is clear and easy to read, providing essential details at a glance.

| Endpoint                 | Method | Body (if applicable)                                                                 | Query Parameters (if applicable)                                | Sample Response                                                                                              | Description                                                                                                               |
|--------------------------|--------|--------------------------------------------------------------------------------------|----------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| `/api/startMonitoring`   | POST   | None                                                                                 | None                                                           | `{ "message": "Monitoring started successfully." }`                                                          | Starts the monitoring process of the specified directory for file additions, deletions, and updates.                     |
| `/api/stopMonitoring`    | POST   | None                                                                                 | None                                                           | `{ "message": "Monitoring stopped successfully." }`                                                          | Stops the ongoing monitoring process.                                                                                     |
| `/api/updateConfig`      | POST   | `{ "directoryPath": "path/to/directory", "magicString": "exampleString", "schedule": 60000 }` | None                                                           | `{ "message": "Configuration updated successfully." }`                                                      | Updates the configuration for the directory monitoring, including the path to monitor, the magic string to look for, and the schedule interval in milliseconds. |
| `/api/taskDetails`       | GET    | None                                                                                 | `limit`: The maximum number of task details to return (optional, default is 10). `skip`: The number of task details to skip (optional, default is 0). | `{ "message": "Task details fetched successfully", "data": [{ "startTime": "2024-02-27T12:00:00.000Z", "endTime": "2024-02-27T12:05:00.000Z", "filesAdded": ["file1.txt", "file2.txt"], "filesDeleted": ["file3.txt"], "magicStringOccurrences": 5 }] }` | Retrieves a paginated list of task details, sorted by start time in descending order. Supports `limit` and `skip` query parameters to control pagination. |

This table format provides a concise summary of your directory watcher application's API endpoints, making it easier for developers to understand and use your API.

## Usage

Once started, the application will begin monitoring the specified directory for any file additions or deletions. It will schedule and execute tasks based on these changes, while avoiding duplicate processing through MongoDB checks.

## Contributing

Contributions to this project are welcome. Please follow these steps for contributing:

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Commit your changes with clear, descriptive messages.
4. Push your branch and submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

This `README.md` file is a basic template to get you started. Depending on the specifics of your project, such as additional configuration options, more complex setup instructions, or other dependencies, you might need to add or modify sections accordingly.
