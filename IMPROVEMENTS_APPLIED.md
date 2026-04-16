# Improvements Applied

## High-impact fixes completed

- Pinned `next-auth` to `5.0.0-beta.25` to avoid the `nodemailer` peer dependency conflict during install.
- Added the missing admin car edit page at `/admin/cars/[id]/edit`.
- Upgraded the admin car form so vehicles can store and manage multiple image URLs.
- Added image preview/removal UX in the admin car form.
- Updated admin car create API to save `CarImage` records transactionally.
- Updated admin car update API to keep image records in sync and regenerate a unique slug safely.
- Updated admin car delete API to clean up related images before deleting a vehicle.
- Improved the admin cars table so it shows the primary car image instead of only a placeholder icon.

## What to do locally after extracting

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Set `DATABASE_URL`, `NEXTAUTH_SECRET`, and mail settings if needed
4. Run `npx prisma generate`
5. Run `npx prisma db push`
6. Run `npm run db:seed`
7. Run `npm run dev`
