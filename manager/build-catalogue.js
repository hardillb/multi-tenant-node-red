const superagent = require('superagent');

const catalogue = {
  "name":"Ben's custom catalogue",
  "updated_at": new Date().toISOString(),
  "modules": [
    // {
    //   "id": "@ben/ben-node-random",
    //   "version": "1.0.0",
    //   "description": "A node-red node that generates random numbers",
    //   "keywords": [
    //     "node-red",
    //     "random"
    //   ],
    //   "updated_at": "2020-09-21T18:37:50.673Z",
    //   "url": "http://flows.hardill.me.uk/node/ben-red-random"
    // }
  ]
};

const host = process.argv[2];

const url = "http://" + host +  ":4873/-/all"

const keyword = process.argv[3] ? process.argv[3] : "node-red";

superagent.get(url)
.end((err, res) => {
	if (!err) {
		const nodes = res.body;
		var nodeNames = Object.keys(nodes);
		const index = nodeNames.indexOf("_updated");
		if (index > -1) {
		  nodeNames.splice(index, 1);
		}

		for (const node in nodeNames) {
			var n = nodes[nodeNames[node]];
			if (n.keywords.indexOf(keyword) != -1) {
				var entry = {
					id: n.name,
					version: n["dist-tags"].latest,
					description: n.description,
					keywords: n.keywords,
					updated_at: n.time.modified,
					url: "http://" + host + ":4873/-/web/details/" + n.name
				}
				catalogue.modules.push(entry)
			}
		}

		console.log(JSON.stringify(catalogue, null, 2));
	}
});