---
name: 'component'
description: 'Generate React component.'
root: 'src/components'
output: '**/*'
ignore: []
questions:
  name: 'Please enter component name.'
---

# `{{ inputs.name | pascal }}/{{ inputs.name | pascal }}.tsx`

```typescript
export const {{ inputs.name | pascal }} = () => {
  return <div className="">{{ inputs.name | pascal }}</div>
};

```

# `{{ inputs.name | pascal }}/{{ inputs.name | pascal }}.stories.tsx`

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { {{ inputs.name | pascal }} } from "./{{ inputs.name | pascal }}";

const meta = {
  component: {{ inputs.name | pascal }},
  parameters: {
    design: {
      type: "figma",
      url: "",
    },
  },
  args: {},
} as Meta<typeof {{ inputs.name | pascal }}>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

```

# `{{ inputs.name | pascal }}/index.ts`

```typescript
export { {{ inputs.name | pascal }} } from "./{{ inputs.name | pascal }}";

```
