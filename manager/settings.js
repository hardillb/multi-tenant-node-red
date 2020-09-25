module.exports = {
	"mongodb": process.env["MONGO_URL"],
	"rootDomain": process.env["ROOT_DOMAIN"],
	// "dockerodeSettings": {
	// 	"host": "http://192.168.1.96",
	// 	"port": 2375
	// },
	"dockerodeSettings": { "socketPath": "/tmp/docker.sock"},
	admin: "admin",
	password: "password",
	logHistory: 250
}