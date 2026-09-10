import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ScheduleInstance } from './instanceCard'

import TermAgenda from './termAgenda'
import { mockInstance, vera, alex } from './mocks'

const meta: Meta<typeof TermAgenda> = {
  title: 'Components/Calendar/TermAgenda',
  component: TermAgenda,
} satisfies Meta<typeof TermAgenda>

export default meta
type Story = StoryObj<typeof meta>

function byDate(instances: ScheduleInstance[]): Map<string, ScheduleInstance[]> {
  const map = new Map<string, ScheduleInstance[]>()
  for (const instance of instances) {
    map.set(instance.date, [...(map.get(instance.date) ?? []), instance])
  }
  return map
}

// instancesByDate is already pre-filtered by schoolTermCalendar.tsx to
// just the viewer's own confirmed slots for the term - these two dates
// are the only ones Vera has claimed this term, out of many more that
// exist but aren't hers.
const verasOwnDates: ScheduleInstance[] = [
  mockInstance({
    id: 1,
    date: '2026-09-07',
    locationId: 1,
    locationName: 'Newnham Road crossing point',
    label: 'Morning drop-off',
    startTime: '08:15:00',
    endTime: '08:45:00',
    volunteers: [vera],
  }),
  mockInstance({
    id: 2,
    date: '2026-09-14',
    locationId: 1,
    locationName: 'Newnham Road crossing point',
    label: 'Morning drop-off',
    startTime: '08:15:00',
    endTime: '08:45:00',
    volunteers: [vera, alex],
  }),
]

export const OwnSlotsThisTerm: Story = {
  args: {
    seasonName: 'Autumn 2026',
    seasonStartDate: '2026-09-01',
    seasonEndDate: '2026-12-22',
    prevSeasonStartDate: null,
    nextSeasonStartDate: '2027-01-05',
    instancesByDate: byDate(verasOwnDates),
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: vera.id,
    isSchoolMember: true,
    regularSlotIds: new Set(),
  },
}

export const NothingSignedUpForYet: Story = {
  args: {
    seasonName: 'Autumn 2026',
    seasonStartDate: '2026-09-01',
    seasonEndDate: '2026-12-22',
    prevSeasonStartDate: null,
    nextSeasonStartDate: '2027-01-05',
    instancesByDate: new Map(),
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: vera.id,
    isSchoolMember: true,
    regularSlotIds: new Set(),
  },
}

export const AtTheEdgeOfKnownTerms: Story = {
  args: {
    seasonName: 'Summer 2027',
    seasonStartDate: '2027-04-13',
    seasonEndDate: '2027-07-20',
    prevSeasonStartDate: '2027-01-05',
    nextSeasonStartDate: null,
    instancesByDate: new Map(),
    schoolId: 1,
    schoolName: 'Newnham Croft Primary',
    currentVolunteerId: vera.id,
    isSchoolMember: true,
    regularSlotIds: new Set(),
  },
}
