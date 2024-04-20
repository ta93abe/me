import type { Meta, StoryObj } from "@storybook/react";
import { Mdx } from "./Mdx";

const meta = {
  component: Mdx,
  parameters: {
    design: {
      type: "figma",
      url: "",
    },
  },
  args: {},
} as Meta<typeof Mdx>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
