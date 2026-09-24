# MediConnect — Modular Monolith Roadmap

## Objective

Transform MediConnect into a complete modular monolith without prematurely introducing microservices, distributed infrastructure, or new business rules.

### Target principles

- Every business domain has clear ownership inside a module.
- Modules expose public APIs through `index.js` facades.
- External code does not import another module's models, repositories, or internal services.
- Domain ownership is explicit.
- Cross-domain composition happens through facades or an application/composition layer.
- There are no circular module dependencies.
- The root `src/` contains only application composition and platform/shared infrastructure.
- Existing product behavior and business rules are preserved unless a separate product requirement explicitly calls for a change.
- One MongoDB database remains acceptable; modularity does not require separate databases.

---

# Current State

Already established as real modules:

- `Scheduling`
- `Queue`
- `Clinical`

Core/Identity work already completed:

- Doctor profile get-or-create consolidation
- Clinic approval consolidation
- Doctor ↔ Clinic ownership boundary
- Approved-clinic access control
- `bookAppointment` operation contract clarified

**Core rule:** do not invent business rules merely to make the architecture cleaner.

Examples:

- Do not add new Doctor ↔ Patient report-access rules without a product requirement.
- Do not add role checks inside Scheduling merely because callers have different route-level authorization.
- Do not introduce Kafka, Redis, HTTP between modules, separate databases, or microservices as part of modular-monolith completion.

---

# Phase 1 — Harden Existing Modules

## 10.1 Doctor Profile Access Consolidation

**Status: COMPLETE**

- Consolidate Doctor get-or-create behavior.
- Establish one canonical `getOrCreateDoctorProfile()`.
- Keep Doctor persistence behind the Doctor service/repository.
- Remove duplicated lazy-creation implementations.

## 10.2 Clinic Approval Consolidation

**Status: COMPLETE**

- Establish `clinic.service.approveClinic()` as the canonical approval operation.
- Remove duplicated `isApproved = true` mutations.
- Admin uses the Clinic service instead of directly mutating approval state.

## 10.3 Doctor ↔ Clinic Ownership Boundary

**Status: COMPLETE**

- Doctor service owns Doctor → Clinic linking.
- Repository owns persistence.
- Clinic registration no longer directly mutates the Doctor model.
- Preserve existing one-clinic behavior.

## 10.4 Approved Clinic Access Control

**Status: COMPLETE**

- Backend middleware protects professional Doctor operations.
- Frontend route guard prevents direct URL access to protected Doctor screens.
- Dashboard, profile, and clinic registration remain available to unapproved Doctors.
- No new product rule was introduced.

## 10.5 Shared Authorization Consolidation

**Status: DEFERRED**

Do not create a generic authorization abstraction merely for code cleanliness.

Revisit only when repeated checks have a stable, documented contract. Existing policies must not be changed accidentally.

## 10.6 Reports Authorization Policy

**Status: DEFERRED**

Do not invent a Doctor ↔ Patient access policy. Preserve current behavior until product requirements define who may access another patient's reports.

## 10.7 `bookAppointment` Operation Contract

**Status: COMPLETE**

`Scheduling.bookAppointment()` owns the existing booking rules:

1. Resolve canonical Doctor profile.
2. Check Doctor leave.
3. Check Doctor availability.
4. Generate valid slots.
5. Validate requested time.
6. Check whether the slot is already booked.
7. Validate clinic association.
8. Create appointment.

Contract:

```js
bookAppointment({
    patientId,
    doctorId,
    date,
    time
})
```

Scheduling should not depend on Express `req/res`, JWT role handling, AI receptionist logic, or voice generation. Authorization remains at the appropriate entry point.

## 10.8 Queue Boundary Cleanup

**Status: COMPLETE**

Remove remaining direct Token model access outside Queue.

Known consumers:

- Admin controller
- Doctor controller

Expose required Queue operations through the facade, such as:

```text
getTokenStatsForAdmin()
countActiveTokens()
countWaitingTokensByClinic()
```

Target:

```text
Admin / Doctor
       ↓
Queue facade
       ↓
Queue repository
```

Preserve existing analytics behavior.

## 10.9 Queue ↔ Clinic Boundary

**Status: COMPLETE**

Queue currently has Clinic model access for clinic-type validation.

Target:

```text
Queue
  ↓
Clinic facade
```

Do not change what qualifies as a token clinic; only move ownership behind the correct boundary.

## 10.10 Dead / Orphan Cleanup

**Status: COMPLETE**

After dependency verification:

- Remove or quarantine unused `Slot` model.
- Remove obsolete Token model/controller/route stubs.
- Clean outdated comments describing removed dual-write behavior.
- Remove dead imports and empty legacy files.

