import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import Navbar from './navbar'

const meta: Meta<typeof Navbar> = {
  title: 'Components/Navbar',
  component: Navbar,
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    user: null,
  },
}