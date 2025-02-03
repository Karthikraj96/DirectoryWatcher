const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dirWatcherRouter = require('./app/routes/dirWatcherRoutes');
const dirWatcherController = require('./app/controllers/dirWatcherController');
const logger = require('./app/utils/logger');
const config = require('./app/config');
const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(config.db.uri,config.db.options)
  .then(() => console.log('MongoDB connected'))
  .catch(err => logger.error(err));

app.use(bodyParser.json());
app.use('/api', dirWatcherRouter);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    dirWatcherController.startMonitoring1()
});
