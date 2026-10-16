<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep demonstration conversations in React state and the pending home message in tab-local module memory only, so navigation works without storing personal information.
- Reuse TopicIcon and the shared Button for topic symbols and form actions, so icons render consistently and controls retain accessible focus states.
- Key each topic conversation by its slug, so changing categories resets the demonstration to the correct introduction and replies.
- Keep the offline responder in a browser-safe conversation module with a full-history request contract, so a future AI adapter can replace it without changing the presentation or storing messages.
- Compose the conversation with AI Elements and the shared Button underneath its form actions, so markdown, scrolling and multiline input have consistent accessible foundations.
- Keep conversation principles and the future system prompt in src/lib/conversation-principles.ts, so the demo responder and a future AI adapter share one source of rules.
