# Professor Calculus — Project Status

A running record of work done on this project, decisions made, and open questions.

## Log

### 2026-10-01

- Added the `prof_calculus_proj/` folder to the parent `math_and_AI_seminar` git repo (commit `ad847b7`). The project is tracked as a subfolder of that repo for now. It can be split into its own repo later if needed (e.g. for deployment).
- Started choosing which AI platform will power Professor Calculus. No decision yet; the options under consideration are described below.

### 2026-10-02

- Ruled out building Professor Calculus as a Gemini Gem: Gems are not available in the instructor's Edu account.

## Options under consideration: which AI platform?

Both options depend on the same core piece of work: a written set of instructions that defines Professor Calculus and his rules. These include asking questions on a student-chosen range of material, starting easy and gradually increasing difficulty, and giving feedback until the student's answer is acceptable. Those instructions can be carried from one option to another with little change.

### Option 1: Custom web app using an AI API (e.g. the Gemini API)

A web app built in this project. It sends student messages, along with the Professor Calculus instructions (the "system prompt"), to an AI model through its API. The surrounding code (the "harness") manages the conversation and can enforce rules such as difficulty level and topic range.

- **Pros:** Full control over the interface and logic. Proper math rendering is possible, as is logging of student progress.
- **Cons:** Students' Gemini accounts do not cover API usage; the instructor pays for the API (or uses a free tier). Requires hosting, authentication, and keeping the API key secret.
- **Privacy concern:** Free-tier API data may be used by the provider to improve its products. This needs to be checked against FERPA before students use it; a paid tier or Vertex AI is likely required.

### Option 2: Claude, using students' own Claude subscriptions

The original idea was that students sign in to the app with their paid Claude accounts. As far as we currently know, this is not permitted: Anthropic does not allow third-party apps to use Claude.ai subscriptions. Third-party apps must use the Claude API, billed separately to the owner of the API key. (Not yet verified against Anthropic's current terms.)

Two Claude-based variants that may work instead:

- **2a. Claude Project:** custom instructions and reference files set up in Claude.ai, with no code. Sharing a Project with others may require a Team or Enterprise plan (unverified).
- **2b. AI-powered Claude artifact:** a small web app hosted on Claude.ai that calls Claude itself. Usage is believed to count against each viewer's own Claude account rather than the creator's. Current details are unverified: supported plans, usage limits, instructor visibility.

- **Main drawback:** Most students do not have Claude subscriptions.

### Current leaning

No decision yet.

## Open questions

- What are the current Anthropic rules and plan requirements for Claude Projects sharing and AI-powered artifacts?
- If we build a custom app (Option 1), which API tier satisfies FERPA requirements?
