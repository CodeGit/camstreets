import '@/app/globals.css'
import type { Preview } from '@storybook/nextjs-vite'

const preview: Preview = {
  parameters: {
    // This project is entirely App Router — without this, Storybook's
    // Next.js integration defaults to mocking the old Pages Router, which
    // never provides the AppRouterContext that next/navigation's useRouter()
    // needs, causing "invariant expected app router to be mounted".
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;