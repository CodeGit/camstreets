import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'

import NavbarSchoolSwitcher from './navbarSchoolSwitcher'

const mockSchools = [
  { id: 1, name: 'Newnham Croft Primary', street: null, town: null, active: true, is_demo: false, created_at: '' },
  { id: 2, name: 'St Matthew\'s Primary', street: null, town: null, active: true, is_demo: false, created_at: '' },
  { id: 3, name: 'Trumpington Park Primary', street: null, town: null, active: true, is_demo: false, created_at: '' },
]

const meta: Meta<typeof NavbarSchoolSwitcher> = {
  title: 'Components/NavbarSchoolSwitcher',
  component: NavbarSchoolSwitcher,
  args: {
    volunteer: null,
    fetchSchoolsAction: async () => mockSchools,
    onSchoolSelectionAction: fn(),
  },
} satisfies Meta<typeof NavbarSchoolSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithPreferredSchool: Story = {
  args: {
    volunteer: {
      id: '00000000-0000-0000-0000-000000000001',
      preferred_school_id: 2,
    },
  },
}
