import { Meta, StoryObj } from "@storybook/react";
import { Tool } from "./Tool";

const meta = {
  title: "Tool",
  component: Tool,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    backgroundColor: { control: "color" },
  },
} satisfies Meta<typeof Tool>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
