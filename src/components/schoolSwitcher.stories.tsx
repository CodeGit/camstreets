import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import SchoolSwitcher from './schoolSwitcher'

const mockSchools = [
  { id: 1, name: 'Newnham Croft Primary', address: null, active: true, created_at: '' },
  { id: 2, name: 'St Matthew\'s Primary', address: null, active: true, created_at: '' },
  { id: 3, name: 'Trumpington Park Primary', address: null, active: true, created_at: '' },
]

const meta: Meta<typeof SchoolSwitcher> = {
  title: 'Components/SchoolSwitcher',
  component: SchoolSwitcher,
  args: {
    volunteer: null,
    fetchSchoolsAction: async () => mockSchools,
  },
} satisfies Meta<typeof SchoolSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithPreferredSchool: Story = {
  args: {
    volunteer: {
      id: '00000000-0000-0000-0000-000000000001',
      display_name: 'Vera',
      created_at: '',
      is_admin: false,
      is_superuser: false,
      preferred_school_id: 2,
    },
  },
}
