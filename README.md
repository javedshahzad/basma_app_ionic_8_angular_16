# Basma (بصمة)

A school attendance and management app for teachers, school admins, moderators, parents and students — attendance/delay tracking, class rosters, bulletins, gamified student engagement, and messaging. Built as an Ionic Angular app, shipped to Android/iOS via Capacitor and to the web.

## Tech stack

* Angular 16.2
* Ionic 8 (`@ionic/angular`)
* Capacitor 8 (Android + iOS native shells)
* TypeScript 5.1
* `ngx-translate` (Arabic/English i18n)
* Karma/Jasmine for unit tests

Node 18 LTS is recommended (matches Angular 16's supported range: `^16.14.0 || ^18.10.0`). Ionic CLI 7.

> The app was originally built on Ionic 6 / Angular 14 — it has since been upgraded. If you see references to those versions elsewhere (comments, old docs), they're stale.

## Getting started

```bash
npm install
ionic serve        # or: ng serve
```

Runs against `environment.ts`'s `serverURL` (see below) — there is currently no local/mock backend, so the dev server talks to the real API.

### Environment configuration

Two environment files control runtime config: `src/environments/environment.ts` (dev builds) and `environment.prod.ts` (`ng build --configuration=production`, swapped in via `angular.json`'s `fileReplacements`).

| Key | Purpose |
|---|---|
| `serverURL` | Base URL of the backend REST API (`BasmaCP/app_service_new/`). Both dev and prod currently point at the same production backend — there is no separate staging/dev API. |
| `docUrl` | Base URL for server-hosted documents/uploads (images, PDFs) referenced by relative path in API responses. |
| `lang_code` | Default language code sent to the backend. |
| `ipinfoToken` | Token for the ipinfo.io geolocation lookup used during registration flows. |
| `sentryDsn` | Sentry project DSN for crash/error reporting, read in `main.ts`. **Known issue:** dev and prod currently share the same DSN, so local development errors report into the same Sentry project as production. If you're debugging locally, expect noise there, or blank out `sentryDsn` in your local `environment.ts` (uncommitted) to silence it. |

None of these are build-time secrets in the traditional sense (they all ship inside the client bundle), but treat `sentryDsn` as environment-specific rather than copy-pasting the same value everywhere.

## Project structure

```
src/app/
  <feature>/              # ~90 page folders, one per route (e.g. classlist/, add-user/, settings/)
    <feature>.page.ts
    <feature>.page.html
    <feature>.module.ts          # NgModule-declared pages (most)
    <feature>.page.spec.ts
  components/               # Shared/reusable components, mostly standalone
  service/                  # ~40 injectable services — see below
  model/                    # Shared TS interfaces (e.g. ApiResponse)
  pipes/                    # Shared pipes
  guard/                    # Route guards
  constants/                 # Shared constant/lookup data
  MyInterceptor.ts           # Single HttpInterceptor: auth params, timeout, retry/backoff, error toasts
  app.component.ts           # Root shell: side menu, push notifications, deep links, session bootstrap
```

Most pages are plain NgModule-declared components (`declarations:` + a routing module); newer/refactored ones are `standalone: true`. Both patterns currently coexist — see the codebase review notes if picking this up.

TypeScript path aliases (`tsconfig.json`) are available and preferred over relative `../../../` imports in new code:

```
@app/*         → src/app/*
@services/*    → src/app/service/*
@components/*  → src/app/components/*
@pipes/*       → src/app/pipes/*
@guard/*       → src/app/guard/*
@model/*       → src/app/model/*
@env/*         → src/environments/*
```

### Backend & auth

The backend is a REST API at `{serverURL}` (PHP-style endpoints, not OpenAPI-documented anywhere in this repo). All requests go through `ApiClient` (`service/api-client`), which the ~40 `*-api.service.ts` files wrap per domain (e.g. `auth.service.ts`, `reports-api.service.ts`, `student-engagement.service.ts`). `MyInterceptor` attaches `uuid`/`user_no` to authenticated POST requests, applies a 30s timeout, and retries `429`/`503` with exponential backoff (deliberately **not** retrying on `status === 0`, since that also fires on navigation-cancelled requests, not just real connectivity loss).

Session state lives in `StorageService` (a thin wrapper over `@ionic/storage-angular`'s `Storage` — note this re-exports `@ionic/storage`'s `Storage` class under the hood, they're the same DI token). `AuthService` and `DataService` are the two root-provided services most pages depend on.

Roles are represented as string `user_type` codes checked ad hoc throughout templates/components (`'1'` = admin, `'2'` = teacher, `'3'` = moderator, `'4'` = parent, `'7'` = viewer, `'8'` = student) — there's no shared enum for these yet, so grep for the literal string when tracing role-gated behavior.

## Testing

```bash
npm test            # ng test — Karma/Jasmine, headless Chrome by default in CI-style runs
```

Add `--watch=false --browsers=ChromeHeadless` for a single non-interactive run. Test coverage is "does this component construct without throwing" style (`should create`) rather than behavior-level, but every spec exercises real DI wiring against realistic mocked data — several genuine null-safety bugs in production code have been caught this way (see git history).

There is no E2E suite currently wired up — `protractor` is listed as the `e2e` script's tool but is deprecated and unused; ad hoc Playwright scripts against a locally-served production build have been used for manual smoke verification instead.

`npm run lint` is configured (`@angular-eslint`) but currently broken (parser/TS version mismatch — fails on every file). Don't rely on it as a signal until that's fixed.

## Building

```bash
ng build --configuration=production   # outputs to www/
```

### Android

```bash
ionic build
npx cap sync android
npx cap open android
```

Release builds need a signing keystore configured in `android/app/build.gradle` (keystore path/passwords) — do **not** commit keystores or passwords to the repo; use `android/keystore.properties` (gitignored) or CI secrets instead. To generate a new key:

```bash
keytool -genkey -v -keystore <name>.keystore -alias <alias> -keyalg RSA -keysize 2048 -validity 20000
```

**Known Android build issue:** `Could not find com.commit451:PhotoView:1.2.4` — fix by editing `node_modules/com-sarriaroman-photoviewer/src/android/photoviewer.gradle` and replacing the PhotoView dependency line with:

```groovy
implementation 'com.github.chrisbanes.photoview:library:1.2.4'
```

(This is a `node_modules` patch, so it doesn't survive a clean `npm install` — worth turning into a `postinstall` patch via `patch-package` if it keeps recurring.)

## Contributing

* Prefer path aliases (`@services/...`) over relative imports in new/touched files.
* New pages/components should use `ChangeDetectionStrategy.OnPush` with `ChangeDetectorRef.markForCheck()` after async state updates (`.then()`, `.subscribe()`, `await`, `setTimeout`/`setInterval`) — most of the app has been migrated to this; a handful of large, high-traffic pages (`classlist`, `list-student`, `students`, `student-detail`) are deliberately excluded pending a closer look.
* Run `npm test` before pushing — there is no CI enforcing this yet, so it's on you.
* Avoid introducing new `any` typing where a real shape is knowable; there's an existing, tracked backlog of loosely-typed code but new code shouldn't add to it.
