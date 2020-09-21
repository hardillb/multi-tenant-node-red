const fs = require('fs');
const cors = require('cors');
const http = require('http');
const path = require('path');
const util = require('util');
const morgan = require('morgan');
const Docker = require('dockerode');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const SimpleNodeLogger = require('simple-node-logger');

const port = (process.env.PORT || 3000);
const host = (process.env.HOST || '0.0.0.0');

const cookieSecret = (process.env.COOKIE_SECRET || 'qscplmvb');

const settings = require('./settings.js');

var docker = new Docker(settings.dockerodeSettings);

const logDirectory = path.join(__dirname, 'log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// var loggingOptions = {
// 	logDirectory: 'log',
// 	fileNamePattern:'debug-<DATE>.log',
// 	timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS',
// 	dateFormat:'YYYY.MM.DD'
// };

//const logger = SimpleNodeLogger.createRollingFileLogger(loggingOptions);
const logger = SimpleNodeLogger.createSimpleLogger();

const logLevel = (process.env.LOG_LEVEL || "info");
logger.setLevel(logLevel);

// const accessLogStream = rfs.createStream('access.log', {
//   interval: '1d', // rotate daily
//   compress: 'gzip', // compress rotated files
//   maxFiles: 30,
//   path: logDirectory
// });

var mongoose_options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

mongoose.connect(settings.mongodb, mongoose_options)
.then(() => {
	logger.info("Connected to the DB");
})
.catch( err => {
	logger.info("failed to connect to db");
	process.exit(-1);
});
const Users = require('./models/users');

const app = express();
	
app.enable('trust proxy');
//app.use(morgan("combined", {stream: accessLogStream}));
app.use(morgan("combined"));
app.use(cookieParser(cookieSecret));
app.use(session({
  secret: cookieSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
 	 // secure: true
  }
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/',express.static('static'));
app.use('/',express.static('/data'));

// app.get('/',function(req,res){
// 	res.render('pages/index',{});
// });

app.post('/newInstance', function(req,res){
	logger.debug(req.body);

	Users.findOne({appname: req.body.appname}, function(err, existingUser) {
		if (existingUser) {
			res.status(409).send({msg: "App Name already exists"});
		} else {
			var u = new Users({
				appname: req.body.appname,
				username: "admin",
				email: req.body.email,
				permissions: "*"
			})

			u.setPassword(req.body.password)
			.then(() => {
				return u.save()
			})
			.then(() => {
				return docker.createContainer({
				  Image: "custom-node-red",
				  name: req.body.appname,
				  Env: [
				    "VIRTUAL_HOST=" + req.body.appname + "." + settings.rootDomain,
				    "APP_NAME="+ req.body.appname,
				    "MONGO_URL=mongodb://mongodb/nodered"
				  ],
				  AttachStdin: false,
				  AttachStdout: false,
				  AttachStderr: false,
				  HostConfig: {
				    NetworkMode: "internal"
				  }
				})
				.then(container => {
			  	console.log("created");
			  	cont = container;
			  	return container.start()
				})
				.then(() => {
					res.status(201).send({started: true, url: "http://" + req.body.appname + "." + settings.rootDomain});
				})
				.catch(err => {
					logger.debug(err);
					res.status(500).send({started: false, msg: "some screw up", err: err});
				})
			})
		}
	})

});

const server = http.Server(app);

server.listen(port, host, function(){
	logger.info(util.format('App listening on  %s:%d!', host, port));
});