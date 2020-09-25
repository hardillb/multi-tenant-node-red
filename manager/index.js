const fs = require('fs');
const ws = require('ws');
const cors = require('cors');
const http = require('http');
const path = require('path');
const util = require('util');
const stream = require('stream');
const morgan = require('morgan');
const Docker = require('dockerode');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const BasicStrategy = require('passport-http').BasicStrategy;
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
	logger.info("Connected to the DB " + settings.mongodb);
})
.catch( err => {
	logger.info("failed to connect to DB " + settings.mongodb);
	process.exit(-1);
});
const Users = require('./models/users');
const Flows = require('./models/flows');
const Settings = require('./models/settings');
const Sessions = require('./models/sessions');
const Library = require('./models/library');

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize())
app.use(passport.session());

passport.use(new BasicStrategy(function(username, password, done){
	if (username != settings.admin) {
		return done(null, false);
	}

	if (password == settings.password) {
		return done(null, {username: settings.admin})
	} else {
		return done(null, false);
	}
}));

passport.serializeUser(function(user, done){
	done(null, user.username);
});
passport.deserializeUser(function(id, done){
	done(null, {username: id})
});

app.use('/',cors(), express.static('/data'));
app.use('/',passport.authenticate(['basic'],{session: true}) , express.static('static'))


app.post('/instance', passport.authenticate(['basic'],{session: true}), function(req,res){
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

app.get('/instance', passport.authenticate(['basic'],{session: true}), function(req,res){
	docker.listContainers({all: true, filters: {ancestor: ["custom-node-red"]}},function (err, containers) {
		if (!err && containers) {
			res.send({containers:containers, domain: settings.rootDomain});
		} else {
			res.status(400).send({err: err});
		} 
	});
});


app.post('/instance/:id', passport.authenticate(['basic'],{session: true}), function(req,res){
	if (req.body.command) {
		if (req.body.command == "start"){
			var container = docker.getContainer(req.params.id);
			container.inspect()
			.then(info => {
				if (!info.State.Running) {
					return container.start()
				} else {
					res.status(409).send({});
					return Promise.reject();
				}
			})
			.then(data => {
				res.status(204).send({});
			})
			.catch(err => {
				res.status(500).send({err: err})
			})

		} else if (req.body.command == "stop") {
			var container = docker.getContainer(req.params.id);
			container.inspect()
			.then(info => {
				if (info.State.Running) {
					return container.stop()
				} else {
					res.status(409).send({});
					return Promise.reject();
				}
			})
			.then(data => {
				res.status(204).send({});
			})
			.catch(err => {
				res.status(500).send({err: err})
			})
		} else if (req.body.command == "remove") {
			var container = docker.getContainer(req.params.id);
			var appname = req.body.appname;
			container.inspect()
			.then(info => {
				if (!info.State.Running) {
					return container.remove();
				} else {
					res.status(409).send({});
					return Promise.reject();
				}
			})
			.then(() => {
				return docker.pruneVolumes();
			})
			.then(() => {
				//should delete flows and settings...
				return Promise.all([
						Users.deleteOne({appname: appname}),
						Flows.deleteOne({appname: appname}),
						Settings.deleteOne({appname: appname}),
						Sessions.deleteOne({appname: appname}),
						Library.deleteMany({appname: appname})
					])
			})
			.then( () => {
				console.log("cleared db")
				res.status(204).send({})
			})
			.catch( err => {
				console.log(err);
				res.status(500).send({err: err})
			})
		}
	}
});

const server = http.Server(app);
const wss = new ws.Server({ clientTracking: false, noServer: true });

server.on('upgrade', function(req, socket, head){

	//should do authentication here
	wss.handleUpgrade(req, socket, head, function (ws) {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection',function(ws, req){
	const containerId = req.url.substring(1);

	const container = docker.getContainer(containerId);
	var inStream;
	const logStream = new stream.PassThrough();

	logStream.on('data', (chunk) => {
		ws.send(chunk);
	})

	var fiveMins = Date.now() - ( 5 * 60 ); 

	container.logs({stdout: true, stderr: true, follow: true, tail: 50 })
	.then(logs => {
		inStream = logs;
		return container.modem.demuxStream(logs, logStream, logStream);
	})
	.catch( err => {
		console.log("err");
	});

	ws.on('close', function(){
		if (inStream) {
			inStream.destroy();
		}
		logStream.end();
	});

})

server.listen(port, host, function(){
	logger.info(util.format('App listening on  %s:%d!', host, port));
});