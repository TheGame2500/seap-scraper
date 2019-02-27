import { Template } from 'meteor/templating'
import { Contracts } from '../../api/contracts/contracts'

import './table.html'

Template.table.onCreated(function () {
	this.subscribe('contracts.list')
})

Template.table.helpers({
	contracts() {
		return Contracts
	},
	settings() {
		return {
			fields: [{
				key: 'contractingAuthority',
				label: 'Contracting Authority',
			}, {
				key: 'supplier',
				label: 'Supplier',
			}, {
				key: 'directAcquisitionName',
				label: 'Direct Aquisition Name',
			}, {
				key: 'uniqueIdentificationCode',
				label: 'Unique ID',
			}, {
				key: 'finalizationDate',
				label: 'Finalisation Date',
			}, {
				key: 'estimatedValueRon',
				label: 'RON',
			}, {
				key: 'estimatedValueOtherCurrency',
				label: 'EUR',
			}, {
				key: 'cpvCode',
				label: 'CPV',
			}],
		}
	},
})
