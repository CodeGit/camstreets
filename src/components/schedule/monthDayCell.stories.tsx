import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import MonthDayCell from './monthDayCell'
import { mockInstance, vera, alex } from './mocks'

const meta: Meta<typeof MonthDayCell> = {
  title: 'Components/Calendar/MonthDayCell',
  component: MonthDayCell,
} satisfies Meta<typeof MonthDayCell>

export default meta
type Story = StoryObj<typeof meta>

const twoLocationsBothSessions = [
  mockInstance({
    id: 1,
    locationId: 1,
    locationName: 'Newnham Road crossing point',
    label: 'Morning drop-off',
    startTime: '08:15:00',
    endTime: '08:45:00',
    volunteers: [vera],
  }),
  mockInstance({
    id: 2,
    locationId: 2,
    locationName: 'Grantchester Street crossing',
    label: 'Morning drop-off',
    startTime: '08:20:00',
    endTime: '08:50:00',
    volunteers: [],
  }),
  mockInstance({
    id: 3,
    locationId: 1,
    locationName: 'Newnham Road crossing point',
    label: 'Afternoon pickup',
    startTime: '15:00:00',
    endTime: '15:30:00',
    volunteers: [vera, alex],
  }),
  mockInstance({
    id: 4,
    locationId: 2,
    locationName: 'Grantchester Street crossing',
    label: 'Afternoon pickup',
    startTime: '15:00:00',
    endTime: '15:30:00',
    volunteers: [],
  }),
]

export const FullDay: Story = {
  args: {
    dayNumber: 7,
    active: true,
    instances: twoLocationsBothSessions,
    morningLocationIds: [1, 2],
    afternoonLocationIds: [1, 2],
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
  },
}

// Vera's own morning slot (id 1) gets the bold outline; everyone else's
// don't.
export const SignedInVolunteerWithOwnSlot: Story = {
  args: {
    ...FullDay.args,
    currentVolunteerId: vera.id,
    isSchoolMember: true,
  },
}

export const OutsideTerm: Story = {
  args: {
    dayNumber: 26,
    active: false,
    instances: [],
    morningLocationIds: [1, 2],
    afternoonLocationIds: [1, 2],
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
  },
}

// One location's slot didn't generate for this particular day (an inset
// day at just that location, say) - its swatch position stays empty
// rather than the row collapsing, keeping columns aligned with every
// other day in the grid.
export const OneLocationMissingThisDay: Story = {
  args: {
    dayNumber: 14,
    active: true,
    instances: [twoLocationsBothSessions[0], twoLocationsBothSessions[2]],
    morningLocationIds: [1, 2],
    afternoonLocationIds: [1, 2],
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
  },
}
