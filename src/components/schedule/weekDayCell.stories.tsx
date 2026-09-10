import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import WeekDayCell from './weekDayCell'
import { mockInstance, vera } from './mocks'

const meta: Meta<typeof WeekDayCell> = {
  title: 'Components/Calendar/WeekDayCell',
  component: WeekDayCell,
} satisfies Meta<typeof WeekDayCell>

export default meta
type Story = StoryObj<typeof meta>

const twoLocations = [
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
]

export const TwoLocationsSideBySide: Story = {
  args: {
    hasTerm: true,
    instances: twoLocations,
    locationIds: [1, 2],
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
  },
}

// The week's other days have a location this one doesn't (an inset day,
// say) - locationIds still lists it (kept for column alignment across the
// week) but no instance exists for it here, so that slot in the column
// simply renders nothing.
export const MissingOneLocation: Story = {
  args: {
    hasTerm: true,
    instances: [twoLocations[0]],
    locationIds: [1, 2],
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
  },
}

export const NoTermCoversThisDate: Story = {
  args: {
    hasTerm: false,
    instances: [],
    locationIds: [],
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
  },
}

export const EmptySignedIn: Story = {
  args: {
    hasTerm: true,
    instances: [],
    locationIds: [],
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: vera.id,
    isSchoolMember: true,
    regularSlotIds: new Set(),
  },
}
