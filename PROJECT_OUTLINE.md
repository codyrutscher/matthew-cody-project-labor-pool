# Office Catering Subscription Platform - Project Outline

## Overview
A web platform for managing office catering subscriptions with weekly cuisine rotation, RSVP workflows, and budget management.

---

## Tech Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes / Server Actions
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js (office managers + staff)
- **Payments:** Stripe (subscriptions & billing)
- **Email:** Resend or SendGrid (RSVP notifications)

---

## Data Models

### Office
- id, name, address, timezone
- budgetLimit, paymentMethodId
- dietaryRestrictions (JSON)
- cateringMaterials (text)

### User
- id, email, name, role (MANAGER | STAFF)
- officeId (FK)

### Subscription
- id, officeId, status, billingCycle
- stripeSubscriptionId

### Menu
- id, weekOf (date), cuisineType
- culturalCelebration (optional)
- publishedAt, items (relation)

### MenuItem
- id, menuId, name, description
- price, dietaryTags[], imageUrl

### Order
- id, officeId, menuId, status
- totalCost, deadline

### RSVP
- id, orderId, userId
- selectedItems (JSON), dietaryNotes
- submittedAt

---

## Core Features & Pages

### 1. Authentication & Onboarding
- `/login` - Email/password or magic link
- `/onboarding` - Office setup wizard (name, address, dietary restrictions, materials)

### 2. Dashboard (`/dashboard`)
- Current week's order status
- Upcoming menu preview (2 weeks ahead)
- Budget tracker widget
- Quick actions: Send RSVP, View responses

### 3. Office Profile (`/settings/office`)
- Edit dietary restrictions database
- Update catering materials list
- Manage staff members
- Payment method management

### 4. Menu Browser (`/menus`)
- View current + upcoming menus (2-week preview)
- Filter by dietary tags
- Cuisine type & cultural celebration badges

### 5. Order Management (`/orders`)
- `/orders/new` - Create order from menu
- `/orders/[id]` - Order details & RSVP aggregation
- Manager can select items directly OR use RSVP workflow

### 6. RSVP System
- `/rsvp/[token]` - Staff RSVP page (public link)
- Select preferred items, add dietary notes
- Deadline countdown
- Manager view: aggregated responses with counts

### 7. Subscription & Billing (`/settings/billing`)
- Current plan status
- Payment history
- Update payment method
- Budget limit configuration

### 8. Admin Panel (`/admin`) - Platform Operators
- Manage cuisine rotation schedule
- Create/edit weekly menus
- Add cultural celebrations calendar
- View all office subscriptions

---

## API Routes

```
POST   /api/auth/[...nextauth]
GET    /api/offices/[id]
PATCH  /api/offices/[id]
GET    /api/menus?weekOf=YYYY-MM-DD
GET    /api/menus/[id]
POST   /api/orders
GET    /api/orders/[id]
PATCH  /api/orders/[id]
POST   /api/orders/[id]/send-rsvp
GET    /api/rsvp/[token]
POST   /api/rsvp/[token]
GET    /api/rsvp/[orderId]/aggregate
POST   /api/subscriptions/create
POST   /api/webhooks/stripe
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema & Prisma setup
- [ ] Authentication (NextAuth)
- [ ] Office & User CRUD
- [ ] Basic dashboard layout

### Phase 2: Menu System (Week 3-4)
- [ ] Menu & MenuItem models
- [ ] Admin menu creation interface
- [ ] Menu browser for offices
- [ ] Cuisine rotation logic

### Phase 3: Orders & RSVP (Week 5-6)
- [ ] Order creation flow
- [ ] RSVP link generation & email sending
- [ ] Staff RSVP submission page
- [ ] Response aggregation view

### Phase 4: Payments (Week 7-8)
- [ ] Stripe integration
- [ ] Subscription management
- [ ] Budget tracking & alerts
- [ ] Billing history

### Phase 5: Polish (Week 9-10)
- [ ] Email notifications
- [ ] Mobile responsiveness
- [ ] Error handling & edge cases
- [ ] Testing & deployment

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── onboarding/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── menus/
│   │   ├── orders/
│   │   └── settings/
│   ├── admin/
│   ├── rsvp/[token]/
│   └── api/
├── components/
│   ├── ui/           # Buttons, inputs, cards
│   ├── forms/        # Form components
│   └── features/     # Feature-specific components
├── lib/
│   ├── db.ts         # Prisma client
│   ├── auth.ts       # NextAuth config
│   └── stripe.ts     # Stripe helpers
├── types/
└── utils/
```

---

## Key User Flows

### Office Manager: Weekly Order Flow
1. Receive notification that new menu is available (2 weeks out)
2. Review menu items and dietary compatibility
3. Option A: Select items directly based on headcount
4. Option B: Send RSVP to staff → collect responses → finalize
5. System checks against budget, flags if exceeded
6. Confirm order → automated billing

### Staff: RSVP Flow
1. Receive email with RSVP link
2. View menu items with dietary tags
3. Select preferences, add notes
4. Submit before deadline
5. Receive confirmation

---

## Next Steps
1. Set up Prisma with PostgreSQL
2. Create database schema
3. Implement authentication
4. Build dashboard shell
