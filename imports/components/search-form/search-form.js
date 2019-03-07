import SimpleSchema from 'simpl-schema'
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { AutoForm } from 'meteor/aldeed:autoform'

import './search-form.html'

SimpleSchema.extendOptions(['autoform'])

const searchSchema = new SimpleSchema({
	authorityKeyword: {
		type: String,
		label: 'Contracting Authority',
		optional: true,
	},
	CPVKeyword: {
		type: String,
		label: 'CPV',
		optional: true,
	},
	companyKeyword: {
		type: String,
		label: 'Company',
		optional: true,
	},
	startDate: {
		type: String,
		autoform: {
			placeholder: Meteor.settings.public.DATE_FORMAT,
		},
	},
	endDate: {
		type: String,
		autoform: {
			placeholder: Meteor.settings.public.DATE_FORMAT,
		},
	},
	priceThreshold: {
		type: Number,
		optional: true,
	},
	historicData: Boolean,
})

Template.searchForm.helpers({
	searchSchema() {
		return searchSchema
	},
	type() {
		const historicData = AutoForm.getFieldValue('historicData', 'searchForm')

		return historicData ? 'normal' : 'method'
	},
})
