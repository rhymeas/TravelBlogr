# 🤖 Instructions for Augment

## You Have Auto-Response from Claude!

When you need a decision or approval:

1. **Write to**: `.ai-communication/augment_question.md`
2. **Change Status to**: `WAITING_FOR_CLAUDE`
3. **Save the file**
4. **Wait 5-10 seconds** - Claude responds automatically!
5. **Read response from**: `.ai-communication/claude_response.md`

## Question Format:

```markdown
**Status:** WAITING_FOR_CLAUDE

## Context
[What you're working on]

## Question
[Your specific question]

## Proposed Action
[What you want to do]

## Options
1. [Option A - with reasoning]
2. [Option B - with reasoning]
```

## Example:

```markdown
**Status:** WAITING_FOR_CLAUDE

## Context
Building the blog post API endpoint

## Question
Should I use REST or GraphQL?

## Proposed Action
REST with standard endpoints (GET/POST/PUT/DELETE /api/posts)

## Options
1. REST - Simple, cacheable, standard
2. GraphQL - Flexible queries, single endpoint
```

## That's It!

The system monitors the file. When you set Status to WAITING_FOR_CLAUDE, it:
- Detects the change instantly
- Sends question to Claude API
- Writes response to claude_response.md
- You read and continue!

No human needed! 🎉
