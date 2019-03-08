import { WebApp } from 'meteor/webapp'
import { Meteor } from 'meteor/meteor'
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
		header: true,
		delimiter: '^',
	})

	return stringifier
}

function parseParams(string) {
	const searchParams = new URLSearchParams(string)
	const parsedParams = {}

	for (const [name, value] of searchParams.entries()) {
		if (value) parsedParams[name] = value
	}

	const regexableParams = [{
		displayName: 'authorityKeyword',
		propName: 'contractingAuthority',
	}, {
		displayName: 'CPVKeyword',
		propName: 'cpvCode',
	}, {
		displayName: 'companyKeyword',
		propName: 'supplier',
	}]

	regexableParams.forEach(param => {
		if (!parsedParams[param.displayName]) return

		parsedParams[param.propName] = new RegExp(parsedParams[param.displayName], 'i')

		delete parsedParams[param.displayName]
	})

	parsedParams.finalizationDate = {
		$gte: moment(parsedParams.startDate, Meteor.settings.public.DATE_FORMAT).toDate(),
		$lte: moment(parsedParams.endDate, Meteor.settings.public.DATE_FORMAT).toDate(),
	}

	if (parsedParams.priceThreshold) {
		parsedParams.estimatedValueOtherCurrency = { $gte: parseFloat(parsedParams.priceThreshold) }
		delete parsedParams.priceThreshold
	}

	delete parsedParams.historicData
	delete parsedParams.startDate
	delete parsedParams.endDate
	return parsedParams
}
WebApp.connectHandlers.use('/export', (req, res) => {
	const start = new Date()
	let body = '';

	req.on('data', data => { body += data })

	req.on('end', () => {
		const params = parseParams(body)
		const stringifier = getStringifier()
		const contractsCursor = Contracts.rawCollection().find(params)

		const filename = `${moment().toISOString()}_export.csv`;

		res.setHeader('Content-Type', 'text/csv')
		res.setHeader('Content-Disposition', `filename="${filename}"`)
		res.writeHead(200)

		contractsCursor.pipe(stringifier)
		stringifier.pipe(res)

		stringifier.on('end', () => {
			console.log('File export took', ((new Date() - start) / 1000) / 60, 'minutes')
		})
	})
})
