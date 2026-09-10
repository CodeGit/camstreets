import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ScheduleInstance } from './instanceCard'

import MonthGrid from './monthGrid'
import { mockInstance, vera, alex } from './mocks'

const meta: Meta<typeof MonthGrid> = {
  title: 'Components/Calendar/MonthGrid',
  component: MonthGrid,
} satisfies Meta<typeof MonthGrid>

export default meta
type Story = StoryObj<typeof meta>

function byDate(instances: ScheduleInstance[]): Map<string, ScheduleInstance[]> {
  const map = new Map<string, ScheduleInstance[]>()
  for (const instance of instances) {
    map.set(instance.date, [...(map.get(instance.date) ?? []), instance])
  }
  return map
}

// Every weekday in September 2026 gets the same two-location, two-session
// pattern, with Vera regularly covering Monday mornings at Newnham Road.
const WEEKDAYS_SEPT_2026 = [
  '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
  '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
  '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18',
  '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25',
  '2026-09-28', '2026-09-29', '2026-09-30',
]

const aTypicalMonth: ScheduleInstance[] = WEEKDAYS_SEPT_2026.flatMap((date, i) => [
  mockInstance({
    id: i * 4 + 1,
    date,
    locationId: 1,
    locationName: 'Newnham Road crossing point',
    label: 'Morning drop-off',
    startTime: '08:15:00',
    endTime: '08:45:00',
    volunteers: date.endsWith('07') || date.endsWith('14') || date.endsWith('21') || date.endsWith('28') ? [vera] : [],
  }),
  mockInstance({
    id: i * 4 + 2,
    date,
    locationId: 2,
    locationName: 'Grantchester Street crossing',
    label: 'Morning drop-off',
    startTime: '08:20:00',
    endTime: '08:50:00',
    volunteers: i % 3 === 0 ? [alex] : [],
  }),
  mockInstance({
    id: i * 4 + 3,
    date,
    locationId: 1,
    locationName: 'Newnham Road crossing point',
    label: 'Afternoon pickup',
    startTime: '15:00:00',
    endTime: '15:30:00',
    volunteers: i % 4 === 0 ? [vera, alex] : [],
  }),
  mockInstance({
    id: i * 4 + 4,
    date,
    locationId: 2,
    locationName: 'Grantchester Street crossing',
    label: 'Afternoon pickup',
    startTime: '15:00:00',
    endTime: '15:30:00',
    volunteers: [],
  }),
])

export const SeptemberTypical: Story = {
  args: {
    year: 2026,
    month: 9,
    instancesByDate: byDate(aTypicalMonth),
    termCoversDate: () => true,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
    prevMonthDate: '2026-08-01',
    nextMonthDate: '2026-10-01',
  },
}

// Vera's Monday-morning slots get the bold outline; everyone else's -
// including her own Thursday afternoons, where she's just one of two
// confirmed - stay plain.
export const SignedInVolunteer: Story = {
  args: {
    ...SeptemberTypical.args,
    currentVolunteerId: vera.id,
    isSchoolMember: true,
  },
}

// The last week of October, half-term - term coverage stops mid-month.
export const HalfTermBreak: Story = {
  args: {
    year: 2026,
    month: 10,
    instancesByDate: new Map(),
    termCoversDate: (date: string) => date < '2026-10-27',
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
    prevMonthDate: '2026-09-01',
    nextMonthDate: '2026-11-01',
  },
}
