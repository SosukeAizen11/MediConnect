# AI Infrastructure Boundary

This folder is a documentation boundary only. It is not a full AI module extraction.

The purpose of this boundary is to clearly identify AI-specific infrastructure concerns while leaving domain logic in its own modules.

## Included infrastructure

- Groq LLM access (`groqClient.js`)
- ElevenLabs TTS (`elevenlabsClient.js`)
- Gemini provider stub (`geminiClient.js`)
- OCR/PDF parsing used by the report analysis flow

## Notes

- Gemini is dormant and intentionally not activated.
- These files are infrastructure consumed by AI orchestration, not domain business logic.
- Their runtime behavior must remain unchanged while boundaries are clarified for a future extraction.

## Dependency direction

AI orchestration -> domain facades + AI infrastructure

Not allowed:

- domain modules depending on AI internals
- AI infrastructure being treated as a domain service
- AI-specific database logic being placed in domain modules

## Important constraint

This is preparation only. No final AI module is being created here.
