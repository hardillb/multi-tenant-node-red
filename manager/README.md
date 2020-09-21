# Multi Tenant Node-RED management app

This is a small web app to stand up new Node-RED instances using Docker.

## Configure

Edit the `settings.json` file to set the root domain for new instances and with
details about how to connect to Docker. The Docker settings should use the same
schema used by [dockerode](https://www.npmjs.com/package/dockerode)

e.g.

```{
	"rootDomain": "docker-pi.local",
	"dockerodeSettings": {
		"host": "http://127.0.0.1",
		"port": 2375
	}
}
```

or
```{
	"rootDomain": "docker-pi.local",
	"dockerodeSettings": {
		"socketPath": "/var/run/docker.sock"
	}
}
```