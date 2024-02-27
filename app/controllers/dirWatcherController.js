const dirWatcherService = require('../services/dirWatcherService');

exports.updateConfiguration = async (req, res) => {
    try {
        const { directoryPath, magicString, schedule } = req.body;
        await dirWatcherService.updateConfig(directoryPath, magicString, schedule);
        res.json({ message: 'Configuration updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating configuration.', error: error.toString() });
    }
};

exports.startMonitoring = async (req, res) => {
    try {
        await dirWatcherService.startMonitoring();
        res.json({ message: 'Monitoring task started.' });
    } catch (error) {
        res.status(500).json({ message: 'Error starting monitoring task.', error: error.toString() });
    }
};

exports.stopMonitoring = async (req, res) => {
    try {
        await dirWatcherService.stopMonitoring();
        res.json({ message: 'Monitoring task stopped.' });
    } catch (error) {
        res.status(500).json({ message: 'Error stopping monitoring task.', error: error.toString() });
    }
};

exports.getTaskDetails = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const details = await dirWatcherService.fetchTaskDetails(limit, skip);
        res.json({ message: 'Task details fetched successfully.', data: details });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching task details.', error: error.toString() });
    }
};
