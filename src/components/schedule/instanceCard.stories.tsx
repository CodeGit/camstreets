import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import InstanceCard from './instanceCard'
import { mockInstance, vera, alex } from './mocks'

const meta: Meta<typeof InstanceCard> = {
  title: 'Components/Calendar/InstanceCard',
  component: InstanceCard,
} satisfies Meta<typeof InstanceCard>

export default meta
type Story = StoryObj<typeof meta>

const needsMore = mockInstance({
  id: 1,
  locationId: 1,
  locationName: 'Newnham Road crossing point',
  label: 'Morning drop-off',
  startTime: '08:15:00',
  endTime: '08:45:00',
  volunteers: [vera],
})

const commonArgs = {
  instance: needsMore,
  schoolId: 1,
  schoolName: 'Newnham Croft Primary',
  isSchoolMember: true,
  isRegularCommitment: false,
}

// "card": the full day-view card - status pill plus one avatar circle per
// capacity slot.
export const CardVariant: Story = {
  args: { ...commonArgs, currentVolunteerId: null, variant: 'card' },
}

// "block": the week grid's compact cell - name badges, status text, and
// (since Vera is signed in) her own commitment gets the bold outline.
export const BlockVariantSignedIn: Story = {
  args: { ...commonArgs, currentVolunteerId: vera.id, variant: 'block' },
}

// "block" for an anonymous visitor - dimming never applies (there's no
// "mine" to contrast against), and the card renders as a plain non-
// interactive div rather than a dialog trigger.
export const BlockVariantAnonymous: Story = {
  args: { ...commonArgs, currentVolunteerId: null, variant: 'block' },
}

// "block", viewer is someone other than who's confirmed - on the public
// school page (dimUnclaimed unset) this renders at full opacity, same as
// everyone else's slots.
export const BlockVariantOtherVolunteerPublicView: Story = {
  args: { ...commonArgs, currentVolunteerId: alex.id, variant: 'block' },
}

// Same slot and viewer, but on the dashboard's "My calendar" tab
// (dimUnclaimed) - since it's Vera's, not Alex's, it fades back.
export const BlockVariantOtherVolunteerDashboardView: Story = {
  args: { ...commonArgs, currentVolunteerId: alex.id, variant: 'block', dimUnclaimed: true },
}

// "agenda": the term view's single-line row - status/capacity only, no
// names, so a whole term stays scannable.
export const AgendaVariant: Story = {
  args: { ...commonArgs, currentVolunteerId: vera.id, variant: 'agenda' },
}

// "swatch": the month grid's tiny colour-only square - all detail lives in
// its aria-label rather than visible text.
export const SwatchVariantSignedIn: Story = {
  args: { ...commonArgs, currentVolunteerId: vera.id, variant: 'swatch' },
}

export const SwatchVariantNotSignedUp: Story = {
  args: {
    ...commonArgs,
    instance: mockInstance({
      id: 2,
      locationId: 1,
      locationName: 'Newnham Road crossing point',
      label: 'Afternoon pickup',
      startTime: '15:00:00',
      endTime: '15:30:00',
      volunteers: [],
    }),
    currentVolunteerId: vera.id,
    variant: 'swatch',
  },
}

// A slot with 2+ confirmed dates for the same volunteer looks like an
// ongoing regular commitment - the cancel dialog offers "just this date"
// vs "this and all future dates" instead of a plain confirmation.
export const BlockVariantRegularCommitment: Story = {
  args: {
    ...commonArgs,
    currentVolunteerId: vera.id,
    isRegularCommitment: true,
    variant: 'block',
  },
}

export const BlockVariantFullyStaffed: Story = {
  args: {
    ...commonArgs,
    instance: mockInstance({
      id: 3,
      locationId: 1,
      locationName: 'Newnham Road crossing point',
      label: 'Morning drop-off',
      startTime: '08:15:00',
      endTime: '08:45:00',
      volunteers: [vera, alex],
    }),
    currentVolunteerId: null,
    variant: 'block',
  },
}
