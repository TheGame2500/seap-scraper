import { WebApp } from 'meteor/webapp'
import { Meteor } from 'meteor/meteor'
import { _ } from 'meteor/underscore'
import { URLSearchParams } from 'url';
import csvStringify from 'csv-stringify'
import moment from 'moment'
import { Contracts } from '../../contracts/contracts'

function getStringifier() {
	const stringifier = csvStringify({
		columns: [{
			key: 'contractingAuthority',
			header: 'Autoritate contractanta',
		}, {
			key: 'supplier',
			header: 'Firma ofertanta',
		}, {
			key: 'directAcquisitionName',
			header: 'Numele achizitiei',
		}, {
			key: 'uniqueIdentificationCode',
			header: 'Cod identificare contract',
		}, {
			key: 'finalizationDate',
			header: 'Data finalizare',
		}, {
			key: 'estimatedValueRon',
			header: 'Valoare RON',
		}, {
			key: 'estimatedValueOtherCurrency',
			header: 'Valoare EUR',
		}, {
			key: 'cpvCode',
			header: 'Cod CPV',
		}],
		cast: {
			string(val) {
				return val.replace(/\^/gi, ',')
			},
			date(val) {
				return val.toISOString()
			},
		},
		header: true,
		delimiter: '^',
	})

	return stringifier
}

function getMonday(newD) {
	const d = new Date(newD);
	const day = d.getDay();
	const diff = (d.getDate() - day) + (day === 0 ? -6 : 1); // adjust when day is sunday

	d.setDate(diff)
	d.setHours(0 - (d.getTimezoneOffset() / 60));
	d.setMinutes(0);
	d.setSeconds(0);
	d.setMilliseconds(0)

	return new Date(d);
}

function getWeeks(startDate, endDate) {
	const { DATE_FORMAT } = Meteor.settings.public
	const startDateMom = moment(startDate, DATE_FORMAT)

	const weeks = []

	while (startDateMom.format(DATE_FORMAT) !== endDate) {
		const monday = moment(getMonday(startDateMom.toDate())).format(DATE_FORMAT)
		weeks.push(monday)
		startDateMom.add(1, 'day')
	}

	return _.uniq(weeks).map(week => moment.utc(week, DATE_FORMAT).toDate())
}

function parseParams(string) {
	const searchParams = new URLSearchParams(string)
	const parsedParams = {}

	for (const [name, value] of searchParams.entries()) {
		if (value) parsedParams[name] = value
	}

	parsedParams.$text = {
		$search: parsedParams.fuzzyKeyword,
	}

	if (parsedParams.priceThreshold) {
		parsedParams.estimatedValueOtherCurrency = { $gte: parseFloat(parsedParams.priceThreshold || 0) }
		delete parsedParams.priceThreshold
	}

	const weeks = getWeeks(parsedParams.startDate, parsedParams.endDate)

	delete parsedParams.fuzzyKeyword
	delete parsedParams.historicData
	delete parsedParams.startDate
	delete parsedParams.endDate

	return weeks.map(week => ({
		...parsedParams,
		week,
	}))
}

function fetchNewCursor(restOfParams, stringifier) {
	const params = restOfParams.splice(0, 1)[0]
	if (!params) return stringifier.end()

	const contractsCursor = Contracts.rawCollection().find(params)

	contractsCursor.on('data', data => stringifier.write(data))
	contractsCursor.on('error', error => stringifier.destroy(error))

	contractsCursor.on('end', () => {
		fetchNewCursor(restOfParams, stringifier)
	})
}
WebApp.connectHandlers.use('/export', (req, res) => {
	const start = new Date()
	let body = '';

	req.on('data', data => { body += data })

	req.on('end', () => {
		console.log('File export with params', body)
		const weeklyParams = parseParams(body)

		const stringifier = getStringifier()

		const filename = `${moment().toISOString()}_export.csv`;

		res.setHeader('Content-Type', 'text/csv')
		res.setHeader('Content-Disposition', `filename="${filename}"`)
		res.writeHead(200)

		// contractsCursor.pipe(stringifier)

		const initialParams = weeklyParams.splice(0, 1)[0]
		const initialCursor = Contracts.rawCollection().find(initialParams)

		initialCursor.on('data', data => stringifier.write(data))
		initialCursor.on('error', error => { console.log('File export error', error); stringifier.destroy(error); res.destroy(error) })
		initialCursor.on('end', () => {
			fetchNewCursor(weeklyParams, stringifier)
		})

		stringifier.pipe(res)

		stringifier.on('end', () => {
			console.log('File export took', ((new Date() - start) / 1000) / 60, 'minutes')
		})
	})
})

