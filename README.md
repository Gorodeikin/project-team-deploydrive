# DeployDrive (Подорожники)

DeployDrive is a full-stack travel story platform: an educational team project completed during the GoIT Full Stack Developer course, later independently maintained and extended.

## Links

|                                 |                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Live Demo                       | [project-team-deploydrive.vercel.app](https://project-team-deploydrive.vercel.app)                          |
| Maintained Frontend             | [github.com/Gorodeikin/project-team-deploydrive](https://github.com/Gorodeikin/project-team-deploydrive)    |
| Maintained Backend              | [github.com/Gorodeikin/nodejs-deploydrive](https://github.com/Gorodeikin/nodejs-deploydrive)                |
| Original Team Frontend          | [github.com/elentr/project-team-deploydrive](https://github.com/elentr/project-team-deploydrive)            |
| Original Team Backend           | [github.com/elentr/nodejs-deploydrive](https://github.com/elentr/nodejs-deploydrive)                        |
| Upstream Frontend Pull Requests | [elentr/project-team-deploydrive pulls](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr) |
| Upstream Backend Pull Requests  | [elentr/nodejs-deploydrive pulls](https://github.com/elentr/nodejs-deploydrive/pulls?q=is%3Apr)             |

## Project Origin and Attribution

DeployDrive started as a team educational project completed during the GoIT Full Stack Developer course. The original team source and full contribution history remain available in the upstream frontend and backend repositories linked above.

The current repository is Sergii Gorodeikin's maintained version of the original team frontend. Detailed individual contributions are available in the upstream pull-request history.

## Original Team and Verified Contributions

DeployDrive was developed by the contributors listed below. The descriptions summarize verifiable work visible in the upstream pull-request history; they do not assign official roles or exclusive ownership of the final components. Some submitted work was later integrated through other branches or remained in open pull requests.

- **[@elentr](https://github.com/elentr)** — frontend foundation and integration: loader, fonts/modern-normalize, base/global styles, SVG sprite, authentication/API routing; backend dependency setup and repository cleanup.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3Aelentr) · [Backend PRs](https://github.com/elentr/nodejs-deploydrive/pulls?q=is%3Apr+author%3Aelentr)

- **[@YanaVivcharuk](https://github.com/YanaVivcharuk)** — confirmation modal UI and related modal updates.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3AYanaVivcharuk)

- **Sergii Gorodeikin ([@Gorodeikin](https://github.com/Gorodeikin))** — responsive Header and navigation; Hero, About, Join and homepage integration; Our Travellers and TravellerCard improvements; frontend fixes and integration work; backend OpenAPI/Swagger corrections and categories API work.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3AGorodeikin) · [Backend PRs](https://github.com/elentr/nodejs-deploydrive/pulls?q=is%3Apr+author%3AGorodeikin)

- **[@AlenaSh83](https://github.com/AlenaSh83)** — Footer implementation and related authenticated-state behavior.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3AAlenaSh83)

- **[@aklsh958](https://github.com/aklsh958)** — Popular Stories section with pagination and styling; submitted work on story-card bookmark behavior and API integration.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3Aaklsh958)

- **[@Roksolana-Bilous](https://github.com/Roksolana-Bilous)** — backend user/story routing; submitted frontend work on story pages and routes.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3ARoksolana-Bilous) · [Backend PRs](https://github.com/elentr/nodejs-deploydrive/pulls?q=is%3Apr+author%3ARoksolana-Bilous)

- **[@DarynaD11](https://github.com/DarynaD11)** — TravellerInfo, public traveller profile and MessageNoStories; story-card refinements and story filtering.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3ADarynaD11)

- **[@herdssman](https://github.com/herdssman)** — submitted work on TravellersList/pagination and the story-editing page.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3Aherdssman)

- **[@Anastasia1102](https://github.com/Anastasia1102)** — initial AddStoryPage styling and form logic; initial backend/server implementation covering authentication, users, stories and API documentation.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3AAnastasia1102) · [Backend PRs](https://github.com/elentr/nodejs-deploydrive/pulls?q=is%3Apr+author%3AAnastasia1102)

- **[@Antoxa72009](https://github.com/Antoxa72009)** — TravellersStories components and related story-list work.
  [Frontend PRs](https://github.com/elentr/project-team-deploydrive/pulls?q=is%3Apr+author%3AAntoxa72009)

## My Contribution During the Original Team Project

**Frontend**

- Responsive Header and navigation
- Hero, About and Join homepage sections, and homepage integration
- Our Travellers homepage section
- TravellerCard and related traveller-list improvements

**Backend**

- OpenAPI/Swagger corrections
- Categories API route and related documentation

## Independent Maintenance After the Course

After the original team project was completed, I independently maintained, debugged, and extended my version of the application. Work is grouped below by area; a detailed change history is available in the maintained frontend repository's commit log.

**API integration**

- Connected the frontend to a maintained backend deployment and centralized API configuration

**Authentication**

- Repaired authentication, session restoration, refresh flow and return-path behavior

**Stories**

- Added a public story detail page and completed story create/edit flows against the maintained API
- Repaired save/unsave behavior and added the paginated saved-stories backend endpoint

**Profiles**

- Added own-profile saved/own story tabs
- Added avatar upload and profile details editing
- Repaired own-profile and public-traveller navigation

**Production reliability**

- Fixed image configuration, responsive issues and production regressions
- Completed a final production audit across mobile, tablet and desktop viewports

## Current Functionality

- Registration, login, logout and restored sessions
- Story browsing/filtering and public story details
- Authenticated story publishing and owner-only editing
- Story save/unsave
- Public traveller profiles
- Own-profile avatar and details editing
- Saved stories and own stories tabs
- Responsive layouts

## Tech Stack

**Frontend**

- Next.js, React, TypeScript
- CSS Modules
- Zustand
- TanStack Query
- Axios
- Formik with Yup validation

**Backend**

- Node.js, Express, MongoDB (Mongoose)
- Token-based session authentication (server-side session storage with access/refresh tokens)
- Cloudinary
- OpenAPI/Swagger

## Architecture / Repository Split

The frontend and backend are maintained in separate repositories (see [Links](#links) above). This repository contains the Next.js frontend only; the backend lives in the maintained backend repository.

## Local Setup

```bash
git clone https://github.com/Gorodeikin/project-team-deploydrive.git
cd project-team-deploydrive
npm install
cp .env.example .env.local
npm run dev
```

Available scripts:

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint

Environment variables (`.env.local`, based on `.env.example`):

- `NEXT_PUBLIC_API_URL` — public origin of the backend API, no trailing slash (e.g. `https://deploydrive-api.onrender.com`)

For backend setup, see the [maintained backend repository](https://github.com/Gorodeikin/nodejs-deploydrive).

## Project Status

Status: maintained portfolio project / educational team project. The current version has been checked at 375px, 768px and 1440px viewports; this is not a guarantee of complete freedom from defects.
