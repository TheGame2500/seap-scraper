import { HTTP } from 'meteor/http'
import { Meteor } from 'meteor/meteor'
import moment from 'moment'
import { Contracts } from './contracts'

async function getAquisitions({ authority, CPV, period, priceThreshold }, userID, pageIndex = 0) {
	const PAGE_SIZE = 1000;
	const AQUISITION_LIST_URL = `${Meteor.settings.public.API_ROOT_URL}/api-pub/DirectAcquisitionCommon/GetDirectAcquisitionList`
	const filter = {}

	if (authority) {
		filter.contractingAuthorityId = authority.id
	}

	if (CPV) {
		filter.cpvCodeId = CPV.id
	}

	const aquisitions = HTTP.post(AQUISITION_LIST_URL, {
		...Meteor.settings.DEFAULT_REQUEST_ARGS,
		data: {
			...filter,
			pageSize: PAGE_SIZE,
			showOngoingDa: false,
			cookieContext: null,
			pageIndex,
			sysDirectAcquisitionStateId: null,
			finalizationDateStart: period.start,
			finalizationDateEnd: period.end,
			publicationDateStart: null,
			publicationDateEnd: null,
		},
	})

	aquisitions.items.forEach(aquisition => {
		if (aquisition.estimatedValueOtherCurrency < priceThreshold) return;

		const { contractingAuthority, supplier, directAcquisitionName, uniqueIdentificationCode, finalizationDate, estimatedValueRon, estimatedValueOtherCurrency, cpvCode } = aquisition;


		Contracts.insert({ contractingAuthority, supplier, directAcquisitionName, uniqueIdentificationCode, finalizationDate, estimatedValueRon, estimatedValueOtherCurrency, cpvCode, userID })
	})

	// const totalAquisitions = (PAGE_SIZE * pageIndex) + aquisitions.items.length
	if (aquisitions.items.length < PAGE_SIZE) {
		// console.log('Fetched', totalAquisitions, 'for authority', authority.text)
		return
	}
	// console.log('Fetched', totalAquisitions, 'out of ', aquisitions.total, 'for authority', authority.text)

	return getAquisitions({ authority, CPV, period, priceThreshold }, userID, pageIndex + 1)

}

function getPeriods(startDate, endDate) {
	const startDateMoment = moment.utc(startDate, Meteor.settings.public.DATE_FORMAT)
	const endDateMoment = moment.utc(endDate, Meteor.settings.public.DATE_FORMAT)
	const sameYear = startDateMoment.get('year') === endDateMoment.get('year')

	if (sameYear) {
		return [{
			start: startDateMoment.toISOString(),
			end: endDateMoment.toISOString(),
		}]
	}
	const years = endDateMoment.get('year') - startDateMoment.get('year')
	const periods = []

	for (let i = 0; i <= years; i++) {
		const year = startDateMoment.clone().add(i, 'years')
		periods.push({
			start: i === 0 ? startDateMoment.toISOString() : year.startOf('year').toISOString(),
			end: i === years ? endDateMoment.toISOString() : year.endOf('year').toISOString(),
		})
	}

	return periods;
}

Meteor.methods({
	'contracts.list': async function ({ authorities = [null], CPVs = [null], startDate, endDate, priceThreshold = 0 }) {
		Contracts.remove({ userID: this.userId })
		const periods = getPeriods(startDate, endDate)

		for (const authority of authorities) {
			for (const CPV of CPVs) {
				for (const period of periods) {
					await getAquisitions({ authority, CPV, period, priceThreshold, userID: this.userId }) // eslint-disable-line no-await-in-loop
				}
			}
		}

		return true
	},
})
