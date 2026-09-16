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

// "detailed": the full day-view card - status pill plus one avatar circle
// per capacity slot.
export const DetailedVariant: Story = {
  args: { ...commonArgs, currentVolunteerId: null, variant: 'detailed' },
}

// "labeled": the week grid's compact cell - name badges, status text, and
// (since Vera is signed in) her own commitment gets the bold outline.
export const LabeledVariantSignedIn: Story = {
  args: { ...commonArgs, currentVolunteerId: vera.id, variant: 'labeled' },
}

// "labeled" for an anonymous visitor - dimming never applies (there's no
// "mine" to contrast against), and the card renders as a plain non-
// interactive div rather than a dialog trigger.
export const LabeledVariantAnonymous: Story = {
  args: { ...commonArgs, currentVolunteerId: null, variant: 'labeled' },
}

// "labeled", viewer is someone other than who's confirmed - on the public
// school page (dimUnclaimed unset) this renders at full opacity, same as
// everyone else's slots.
export const LabeledVariantOtherVolunteerPublicView: Story = {
  args: { ...commonArgs, currentVolunteerId: alex.id, variant: 'labeled' },
}

// Same slot and viewer, but on the dashboard's "My calendar" tab
// (dimUnclaimed) - since it's Vera's, not Alex's, it fades back.
export const LabeledVariantOtherVolunteerDashboardView: Story = {
  args: { ...commonArgs, currentVolunteerId: alex.id, variant: 'labeled', dimUnclaimed: true },
}

// "summary": the term view's single-line row - status/capacity only, no
// names, so a whole term stays scannable.
export const SummaryVariant: Story = {
  args: { ...commonArgs, currentVolunteerId: vera.id, variant: 'summary' },
}

// "glance": the month grid's tiny colour-only square - all detail lives in
// its aria-label (and hover tooltip) rather than visible text.
export const GlanceVariantSignedIn: Story = {
  args: { ...commonArgs, currentVolunteerId: vera.id, variant: 'glance' },
}

export const GlanceVariantNotSignedUp: Story = {
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
    variant: 'glance',
  },
}

// A slot with 2+ confirmed dates for the same volunteer looks like an
// ongoing regular commitment - the cancel dialog offers "just this date"
// vs "this and all future dates" instead of a plain confirmation.
export const LabeledVariantRegularCommitment: Story = {
  args: {
    ...commonArgs,
    currentVolunteerId: vera.id,
    isRegularCommitment: true,
    variant: 'labeled',
  },
}

export const LabeledVariantFullyStaffed: Story = {
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
    variant: 'labeled',
  },
}
