import moment from 'moment'

export const splitPeriodInHalves = ({ start, end }) => {
	const startDateMoment = moment(start)
	const endDateMoment = moment(end)

	const totalDiffDays = endDateMoment.diff(startDateMoment, 'days')
	const middleDiffDays = Math.floor(totalDiffDays / 2)

	const firstPeriodEnd = startDateMoment
		.clone()
		.add(middleDiffDays, 'days')

	const secondPeriodStart = firstPeriodEnd
		.clone()
		.add(1, 'day')
		.toISOString()

	return {
		firstPeriod: {
			start,
			end: firstPeriodEnd.toISOString(),
		},
		secondPeriod: {
			start: secondPeriodStart,
			end,
		},
	}
}

export const getPeriods = (startDate, endDate) => {
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
