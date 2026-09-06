# Kova AI workspace plan

## What will be built
- A chat-first interface with separate saved conversations for different topics.
- New chat, chat history selection, rename-on-first-message, and delete-all controls.
- Responsive upload flow inside the composer:
  - files up to 100 MB
  - videos up to 200 MB
  - up to 20 photos in one selection
  - previews for images, video, audio, and documents
  - basic browser-side photo/video controls where supported
- Attachment-aware AI requests with safe client-side validation and a clear unsupported-format state.
- A separate Build workspace with code editing, preview, and developer-focused prompts.
- Low-cost defaults: keep the existing Gemini gateway model, send only the relevant text/attachment context, and avoid mock “finished” media processing.

## Technical details
- Keep TanStack Start and the existing server-side AI gateway boundary.
- Use browser storage for saved chats initially so the app remains free and works without auth; keep the state model ready for Cloud persistence later.
- Store attachment metadata and local preview references per chat, not raw large files in chat history.
- Keep large upload validation in the browser and do not send 100–200 MB blobs through the AI text endpoint.
- Add AI Elements primitives for the transcript, messages, prompt input, and loading state before composing the updated chat surface.
- Verify the streaming request, file limits, chat switching, delete-all, build preview, and mobile layout before completion.
