# VELOOP Rewards — Giveaway Frontend

A production-style React/Vite frontend for the VELOOP Rewards giveaway experience. The implementation is intentionally backend-ready: giveaway configuration, prize types, currencies, winner records and participation data are modeled as API-shaped objects instead of being scattered through UI components.

> **Demo data notice:** all users, balances, participants, winners and statistics in this repository are fictional frontend development data. Winner announcement messages are explicitly labelled as demo activity.

## Features

- Premium VELOOP-branded giveaway landing page
- Active, ended and upcoming lifecycle states
- Live countdown that automatically reaches the ended UI
- Six configurable prizes using the supplied assets
- Prize-specific entry currencies and fees: VEs, SVEs and Tokens
- Balance verification and insufficient-balance states
- Login requirement before participation
- Entry confirmation modal with balance-after-joining calculation
- Successful participation state
- Duplicate-participation prevention in demo state
- Winner announcement slider with pause-by-hover-friendly static interaction and manual dots
- Winners / Previous Winners tabs
- Masked winner IDs for privacy
- Winner-specific claim experience
- Physical-prize claim form
- Digital/gift-card email claim form
- Claim states: not submitted, submitted, processing, completed, expired
- How-to-participate timeline
- Trust/transparency section
- Expandable rules and FAQ
- Responsive desktop/tablet/mobile layouts from 320px+
- Keyboard focus states, semantic buttons, labels, alt text and dialog semantics
- Demo state switcher for QA
- API boundary ready for future backend integration

## Demo state URLs

The demo selector is available in the top navigation, or use query parameters:

- `/giveaway` — automatic lifecycle based on the configured end time
- `/giveaway?demo=visitor` — unauthenticated visitor
- `/giveaway?demo=newuser` — logged-in user who has not joined
- `/giveaway?demo=participant` — participating user
- `/giveaway?demo=winner` — ended event with matching winner state
- `/giveaway?demo=nonwinner` — ended event without a matching winner
- `/giveaway?demo=ended` — ended giveaway / winner history
- `/giveaway?demo=upcoming` — upcoming state

Every prize has its own details page, for example `/giveaway/iphone-15-pro`.

For claim testing, open a prize detail route with `?demo=winner`, e.g. `/giveaway/apple-watch?demo=winner`.

## Technology

- React 19
- Vite
- React Router
- Bootstrap 5
- CSS Modules
- React Hooks
- Lucide React
- Native CSS animations

## Installation

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Folder structure

```text
src/
├── assets/                    # supplied giveaway artwork
├── components/
│   ├── Countdown/
│   ├── FAQ/
│   ├── GiveawayHero/
│   ├── GiveawayRules/
│   ├── GiveawayStats/
│   ├── HowToParticipate/
│   ├── JoinConfirmation/
│   ├── PrizeCard/
│   ├── PrizeClaimModal/
│   ├── TrustSection/
│   ├── WinnerSlider/
│   └── WinnersTabs/
├── data/
│   └── giveawayData.js        # API-shaped mock configuration
├── hooks/
│   └── useCountdown.js
├── pages/
│   └── Giveaway/
│       ├── GiveawayHome.jsx
│       ├── GiveawayDetails.jsx
│       └── Giveaway.module.css
├── services/
│   └── giveawayApi.js         # backend integration boundary + demo persistence
├── styles/
│   └── global.css
└── utils/
    └── giveawayStatus.js
```

## Architecture

`giveawayData.js` contains the demo domain model. Components receive `giveaway`, `prize`, `winner` and `user` objects through props. `giveawayApi.js` acts as the future API adapter.

The intended backend mapping is:

```text
GET  /giveaways/current
GET  /giveaways/:id
GET  /giveaways/:id/winners
GET  /giveaways/previous
GET  /giveaways/my-status
POST /giveaways/:id/join
POST /giveaways/:id/claim
```

Replacing the demo service implementation with HTTP calls should not require rewriting the presentation components.

## Prize model

Each prize contains:

- `id`
- `slug`
- `position`
- `name`
- `description`
- `image`
- `winnerCount`
- `participants`
- `prizeType`
- `claimType`
- `entry.currency`
- `entry.amount`
- `fulfillment`

Supported prize types are `PHYSICAL`, `GIFT_CARD` and `DIGITAL`.

## Entry configuration

| Reward | Entry |
|---|---:|
| iPhone 15 Pro | 250 VEs |
| Apple Watch | 200 VEs |
| AirPods Pro | 500 SVEs |
| ₹2,000 Amazon Gift Card | 500 VEs |
| ₹500 Amazon Gift Card | 300 VEs |
| ₹20 Amazon Voucher | 2,000 Tokens |

These are fictional frontend values supplied for demonstration and should be replaced with backend-controlled business rules before production.

## Privacy and trust UX

Winner identifiers are masked. The claim modal only asks for physical-delivery details when the prize configuration requires them. Digital gift cards request an email instead of a delivery address. No real-time winner activity is claimed by the demo UI.

## Deployment

The app is Vercel/Netlify compatible as a standard Vite SPA. For Vercel, use:

- Build command: `npm run build`
- Output directory: `dist`

Configure SPA fallback/rewrite rules when deploying so direct routes such as `/giveaway/iphone-15-pro` resolve to `index.html`.

## Screenshots

The repository is structured for screenshots of desktop, tablet, mobile, active, ended, upcoming, winner, previous-winner, claim-modal, gift-card claim and non-winner states. Generate the final screenshots after local visual QA so they reflect the actual deployment build.

## Production checklist

- Replace demo data with API calls
- Replace placeholder refund/entry policy with approved VELOOP rules
- Server-authorize winner status and claim eligibility
- Server-authorize balance and entry deductions
- Persist participation and claim status in the backend
- Add real authentication integration
- Add approved Terms, Privacy and Support destinations
- Add final legal/eligibility copy
- Configure SPA routing on the hosting provider
