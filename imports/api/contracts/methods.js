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

	const aquisitionsResponse = HTTP.post(AQUISITION_LIST_URL, {
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

	const aquisitions = aquisitionsResponse.data
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
	'contracts.fetch': async function ({ authorityKeyword, CPVKeyword, startDate, endDate, priceThreshold = 0 }) {
		if (!this.userId) return;
		try {
			if (!CPVKeyword && !authorityKeyword) {
				throw new Meteor.Error('contracts.fetch.oneRequired', 'At least one of authority or CPV required')
			}
			Contracts.remove({ userID: this.userId })
			Meteor.users.update(this.userId, { $unset: { 'profile.loading': 1 } })
			const periods = getPeriods(startDate, endDate)

			const authorities = authorityKeyword ? Meteor.call('authorities.list', authorityKeyword) : [false]
			const CPVs = CPVKeyword ? Meteor.call('CPVs.list', CPVKeyword) : [false]
			const totalFetches = periods.length * authorities.length * CPVs.length

			if (totalFetches === 0) {
				throw new Meteor.Error('contracts.fetch.noResults', 'No results for these filters')
			}

			Meteor.users.update(this.userId, { $set: { 'profile.loading': { totalFetches, fetchesDone: 0 } } })
			let index = 0;
			for (const authority of authorities) {
				for (const CPV of CPVs) {
					for (const period of periods) {
						await getAquisitions({ authority, CPV, period, priceThreshold }, this.userId) // eslint-disable-line no-await-in-loop
						index++
						Meteor.users.update(this.userId, { $set: { 'profile.loading.fetchesDone': index } })
					}
				}
			}

			return true
		} catch (ex) {
			console.error('contracts.fetch something went wrong', ex)
			Meteor.users.update(this.userId, { $set: { 'profile.loading': { error: ex instanceof Meteor.Error ? ex.reason : 'Something went wrong. Please retry' } } })
		}
	},
})
