import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import UrlTabs from './urlTabs'
import { TabsList, TabsTab } from '@/components/ui/tabs'

const meta: Meta<typeof UrlTabs> = {
  title: 'Components/Dashboards/UrlTabs',
  component: UrlTabs,
} satisfies Meta<typeof UrlTabs>

export default meta
type Story = StoryObj<typeof meta>

// The admin/superuser dashboard's own outer tabs (paramName defaults to
// "tab").
export const DashboardTabs: Story = {
  args: {
    activeTab: 'calendar',
    children: (
      <TabsList>
        <TabsTab value="schools">Your schools</TabsTab>
        <TabsTab value="calendar">My calendar</TabsTab>
      </TabsList>
    ),
  },
}

// "My calendar"'s own day/week/month/term switcher (paramName "view") -
// coexists on the same page as the tabs above without clobbering them.
export const CalendarViewSwitcher: Story = {
  args: {
    activeTab: 'month',
    paramName: 'view',
    children: (
      <TabsList>
        <TabsTab value="day">Day</TabsTab>
        <TabsTab value="week">Week</TabsTab>
        <TabsTab value="month">Month</TabsTab>
        <TabsTab value="term">Term</TabsTab>
      </TabsList>
    ),
  },
}
