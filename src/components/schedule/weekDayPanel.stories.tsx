import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import WeekDayPanel from './weekDayPanel'
import { mockInstance, vera, alex } from './mocks'

const meta: Meta<typeof WeekDayPanel> = {
  title: 'Components/Calendar/WeekDayPanel',
  component: WeekDayPanel,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
} satisfies Meta<typeof WeekDayPanel>

export default meta
type Story = StoryObj<typeof meta>

const commonArgs = {
  schoolId: 1,
  schoolName: 'Newnham Croft Primary',
  isSchoolMember: true,
  regularSlotIds: new Set<number>(),
}

export const TypicalDay: Story = {
  args: {
    ...commonArgs,
    date: '2026-09-07',
    hasTerm: true,
    instances: [
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
        date: '2026-09-07',
        locationId: 2,
        locationName: 'Grantchester Street crossing',
        label: 'Afternoon pickup',
        startTime: '15:00:00',
        endTime: '15:30:00',
        volunteers: [],
      }),
    ],
    currentVolunteerId: vera.id,
  },
}

// Dashboard "My calendar" context - Vera's own morning slot keeps its bold
// outline while Alex's afternoon slot (not hers) fades back.
export const DashboardViewDimmed: Story = {
  args: {
    ...commonArgs,
    date: '2026-09-07',
    hasTerm: true,
    instances: [
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
        date: '2026-09-07',
        locationId: 2,
        locationName: 'Grantchester Street crossing',
        label: 'Afternoon pickup',
        startTime: '15:00:00',
        endTime: '15:30:00',
        volunteers: [alex],
      }),
    ],
    currentVolunteerId: vera.id,
    dimUnclaimed: true,
  },
}

export const NoTermCoversThisDate: Story = {
  args: {
    ...commonArgs,
    date: '2027-08-02',
    hasTerm: false,
    instances: [],
    currentVolunteerId: null,
  },
}

export const EmptyDay: Story = {
  args: {
    ...commonArgs,
    date: '2026-09-07',
    hasTerm: true,
    instances: [],
    currentVolunteerId: null,
  },
}
