import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import DaySchedule from './day'
import { mockInstance, vera, alex } from './mocks'

const meta: Meta<typeof DaySchedule> = {
  title: 'Components/Calendar/DaySchedule',
  component: DaySchedule,
} satisfies Meta<typeof DaySchedule>

export default meta
type Story = StoryObj<typeof meta>

export const FullyStaffed: Story = {
  args: {
    date: '2026-09-07',
    hasTerm: true,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
    instances: [
      mockInstance({
        id: 1,
        locationId: 1,
        locationName: 'Newnham Road crossing point',
        label: 'Morning drop-off',
        startTime: '08:15:00',
        endTime: '08:45:00',
        volunteers: [vera, alex],
      }),
      mockInstance({
        id: 2,
        locationId: 1,
        locationName: 'Newnham Road crossing point',
        label: 'Afternoon pickup',
        startTime: '15:00:00',
        endTime: '15:30:00',
        volunteers: [vera, alex],
      }),
    ],
  },
}

export const NeedsVolunteers: Story = {
  args: {
    date: '2026-09-08',
    hasTerm: true,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
    instances: [
      mockInstance({
        id: 3,
        locationId: 1,
        locationName: 'Newnham Road crossing point',
        label: 'Morning drop-off',
        startTime: '08:15:00',
        endTime: '08:45:00',
        volunteers: [vera],
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
    ],
  },
}

export const SignedInVolunteer: Story = {
  args: {
    date: '2026-09-08',
    hasTerm: true,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: vera.id,
    isSchoolMember: true,
    regularSlotIds: new Set(),
    instances: [
      mockInstance({
        id: 5,
        locationId: 1,
        locationName: 'Newnham Road crossing point',
        label: 'Morning drop-off',
        startTime: '08:15:00',
        endTime: '08:45:00',
        volunteers: [vera],
      }),
      mockInstance({
        id: 6,
        locationId: 2,
        locationName: 'Grantchester Street crossing',
        label: 'Afternoon pickup',
        startTime: '15:00:00',
        endTime: '15:30:00',
        volunteers: [],
      }),
    ],
  },
}

export const SignedInWithRegularCommitment: Story = {
  args: {
    date: '2026-09-08',
    hasTerm: true,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: vera.id,
    isSchoolMember: true,
    // slot id 5 (Morning drop-off) looks like an ongoing regular
    // commitment - clicking it offers "just this date" vs "this and all
    // future dates" instead of a plain cancel confirmation.
    regularSlotIds: new Set([5]),
    instances: [
      mockInstance({
        id: 5,
        locationId: 1,
        locationName: 'Newnham Road crossing point',
        label: 'Morning drop-off',
        startTime: '08:15:00',
        endTime: '08:45:00',
        volunteers: [vera],
      }),
    ],
  },
}

export const NoSlotsToday: Story = {
  args: {
    date: '2026-09-12',
    hasTerm: true,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
    instances: [],
  },
}

export const NoTermCoversThisDate: Story = {
  args: {
    date: '2027-01-04',
    hasTerm: false,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
    instances: [],
  },
}
