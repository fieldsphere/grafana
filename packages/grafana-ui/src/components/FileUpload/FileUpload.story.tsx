import { type Meta, type StoryFn } from '@storybook/react';

import { structuredLog } from '@grafana/data';

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
      onFileUpload={({ currentTarget }) =>
        structuredLog('info', 'FileUpload story upload', {
          fileName: currentTarget?.files?.[0]?.name,
        })
      }
    />
  );
};
Basic.args = {
  size: 'md',
};

export default meta;
