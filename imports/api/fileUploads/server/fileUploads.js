import { WebApp } from 'meteor/webapp'
import readline from 'readline'
import csvParse from 'csv-parse'

//using interal webapp or iron:router
WebApp.connectHandlers.use('/uploadFile', function (req, res) {
	const rl = readline.createInterface({
		input: req,
		terminal: false,
	})

	rl.on('close', function () {
		res.writeHead(200)
		res.end(); //end the respone
		//console.log('Finish uploading, time taken: ' + Date.now() - start);
	});

	console.log(rl.pipe)
	rl.on('line', line => {
		// console.log('got line', line)
	})


});
