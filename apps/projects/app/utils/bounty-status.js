import { theme } from '@aragon/ui'

const BOUNTY_STATUS = {
  'not-funded': 'Not funded',
  'funded': 'Accepting applicants',
  'review-applicants': 'Pending application review',
  'in-progress': 'Work in progress',
  'review-work': 'Work ready for review',
  'fulfilled': 'Fulfilled',
}

const BOUNTY_BADGE_COLOR = {
  'funded': { bg: '#e7f8ec', fg: '#51d4b7' },
  'review-applicants': { bg: '#e7f8ec', fg: '#51d4b7' },
  'in-progress': { bg: '#fff38e', fg: '#c5ba2d' },
  'review-work': { bg: '#fff38e', fg: '#c5ba2d' },
  'fulfilled': { bg: '#d1d1d1', fg: '#445159' },
}

export { BOUNTY_STATUS, BOUNTY_BADGE_COLOR }

