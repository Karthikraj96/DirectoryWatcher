const express = require('express');
const dirWatcherController = require('../controllers/dirWatcherController');
const router = express.Router();

router.post('/updateConfig', dirWatcherController.updateConfiguration);
router.post('/startMonitoring', dirWatcherController.startMonitoring);
router.post('/stopMonitoring', dirWatcherController.stopMonitoring);
router.get('/taskDetails', dirWatcherController.getTaskDetails);

module.exports = router;