## 10.11 Scheduling ↔ Clinical Dependency Cycle

**Status: COMPLETE — IMPORTANT**

Current issue:

```text
Scheduling → Clinical
Clinical   → Scheduling
```

Scheduling currently uses Clinical for appointment enrichment/read composition.

Target:

```text
Scheduling
    ↓
pure appointment data

Application / Controller / Composition layer
    ↓
Scheduling + Clinical
```

Review:

- Appointment prescription enrichment
- Appointment details + consultation
- Patient consultation history

Do not change API behavior or business rules.

---

# Phase 2 — Extract Identity

## 11. Identity Module

**Target: `modules/identity/`**

Identity should own:

- `User`
- `Doctor`
- Doctor profile persistence
- Doctor profile business operations

Expected facade operations:

```text
getOrCreateDoctorProfile(userId)
findDoctorById(doctorId)
findDoctorByUserId(userId)
linkClinicToDoctor(doctorId, clinicId)
getDoctorProfileWithClinicStatus(userId)
createDoctorProfile(...)
updateDoctorProfile(...)
getUserById(userId)
```

Move from root:

```text
models/doctor.model.js
repositories/doctor.repository.js
services/doctor.service.js
```

Then migrate consumers:

- Scheduling
- Queue
- Clinical
- Auth
- Clinic
- Admin
- AI Receptionist
- approvedClinic middleware

Target:

```text
Scheduling → Identity facade
```

instead of:

```text
Scheduling → doctor.repository
```

---

# Phase 3 — Extract Clinic

## 12. Clinic Module

**Target: `modules/clinic/`**

Clinic owns:

- Clinic model
- Clinic creation/update operations
- Approval
- Activation
- Clinic-type rules/helpers

Facade examples:

```text
getClinicById()
assertClinicApproved()
assertClinicType()
approveClinic()
createClinic()
```

Consumers use the Clinic facade instead of importing the Clinic model.

---

# Phase 4 — Extract Auth

## 13. Auth Module

**Target: `modules/auth/`**

Auth owns:

- Registration
- Login
- JWT issuance
- Authentication orchestration

Authorization middleware may remain platform HTTP/security glue.

Auth depends on Identity for:

- User lookup
- Doctor profile bootstrap

Auth should not own Doctor business rules.

---

# Phase 5 — Extract Remaining Product Domains

## 14. Patient Module

**Target: `modules/patient/`**

Owns:

- Patient profile
- Patient profile updates
- Patient dashboard composition

The dashboard may compose:

```text
Patient
 ├── Scheduling facade
 └── Reports facade
```

Patient does not own Appointment persistence.

## 15. Posts / Social Module

**Target: `modules/posts/`**

Owns:

- Post model
- Post creation/update/deletion
- Likes
- Comments
- Post retrieval

Doctor dashboard post counts should use the Posts facade.

## 16. Reports Module

**Target: `modules/reports/`**

Owns:

- Medical report model
- Upload
- Listing
- Deletion
- Report retrieval

AI Insights and Patient consume Reports through its facade.

Do not introduce new Doctor ↔ Patient report authorization rules during extraction.

## 17. AI Module

**Target: `modules/ai/`**

Owns:

- AI Insights
- AI Receptionist
- AI-specific controllers/services
- AI-related persistence

AI Receptionist should use:

```text
Identity facade
Scheduling facade
```

instead of importing Doctor models directly.

LLM clients may remain platform utilities if generic infrastructure, or live under AI if domain-specific.

## 18. Admin Module

**Target: `modules/admin/`**

Admin becomes the platform-operations/composition domain.

It may call:

```text
Identity
Clinic
Scheduling
Queue
Posts
Reports
```

through public facades.

Admin must not directly import another domain's models.

---

# Phase 6 — Platform / Shared Kernel Cleanup

Target:

```text
src/
├── app.js
├── platform/
│   ├── config/
│   ├── middleware/
│   ├── utils/
│   └── socket.js
└── modules/
    ├── identity/
    ├── clinic/
    ├── auth/
    ├── scheduling/
    ├── queue/
    ├── clinical/
    ├── patient/
    ├── posts/
    ├── reports/
    ├── ai/
    └── admin/
```

Platform may contain:

- Environment/configuration
- Database connection
- Generic HTTP middleware
- Authentication glue
- Error handling
- Logger
- Cloudinary/storage clients
- PDF utility infrastructure
- Multer/upload configuration
- Socket.IO bootstrap

Platform must not contain domain business logic or domain models.

---

# Phase 7 — Composition Root

## `app.js`

`app.js` becomes the composition root.

Responsibilities:

