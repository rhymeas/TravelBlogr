# AI Communication System

## Quick Setup

**For Augment:**
When you need a decision, write to `.ai-communication/augment_question.md`:

```
## Context
[what you're working on]

## Question  
[specific question]

## Proposed Action
[what you want to do]
```

Then tell user: "Question ready for Claude"

**For User:**
When Augment says "Question ready", tell Claude Desktop: "Check question and respond"

When Claude says "Response ready", tell Augment: "Read response"

## Files
- `augment_question.md` - Augment writes here
- `claude_response.md` - Claude writes here
- `README.md` - This file

That's it!
