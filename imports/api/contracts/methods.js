import { HTTP } from 'meteor/http'
import { Meteor } from 'meteor/meteor'
import { Contracts } from './contracts'
import { getPeriods, splitPeriodInHalves } from './periodUtils'

async function getAquisitions({ authority, company, CPV, period, priceThreshold }, userID, pageIndex = 0) {
	const PAGE_SIZE = 1000;
	const AQUISITION_LIST_URL = `${Meteor.settings.public.API_ROOT_URL}/api-pub/DirectAcquisitionCommon/GetDirectAcquisitionList`
	const filter = {}

	if (authority) {
		filter.contractingAuthorityId = authority.id
	}

	if (CPV) {
		filter.cpvCodeId = CPV.id
	}

	if (company) {
		filter.supplierId = company.id
	}

	const aquisitionsResponse = HTTP.post(AQUISITION_LIST_URL, {
		...Meteor.settings.DEFAULT_REQUEST_ARGS,
		data: {
			...filter,
			pageSize: PAGE_SIZE,
			showOngoingDa: false,
			cookieContext: null,
			pageIndex,
			sysDirectAcquisitionStateId: 7, // accepted aquisition
			finalizationDateStart: period.start,
			finalizationDateEnd: period.end,
			publicationDateStart: null,
			publicationDateEnd: null,
		},
	})

	const aquisitions = aquisitionsResponse.data
	if (aquisitions.searchTooLong) {
		const {
			firstPeriod,
			secondPeriod,
		} = splitPeriodInHalves(period)

		getAquisitions({ authority, company, CPV, period: firstPeriod, priceThreshold }, userID, pageIndex)
		return getAquisitions({ authority, company, CPV, period: secondPeriod, priceThreshold }, userID, pageIndex)
	}
	aquisitions.items.forEach(aquisition => {
		if (aquisition.estimatedValueOtherCurrency < priceThreshold) return;

		const { contractingAuthority, supplier, directAcquisitionName, uniqueIdentificationCode, finalizationDate, estimatedValueRon, estimatedValueOtherCurrency, cpvCode } = aquisition;


		Contracts.upsert({ uniqueIdentificationCode }, { contractingAuthority, supplier, directAcquisitionName, uniqueIdentificationCode, finalizationDate, estimatedValueRon, estimatedValueOtherCurrency, cpvCode, userID })
	})

	// const totalAquisitions = (PAGE_SIZE * pageIndex) + aquisitions.items.length
	if (aquisitions.items.length < PAGE_SIZE) {
		// console.log('Fetched', totalAquisitions, 'for authority', authority.text)
		return
	}
	// console.log('Fetched', totalAquisitions, 'out of ', aquisitions.total, 'for authority', authority.text)

	return getAquisitions({ authority, company, CPV, period, priceThreshold }, userID, pageIndex + 1)

}

Meteor.methods({
	'contracts.fetch': async function ({ authorityKeyword, CPVKeyword, companyKeyword, startDate, endDate, priceThreshold = 0 }) {
		if (!this.userId) return;
		try {
			if (!CPVKeyword && !authorityKeyword && !companyKeyword) {
				throw new Meteor.Error('contracts.fetch.oneRequired', 'At least one of authority, company or CPV required')
			}
			Contracts.update({ userID: this.userId }, { $unset: { userID: 1 } }, { multi: true })
			Meteor.users.update(this.userId, { $unset: { 'profile.loading': 1 } })
			const periods = getPeriods(startDate, endDate)

			const authorities = authorityKeyword ? Meteor.call('authorities.list', authorityKeyword) : [false]
			const CPVs = CPVKeyword ? Meteor.call('CPVs.list', CPVKeyword) : [false]
			const companies = companyKeyword ? Meteor.call('companies.list', companyKeyword) : [false]

			const totalFetches = periods.length * authorities.length * CPVs.length * companies.length

			if (totalFetches === 0) {
				throw new Meteor.Error('contracts.fetch.noResults', 'No results for these filters')
			}

			Meteor.users.update(this.userId, { $set: { 'profile.loading': { totalFetches, fetchesDone: 0 } } })
			let index = 0;
			for (const authority of authorities) {
				for (const CPV of CPVs) {
					for (const period of periods) {
						for (const company of companies) {
							await getAquisitions({ authority, company, CPV, period, priceThreshold }, this.userId) // eslint-disable-line no-await-in-loop
							index++
							Meteor.users.update(this.userId, { $set: { 'profile.loading.fetchesDone': index } })
						}
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
