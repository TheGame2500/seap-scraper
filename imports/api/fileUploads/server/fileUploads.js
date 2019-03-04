import { WebApp } from 'meteor/webapp'
import readline from 'readline'
import csvParse from 'csv-parse'
import moment from 'moment'
import { Contracts } from '../../contracts/contracts'

const HEADER_VALS = {
	AutoritateContractanta: 'contractingAuthority',
	Castigator: 'supplier',
	Descriere: 'directAcquisitionName',
	NumarContract: 'uniqueIdentificationCode',
	DataContract: 'finalizationDate',
	ValoareRON: 'estimatedValueRon',
	ValoareEUR: 'estimatedValueOtherCurrency',
	CPVCode: 'cpvCode',
}

//using interal webapp or iron:router
WebApp.connectHandlers.use('/uploadFile', function (req, res) {
	console.log('Upload started')
	const start = Date.now()
	const rl = readline.createInterface({
		input: req,
		terminal: false,
	})

	const parser = csvParse({
		delimiter: '^',
		skip_lines_with_error: true,
		columns: headers => headers.map(header => HEADER_VALS[header] || header),
		// columns: true,
		cast(value, context) {
			if (context.column !== 'finalizationDate') return value

			try {
				return moment(value.replace(' ', 'T')).toDate()
			} catch (ex) {
				console.error('\n\nex', ex)
				console.log('value ', value, '\n\n')
				return new Date()
			}
		},
	})

	rl.on('close', function () {
		res.writeHead(200)
		parser.end()
		res.end(); //end the respone
		console.log(`Finish uploading, time taken: ${Date.now() - start}`);
	});

	parser.on('readable', () => {
		let record = parser.read();
		while (record) {
			const contract = Object.keys(HEADER_VALS).reduce((prev, header) => { // eslint-disable-line no-loop-func
				const colName = HEADER_VALS[header];
				const newPrev = { ...prev }
				let value = record[colName]

				if (colName === 'contractingAuthority') {
					value = `${record.AutoritateContractantaCUI} ${value}`
				} else if (colName === 'supplier') {
					value = `${record.CastigatorCUI} ${record[Object.keys(record)[0]]}` // something wrong with Castigator column :/
				} else if (colName.includes('estimatedValue')) {
					value = parseFloat(value)
				}
				newPrev[colName] = value
				return newPrev
			}, { csvImport: true })

			Contracts.rawCollection().update({ uniqueIdentificationCode: contract.uniqueIdentificationCode }, { $set: contract }, { upsert: true }, (err) => { if (err) console.error('ERROR', err) })

			record = parser.read()
		}
	})

	parser.on('error', err => console.error('parser got error', err))

	rl.on('line', line => {
		parser.write(`${line}\r\n`)
	})

	// parser.write('Castigator^CastigatorCUI\r\n')
	// parser.write('test1^test2\r\n')
	// parser.end()
});
