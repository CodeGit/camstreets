import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import CalendarNav from './calendarNav'

const meta: Meta<typeof CalendarNav> = {
  title: 'Components/Calendar/CalendarNav',
  component: CalendarNav,
} satisfies Meta<typeof CalendarNav>

export default meta
type Story = StoryObj<typeof meta>

export const BothDirections: Story = {
  args: {
    prevHref: '?date=2026-08-31',
    nextHref: '?date=2026-09-14',
    prevLabel: 'Previous week',
    nextLabel: 'Next week',
  },
}

// A term/season at either edge of what's known (e.g. the first or last
// term a school has default_terms for) has no adjacent one to jump to.
export const NoPreviousTerm: Story = {
  args: {
    prevHref: null,
    nextHref: '?date=2027-01-05',
    prevLabel: 'Previous term',
    nextLabel: 'Next term',
  },
}

export const NoNextTerm: Story = {
  args: {
    prevHref: '?date=2026-04-13',
    nextHref: null,
    prevLabel: 'Previous term',
    nextLabel: 'Next term',
  },
}
