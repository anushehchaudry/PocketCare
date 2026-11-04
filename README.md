# PocketCare

**A personal assistant for the paperwork side of healthcare.** You upload a medical bill or an insurance plan and PocketCare explains it in plain, friendly language. You can then ask follow-up questions about your own documents.

**Try it:** run the Django API and the Next.js front end locally (see below). The front end was deployed to Vercel during development, but the API isn't hosted, so that deployment can't sign in.

![PocketCare screenshot](<Screenshot 2025-01-21 at 10.00.55 PM.png>)

## Features

- **Medical bill breakdown.** Upload a PDF bill and get a plain-language summary: total charges, what insurance covered, adjustments, what you still owe, and a visit-by-visit explanation. You can then ask follow-up questions about that bill.
- **Insurance plan comparison.** Upload plan documents (such as Summaries of Benefits) and ask about deductibles, coverage, and how the plans differ for someone with your health profile.
- **Health questionnaire.** A short intake (medications, employment status, and similar) personalizes every analysis.
- **Document library.** Saved bills and analyses live on a "View docs" page, where you can reopen or delete them.
- **Accounts and profiles.** Register, log in, edit, or delete your profile.

## How it works

```
PDF upload ──► Google Document AI (OCR + layout)
           ──► de-identification (Microsoft Presidio + custom recognizers)
           ──► Gemini 1.5 Flash with task-specific system prompts
           ──► structured explanation saved to the user's documents
```

Bill text is de-identified (names, account numbers, and so on removed) **before** it reaches the language model. Raw documents do pass through Document AI for OCR first, and follow-up questions are sent to the model as written, so use sample bills, not real ones.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Django 4 + Django REST Framework (session auth, CSRF) |
| AI / document processing | Google Document AI, Gemini 1.5 Flash, Microsoft Presidio |
| Hosting | Vercel (front end, during development) |

## Repository layout

```
healthcare-app/   Next.js frontend (dashboard, upload-bill, compare-insurance, questionnaire, profile, view-docs)
django/           Django API (example/ app: views, models, Document AI + Gemini pipeline)
```

## Running locally

**Backend**
```bash
cd django
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# create django/.env with: PROJECT_ID, LOCATION, PROCESSOR_ID, GEMINI_API_KEY
python manage.py migrate
python manage.py runserver
```

**Frontend**
```bash
cd healthcare-app
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

## Team

Built by
**Neha Vinjapuri · Sarah Barragan · Anusheh Chaudry · Aakriti Lakshmanan**.

*PocketCare is a prototype and is not medical, legal, or financial advice.*
