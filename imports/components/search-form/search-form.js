import SimpleSchema from 'simpl-schema'
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

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
	fuzzyKeyword: {
		type: String,
		label: 'Keyword',
		autoform: {
			placeholder: 'CPV / Authority / Company',
		},
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

Template.searchForm.onCreated(function () {
	this.historicData = new ReactiveVar(false)
})

Template.searchForm.events({
	'change #historic-data': function (ev, template) {
		template.historicData.set(ev.target.checked)
	},
})
Template.searchForm.helpers({
	searchSchema() {
		const historicData = Template.instance().historicData.get()
		const fieldsToOmit = historicData ? ['authorityKeyword', 'CPVKeyword', 'companyKeyword'] : ['fuzzyKeyword']
		return searchSchema.omit(...fieldsToOmit)
	},
	type() {
		const historicData = Template.instance().historicData.get()
		return historicData ? 'normal' : 'method'
	},
})
