import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ScheduleInstance } from './instanceCard'

import WeekSchedule from './week'
import { mockInstance, vera, alex } from './mocks'

const meta: Meta<typeof WeekSchedule> = {
  title: 'Components/Calendar/WeekSchedule',
  component: WeekSchedule,
} satisfies Meta<typeof WeekSchedule>

export default meta
type Story = StoryObj<typeof meta>

const MONDAY = '2026-09-07'
const DAYS = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11']

function byDate(instances: ScheduleInstance[]): Map<string, ScheduleInstance[]> {
  const map = new Map<string, ScheduleInstance[]>()
  for (const instance of instances) {
    map.set(instance.date, [...(map.get(instance.date) ?? []), instance])
  }
  return map
}

const aTypicalWeek: ScheduleInstance[] = DAYS.flatMap((date, i) => [
  mockInstance({
    id: i * 2 + 1,
    date,
    locationId: 1,
    locationName: 'Newnham Road crossing point',
    label: 'Morning drop-off',
    startTime: '08:15:00',
    endTime: '08:45:00',
    volunteers: i % 2 === 0 ? [vera] : [],
  }),
  mockInstance({
    id: i * 2 + 2,
    date,
    locationId: 1,
    locationName: 'Newnham Road crossing point',
    label: 'Afternoon pickup',
    startTime: '15:00:00',
    endTime: '15:30:00',
    volunteers: i % 3 === 0 ? [vera, alex] : [],
  }),
])

export const TypicalWeek: Story = {
  args: {
    monday: MONDAY,
    days: DAYS,
    instancesByDate: byDate(aTypicalWeek),
    termCoversDate: () => true,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
  },
}

export const SignedInVolunteer: Story = {
  args: {
    monday: MONDAY,
    days: DAYS,
    instancesByDate: byDate(aTypicalWeek),
    termCoversDate: () => true,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: vera.id,
    isSchoolMember: true,
    regularSlotIds: new Set(),
  },
}

// The same slot id (100 - Newnham Road morning drop-off) repeated across
// the week, matching how a real regular commitment looks: one slot
// template, many dated instances. Clicking any of Vera's Monday/Wednesday/
// Friday claims offers "just this date" vs "this and all future dates".
const regularCommitmentWeek: ScheduleInstance[] = DAYS.map((date, i) =>
  mockInstance({
    id: 100 + i,
    date,
    locationId: 1,
    locationName: 'Newnham Road crossing point',
    label: 'Morning drop-off',
    startTime: '08:15:00',
    endTime: '08:45:00',
    volunteers: [vera],
  })
).map((instance) => ({ ...instance, slot_id: 100 }))

export const SignedInWithRegularCommitment: Story = {
  args: {
    monday: MONDAY,
    days: DAYS,
    instancesByDate: byDate(regularCommitmentWeek),
    termCoversDate: () => true,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: vera.id,
    isSchoolMember: true,
    regularSlotIds: new Set([100]),
  },
}

// A week straddling a half-term boundary mid-week: Mon-Wed in term,
// Thu-Fri during the break.
export const HalfTermMidweek: Story = {
  args: {
    monday: MONDAY,
    days: DAYS,
    instancesByDate: byDate(aTypicalWeek.filter((i) => i.date <= '2026-09-09')),
    termCoversDate: (date) => date <= '2026-09-09',
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
  },
}

export const NoTermThisWeek: Story = {
  args: {
    monday: '2027-08-02',
    days: ['2027-08-02', '2027-08-03', '2027-08-04', '2027-08-05', '2027-08-06'],
    instancesByDate: new Map(),
    termCoversDate: () => false,
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: null,
    isSchoolMember: false,
    regularSlotIds: new Set(),
  },
}
