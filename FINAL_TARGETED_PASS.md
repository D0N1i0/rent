Final targeted completion pass

What was improved in this pass
- Added missing `next-env.d.ts`.
- Wired public layout header/footer to shared public settings.
- Refactored homepage to consume admin-managed homepage settings for hero, airport CTA, and contact CTA instead of leaving those sections mostly hardcoded.
- Expanded homepage admin editor to cover hero badge/stats, airport copy/fees, and contact CTA copy.
- Upgraded settings API from update-only to upsert behavior so homepage keys can be created cleanly from admin.
- Upgraded contact inbox UX with search, status filters, reply shortcut, archive action, and cleaner triage flow.
- Added stronger shared setting typing in `src/lib/settings.ts`.

Technical blocker encountered during verification
- Dependency installation from this ZIP was unstable in the container environment: modules intermittently resolved and then disappeared between installs, which broke trustworthy verification of Prisma generation and Next build.
- Because of that instability, I could not honestly certify a final green `prisma generate` + `next build` from this environment.

Recommended local verification order
1. Delete `node_modules` and any existing lockfile if your machine inherited a broken install state.
2. Run `npm install` from a clean terminal.
3. Run `npx prisma generate`.
4. Run `npm run type-check`.
5. Run `npm run build`.

Files primarily touched in this pass
- `next-env.d.ts`
- `src/lib/settings.ts`
- `src/app/(public)/layout.tsx`
- `src/components/layout/site-header.tsx`
- `src/app/(public)/page.tsx`
- `src/components/home/hero-section.tsx`
- `src/components/home/airport-section.tsx`
- `src/components/home/contact-cta.tsx`
- `src/app/api/admin/settings/route.ts`
- `src/components/admin/homepage-admin-client.tsx`
- `src/components/admin/contact-submissions-admin-client.tsx`
