import { WebApp } from 'meteor/webapp'
import readline from 'readline'
import csvParse from 'csv-parse'
import moment from 'moment'

WebApp.connectHandlers.use('/export', (req, res, next) => {
	console.log('mue?')
	let body = '';

	req.on('data', data => { body += data })

	req.on('end', () => {
		console.log('got body', body)
		res.writeHead(200)
		res.end()
	})
	next()
})
