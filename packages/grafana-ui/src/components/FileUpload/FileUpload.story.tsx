import { Meta, StoryFn } from '@storybook/react';

import { FileUpload } from './FileUpload';
import mdx from './FileUpload.mdx';

const meta: Meta<typeof FileUpload> = {
  title: 'Inputs/FileUpload',
  component: FileUpload,
  parameters: {
    docs: {
      page: mdx,
    },
    controls: {
      exclude: ['className', 'onFileUpload'],
    },
  },
  argTypes: {
    size: {
      control: {
        type: 'select',
      },
      options: ['xs', 'sm', 'md', 'lg'],
    },
  },
};

export const Basic: StoryFn<typeof FileUpload> = (args) => {
  return (
    <FileUpload
      size={args.size}
      onFileUpload={({ currentTarget }) => Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'info'), console, [{ timestamp: new Date().toISOString(), level: 'info', source: 'packages/grafana-ui/src/components/FileUpload/FileUpload.story.tsx', args: ['file', currentTarget?.files && currentTarget.files[0]] }])}
    />
  );
};
Basic.args = {
  size: 'md',
};

export default meta;
