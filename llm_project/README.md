# Build Your Own LLM — course project

Work for the guided project at
https://katestange.net/ai/course/llm-course/project/ : a small character-level
GPT trained on Shakespeare, built up across eight steps, one Colab notebook
per step.

## Layout

    notebooks/   the Colab notebooks, one per step (step1_bigram.ipynb, ...)
    notes/       hand derivations, scratch notes, capstone planning

## Moving notebooks between Colab and this repo

The repo is the single copy both sides work from.

- **Colab → repo:** in Colab, *File → Save a copy in GitHub*, choose
  `JosephMacula/math_and_AI_seminar`, branch `main`, and the path
  `llm_project/notebooks/<name>.ipynb`. Then `git pull` in the codespace.
- **Repo → Colab:** push from the codespace, then open
  `https://colab.research.google.com/github/JosephMacula/math_and_AI_seminar/blob/main/llm_project/notebooks/<name>.ipynb`
- Leave "Include a link to Colaboratory" ticked if you like; it only adds a
  badge cell.

Pull before you start editing on either side, so the two copies never diverge.

## Course rule on AI assistants

AI help is limited to syntax and error messages; the core implementations
(autodiff, attention, GPT, BPE, ...) are written by hand.

## Progress

| Step | Deliverable                                   | Notebook | Status      |
|------|-----------------------------------------------|----------|-------------|
| 1    | Character bigram model from counts            |          | not started |
| 2    | Hand-wired ReLU classifier; trained bigram    |          | not started |
| 3    | Scalar autodiff engine; n-gram MLP            |          | not started |
| 4    | Causal self-attention head                    |          | not started |
| 5    | Full GPT architecture                         |          | not started |
| 6    | Training pipeline (AdamW, schedules, clipping)|          | not started |
| 7    | BPE tokenizer and sampler                     |          | not started |
| 8    | Capstone experiment                           |          | not started |
