import { WebApp } from 'meteor/webapp'

const readline = Npm.require('readline')

//using interal webapp or iron:router
WebApp.connectHandlers.use('/uploadFile', function (req, res) {
	//var start = Date.now()

	const rl = readline.createInterface({
		input: req,
		terminal: false,
	})

	rl.on('close', function () {
		res.writeHead(200)
		res.end(); //end the respone
		//console.log('Finish uploading, time taken: ' + Date.now() - start);
	});

	rl.on('line', line => {
		// console.log('got line', line)
	})
});
