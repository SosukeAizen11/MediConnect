# AI Boundary Contract (Preparation Only)

This document is an architectural boundary contract for the current AI orchestration layer. It is intentionally not a final AI module extraction. The purpose is to make the current responsibilities explicit and lower the risk of a future module extraction.

## Scope

The current AI runtime supports two active operation families:

1. Report analysis
2. Receptionist booking orchestration

These responsibilities are AI-specific and should remain separated from domain persistence and business logic.

## AI-owned responsibilities

AI owns:

- prompt construction and LLM interaction
- report text extraction and OCR/PDF parsing
- AI-generated report summarization
- AI receptionist intent extraction from user conversations
- TTS output generation for receptionist responses
- AIInsight persistence

AI does not own:

- report persistence
- appointment creation
- appointment availability logic
- scheduling rules
- doctor identity data
- patient identity data
- domain validation beyond AI-use-specific checks

## Minimum future public API

The intended future AI facade should expose only these capabilities:

- analyzeReport
- chatWithReceptionist

The public AI contract must not expose:

- models
- repositories
- database operations
- Scheduling business logic
- Reports persistence operations
- Identity internals
- raw LLM provider internals

## Domain facade dependencies

AI is allowed to depend on these domain facades:

- Reports facade: `getReportForPatient`
- Identity facade: `findDoctorById`
- Scheduling facade: `bookAppointment`

AI must not import domain models directly, including:

- Report model
- User model
- Doctor model
- Appointment model
- Token model
- Clinical models

## Current runtime ownership

### Report analysis

- route: `/api/v1/ai-insights/analyze-report/:reportId`
- controller: `analyzeReport`
- flow: AI receives `reportId`, obtains patient-scoped report through Reports facade, validates ownership, downloads file, extracts text, calls LLM, stores `AIInsight`

### Receptionist booking

- route: `/api/v1/ai-receptionist/chat`
- controller: `chatWithReceptionist`
- flow: AI interprets conversation intent, gathers date/time, calls Identity facade to resolve doctor, delegates appointment creation to Scheduling facade

## AI infrastructure boundary

The following artifacts are AI infrastructure and should remain grouped as such until extraction:

- `groqClient.js` — Groq LLM adapter
- `elevenlabsClient.js` — text-to-speech adapter
- `geminiClient.js` — dormant alternate provider stub; not active
- OCR / PDF parsing logic in the report analysis controller

These are AI-specific infrastructure concerns and must not be treated as domain logic.

## Future extraction target (not yet created)

The future extracted AI module should conceptually resemble:

modules/ai/
├── index.js
├── controllers/
├── routes/
├── services/
├── models/
│ └── AIInsight.model.js
└── infrastructure/
├── groqClient.js
├── elevenlabsClient.js
└── geminiClient.js

This is a target structure only. It is not an instruction to create the module now.

## Non-goals for this preparation sprint

This document does not authorize:

- new AI features
- prompt redesigns
- provider changes
- Redis/Kafka/event bus work
- microservice extraction
- domain refactor work
- authorization redesign
- AI-specific domain logic creation

## Stability requirement

The existing route contracts must remain frozen during this preparation phase:

- `POST /api/v1/ai-insights/analyze-report/:reportId` with `protect` + `authorize('PATIENT')`
- `POST /api/v1/ai-receptionist/chat` with `protect`

No behavior changes are intended here.
