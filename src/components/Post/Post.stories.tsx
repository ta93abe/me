import type { Meta, StoryObj } from "@storybook/react";
import { Post } from "./Post";

const meta = {
	component: Post,
	parameters: {
		design: {
			type: "figma",
			url: "",
		},
	},
	args: {},
} as Meta<typeof Post>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
