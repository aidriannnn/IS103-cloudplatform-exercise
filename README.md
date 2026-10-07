# Jade's Calculator

A fast calculator in plain HTML, CSS and JavaScript — no build step.

**Features:** + − × ÷ · percent · sign change · backspace · history (saved in the browser; select an entry to reuse it) · full keyboard support · light and dark themes · works on phones.

Keyboard: digits, `+ - * /`, `.`, `Enter` or `=` to calculate, `Backspace` to delete, `Esc` to clear, `%` for percent.

## Deploy to Vercel from GitHub

1. Create a new GitHub repository and push these files:
   ```bash
   git init
   git add .
   git commit -m "Jade's Calculator"
   git branch -M main
   git remote add origin https://github.com/<your-username>/jades-calculator.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new and import the repository.
3. Leave **Framework Preset** as "Other". Leave Build Command and Output Directory empty.
4. Select **Deploy**. Every push to `main` redeploys automatically.

## Run locally

Open `index.html` in a browser, or run `npx serve .`.
