# Question from Augment

**Status:** EMPTY

---

## 🤖 For Augment: How to Ask Questions

When you need a decision, write here and change Status to `WAITING_FOR_CLAUDE`

The bridge will auto-detect and respond!

## Format:

**Status:** WAITING_FOR_CLAUDE

## Context
[What you're working on]

## Question
[Specific question]

## Proposed Action
[What you want to do]

## Options (if applicable)
1. [Option A]
2. [Option B]

---

## Example:

**Status:** WAITING_FOR_CLAUDE

## Context
Implementing user authentication for TravelBlogr API

## Question
Should I use JWT tokens or session-based authentication?

## Proposed Action
Use JWT with access tokens (15min) and refresh tokens (7 days) in httpOnly cookies

## Options
1. JWT (stateless, scalable)
2. Sessions (simpler, server-side control)
3. Hybrid approach
