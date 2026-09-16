import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { Tables } from '@/lib/supabase/database.types'

import Navbar from './navbar'

type Volunteer = Tables<'volunteers'>

function mockVolunteer(overrides: Partial<Volunteer> & Pick<Volunteer, 'id' | 'display_name'>): Volunteer {
  return {
    created_at: new Date().toISOString(),
    is_admin: false,
    is_superuser: false,
    preferred_school_id: null,
    ...overrides,
  }
}

const meta: Meta<typeof Navbar> = {
  title: 'Components/Navbar',
  component: Navbar,
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {
  args: {
    volunteer: null,
  },
}

export const Volunteer: Story = {
  args: {
    volunteer: mockVolunteer({ id: '00000000-0000-0000-0000-000000000001', display_name: 'Vera' }),
  },
}

export const VolunteerWithPreferredSchool: Story = {
  args: {
    volunteer: mockVolunteer({
      id: '00000000-0000-0000-0000-000000000004',
      display_name: 'Priya',
      preferred_school_id: 1,
    }),
  },
}

export const Admin: Story = {
  args: {
    volunteer: mockVolunteer({
      id: '00000000-0000-0000-0000-000000000002',
      display_name: 'Alex',
      is_admin: true,
    }),
  },
}

export const Superuser: Story = {
  args: {
    volunteer: mockVolunteer({
      id: '00000000-0000-0000-0000-000000000003',
      display_name: 'Sam',
      is_superuser: true,
    }),
  },
}