- Configure platform middleware.
- Mount module routers.
- Configure global infrastructure.
- Start the application.

No business logic.

API URLs can remain unchanged while internal ownership moves.

---

# Phase 8 — Modular Monolith Governance

## 19. Facade Completeness

Every external module need becomes an explicit public operation.

Bad:

```js
import Token from '../queue/models/token.model.js';
```

Good:

```js
import { countWaitingTokensByClinic } from '../queue/index.js';
```

## 20. Import Boundary Rules

Allowed:

```text
modules/A → modules/B/index.js
```

Not allowed:

```text
modules/A → modules/B/models/*
modules/A → modules/B/repositories/*
modules/A → modules/B/services/*
```

Outside code should not reach inside another module.

## 21. One Database, Clear Ownership

One MongoDB remains valid.

The rule is:

> One module owns each domain collection.

Cross-module reads happen through public facades.

## 22. No Circular Module Dependencies

Avoid:

```text
Scheduling ↔ Clinical
```

When two domains need combined data, prefer higher-level composition.

## 23. Middleware Boundary

Middleware should use public Identity/Clinic/Auth facades rather than domain internals.

## 24. Scripts Policy

Runtime application code uses facades.

One-off migration/audit scripts may directly access models when necessary.

---

# Final Target Module Map

| Module | Responsibility | Main dependencies |
|---|---|---|
| Identity | User + Doctor profiles | Minimal |
| Clinic | Clinics, approval, type | Identity |
| Auth | Login/register/JWT | Identity |
| Scheduling | Appointments, availability, leave, slots | Identity, Clinic |
| Queue | Tokens, live queue | Identity, Clinic |
| Clinical | Consultations, prescriptions | Scheduling, Queue, Identity |
| Patient | Patient profile + dashboard composition | Identity, Scheduling, Reports |
| Posts | Doctor posts/social | Identity |
| Reports | Medical reports | Identity |
| AI | Insights + receptionist | Reports, Scheduling, Identity |
| Admin | Platform operations/analytics | Public facades |

Shared platform:

```text
config
HTTP
database bootstrap
logging
storage clients
sockets
generic middleware
utilities
```

---

# Final Completion Checklist

## Existing architecture

- [x] Scheduling module
- [x] Queue module
- [x] Clinical module
- [x] Scheduling facade
- [x] Queue facade
- [x] Clinical facade
- [x] Doctor profile consolidation
- [x] Clinic approval consolidation
- [x] Doctor ↔ Clinic ownership consolidation
- [x] Approved-clinic authorization
- [x] `bookAppointment` contract clarified
- [ ] Queue deep imports removed
- [ ] Queue ↔ Clinic boundary sealed
- [ ] Scheduling ↔ Clinical cycle removed
- [ ] Dead/orphan code removed

## Domain extraction

- [ ] Identity
- [ ] Clinic
- [ ] Auth
- [ ] Patient
- [ ] Posts
- [ ] Reports
- [ ] AI
- [ ] Admin

## Final architecture

- [ ] No domain models in shared/root layers
- [ ] No cross-module deep imports
- [ ] No cross-module repository imports
- [ ] No cross-module internal service imports
- [ ] No circular module dependencies
- [ ] Root domain controllers/services/repositories/models removed or emptied
- [ ] `app.js` is composition root
- [ ] Platform contains infrastructure only
- [ ] Each module exposes documented public APIs
- [ ] Architectural boundaries enforced automatically

---

# Recommended Execution Order

```text
10.8 Queue boundary cleanup
        ↓
10.9 Queue ↔ Clinic boundary
        ↓
10.10 Dead/orphan cleanup
        ↓
10.11 Scheduling ↔ Clinical cycle
        ↓
Identity
        ↓
Clinic
        ↓
Auth
        ↓
Patient
        ↓
Posts
        ↓
Reports
        ↓
AI
        ↓
Admin
        ↓
Platform cleanup
        ↓
Composition root
        ↓
Boundary enforcement
        ↓
Final modular-monolith audit
```

---

# Definition of Done

MediConnect is a complete modular monolith when:

1. Every business domain has a clear owning module.
2. Every module has a public facade.
3. Runtime code cannot bypass another module's facade.
4. Domain models and repositories are private to their owning modules.
5. There are no circular module dependencies.
6. Cross-domain composition happens at an appropriate application/composition boundary.
7. Root layers contain no leftover domain ownership.
8. `app.js` acts as the composition root.
9. Platform contains infrastructure rather than business logic.
10. Existing product behavior remains intact.
11. No microservice infrastructure is required.
12. Automated checks prevent architectural regression.

At that point, MediConnect is structurally ready to be evaluated for future service extraction. Microservice extraction remains a separate architectural decision.
