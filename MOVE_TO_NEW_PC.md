# Moving this project to a new PC

Follow these steps in order. Do the "old PC" part first.

## What comes with git, and what does not

| Item | Comes with `git clone`? |
| --- | --- |
| All code, `CLAUDE.md`, `PORTFOLIO_SPEC.md` | Yes |
| `.env` (Supabase URL and key) | No, it is gitignored |
| `.claude/skills/` (installed skills) | No, it is gitignored |
| Claude chat history and memory | No, it is stored outside the project |

A fresh `claude` session still knows the project, because `CLAUDE.md` holds the phase notes.
The old chat history only comes if you copy it by hand (Part 3).

---

## Part 1: On the OLD PC

1. Make sure everything is pushed:
   ```
   git status
   git push
   ```
   `git status` should say the branch is up to date with `origin/main`.

2. Copy these to a USB drive or cloud folder (do not push them to GitHub):
   - `.env` from the project root
   - the `.claude` folder from the project root (the skills)
   - (optional, for chat history) this folder:
     `C:\Users\Administrator\.claude\projects\c--Users-Administrator-Desktop-Yunus-Zanzibar-Portfolio`

## Part 2: On the NEW PC

1. Install:
   - Git
   - Node.js 22.9 or newer
   - Claude Code (the VS Code extension or the CLI), then sign in

2. Clone and install:
   ```
   git clone https://github.com/yunuszanzi/Yunus-Zanzibarwala-Portfolio.git
   cd Yunus-Zanzibarwala-Portfolio
   npm install
   ```

3. Put the copied `.env` and `.claude` folder in the project root.

4. Check it works:
   ```
   npm run dev
   ```

5. Open the project folder in VS Code and start `claude`. It reads `CLAUDE.md` automatically.

## Part 3 (optional): Bring the old chat history

1. On the new PC, open the project folder and run `claude` once, then send any message (e.g. "hi") and close it.
   This creates the history folder with the right name for the new path.
2. Find it here (the folder name is the project path with `\`, `:` and spaces replaced by `-`):
   ```
   C:\Users\<NewUsername>\.claude\projects\
   ```
   Open the newest folder in that list. That is the one for this project.
3. Copy the `.jsonl` files and the `memory` folder from the old history folder into it.
4. Run `claude --resume` in the project folder and pick the old session.
   `claude --continue` resumes the most recent one.

If you skip Part 3, nothing is lost. You just start a new chat with the same project knowledge.

## Notes

- Never push `.env`. It is already gitignored.
- If the new PC has a different folder path or Windows username, that is fine. Step 1 of Part 3 handles it.
