import { AutoForm } from 'meteor/aldeed:autoform'
import SimpleSchema from 'simpl-schema'
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
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
})

Template.searchForm.helpers({
	searchSchema() {
		return searchSchema
	},
})
