import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta = {
	component: Card,
	parameters: {
		design: {
			type: "figma",
			url: "",
		},
	},
	args: {
		thumbnail: {
			url: "https://via.placeholder.com/300",
			width: 300,
			height: 300,
		},
		title: "Title",
		date: "2021-01-01",
	},
} as Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
