import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { Tables } from '@/lib/supabase/database.types'

import DaySchedule, { type ScheduleInstance } from './day'

type Volunteer = Tables<'volunteers'>

function mockVolunteer(overrides: Partial<Volunteer> & Pick<Volunteer, 'id' | 'display_name'>): Volunteer {
  return {
    created_at: '',
    is_admin: false,
    is_superuser: false,
    preferred_school_id: null,
    ...overrides,
  }
}

function mockLocation(id: number, name: string): Tables<'locations'> {
  return { id, name, address: null, active: true, created_at: '', school_id: 1 }
}

function mockInstance(input: {
  id: number
  locationId: number
  locationName: string
  label: string
  startTime: string
  endTime: string
  capacity?: number
  volunteers?: Volunteer[]
}): ScheduleInstance {
  const capacity = input.capacity ?? 2
  return {
    id: input.id,
    slot_id: input.id,
    term_id: 1,
    date: '2026-09-07',
    start_time: input.startTime,
    end_time: input.endTime,
    capacity,
    status: 'open',
    created_at: '',
    slot: {
      id: input.id,
      location_id: input.locationId,
      day_of_week: 1,
      start_time: input.startTime,
      end_time: input.endTime,
      label: input.label,
      capacity,
      active: true,
      created_at: '',
      location: mockLocation(input.locationId, input.locationName),
    },
    signups: (input.volunteers ?? []).map((volunteer, i) => ({
      id: input.id * 10 + i,
      slot_instance_id: input.id,
      volunteer_id: volunteer.id,
      status: 'confirmed',
      created_at: '',
      volunteer,
    })),
  }
}

const vera = mockVolunteer({ id: '00000000-0000-0000-0000-000000000001', display_name: 'Vera' })
const alex = mockVolunteer({ id: '00000000-0000-0000-0000-000000000002', display_name: 'Alex' })

const meta: Meta<typeof DaySchedule> = {
  title: 'Components/Calendar/DaySchedule',
  component: DaySchedule,
} satisfies Meta<typeof DaySchedule>

export default meta
type Story = StoryObj<typeof meta>

export const FullyStaffed: Story = {
  args: {
    date: '2026-09-07',
    hasPublishedTerm: true,
    instances: [
      mockInstance({
        id: 1,
        locationId: 1,
        locationName: 'Newnham Road crossing point',
        label: 'AM drop-off',
        startTime: '08:15:00',
        endTime: '08:45:00',
        volunteers: [vera, alex],
      }),
      mockInstance({
        id: 2,
        locationId: 1,
        locationName: 'Newnham Road crossing point',
        label: 'PM pickup',
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
    hasPublishedTerm: true,
    instances: [
      mockInstance({
        id: 3,
        locationId: 1,
        locationName: 'Newnham Road crossing point',
        label: 'AM drop-off',
        startTime: '08:15:00',
        endTime: '08:45:00',
        volunteers: [vera],
      }),
      mockInstance({
        id: 4,
        locationId: 2,
        locationName: 'Grantchester Street crossing',
        label: 'PM pickup',
        startTime: '15:00:00',
        endTime: '15:30:00',
        volunteers: [],
      }),
    ],
  },
}

export const NoSlotsToday: Story = {
  args: {
    date: '2026-09-12',
    hasPublishedTerm: true,
    instances: [],
  },
}

export const NoPublishedTerm: Story = {
  args: {
    date: '2027-01-04',
    hasPublishedTerm: false,
    instances: [],
  },
}
