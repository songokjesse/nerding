# Implementation Strategy: Multi-Tenant Rostering API with Future Gemini Integration

## 1. Introduction

This document outlines a **refactored** implementation strategy for developing a robust, multi-tenant rostering API for shift allocation and management. 

**Key Changes from Original Strategy:**
- **Architecture**: Using Next.js API routes instead of separate Python/FastAPI microservice
- **Approach**: Phased implementation - Core rostering functionality first, Gemini AI integration later
- **Rationale**: Simplifies deployment, leverages existing authentication/multi-tenancy infrastructure, faster time-to-value

The rostering API will be built as part of the existing Next.js application under `/api/v1/rostering/`, utilizing the already-defined database schema including `ShiftClient`, `ShiftWorker`, `WorkerAvailability`, and `RosteringRule` models.

## 2. Architectural Overview

The refactored architecture integrates rostering capabilities directly into the existing Next.js application:

*   **Frontend:** Existing Next.js Application (React/TypeScript)
*   **Backend:** Next.js API Routes (TypeScript) - **includes new Rostering API**
*   **Database:** PostgreSQL (with Prisma ORM)
*   **AI Engine (Phase 2):** Google Gemini LLM integration
*   **Multi-tenancy:** Enforced via `organisationId` across all layers

```
+-------------------+      +---------------------------------+
|   Web Browser     |      |  Next.js Frontend Application   |
| (User Interface)  |<---->| (React Components, Pages, UI)   |
+-------------------+      |   - User Interaction            |
                           |   - Data Display                |
                           |   - API Consumption             |
                           +---------------------------------+
                                       |
                                       | API Calls (HTTP/HTTPS)
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   V                                       V
+------------------------------------------------+  +---------------------------+
|         Next.js Backend (API Routes)           |  |   Gemini LLM (Phase 2)   |
|  - Authentication & Authorization              |  | (Google Generative AI)   |
|  - User/Client Management                      |  +---------------------------+
|  - Progress Notes & Reports                    |              |
|  - NEW: Rostering API (/api/v1/rostering/*)   |<-------------+
|    * Shift Management (M-N workers/clients)    |  (Enhanced suggestions,
|    * Worker Availability                       |   rule interpretation,
|    * Rostering Rules                           |   optimization)
|    * Roster Suggestions & Validation           |
+------------------------------------------------+
                   |
                   | Database Queries (Prisma ORM)
                   V
+----------------------------------------------------------------+
|                    PostgreSQL Database                         |
|  - Users, Clients, Shifts, Sites                               |
|  - ShiftWorker, ShiftClient (M-N join tables)                  |
|  - WorkerAvailability, RosteringRule                           |
+----------------------------------------------------------------+
```


## 3. Phase 1: Backend - Core Rostering API Foundation

**Objective:** Implement core rostering API endpoints in Next.js with proper multi-tenancy enforcement and M-N relationship support.

**Status:** ✅ Database schema already includes all necessary models (`ShiftClient`, `ShiftWorker`, `WorkerAvailability`, `RosteringRule`)

**Key Tasks:**

*   **3.1. Create TypeScript Type Definitions:**
    *   Define request/response DTOs for all rostering endpoints
    *   Define rostering rule structures by type
    *   Create suggestion and validation response types
*   **3.2. Implement Core Rostering API Routes:**
    *   Create `/api/v1/rostering/shifts` - CRUD operations with M-N support
    *   Create `/api/v1/rostering/availability` - Worker availability management
    *   Create `/api/v1/rostering/rules` - Rostering rules management
    *   All routes use existing `authenticateRequest` middleware for multi-tenancy
*   **3.3. Validation & Business Logic:**
    *   Implement rule validation engine in TypeScript
    *   Create constraint checking functions
    *   Build conflict detection utilities
    *   Add time overlap and qualification matching helpers
*   **3.4. Roster Suggestions (Algorithmic):**
    *   Implement basic worker-client matching algorithm
    *   Add availability conflict detection
    *   Create score-based ranking system

**Expected Endpoints (Rostering Service - Core):**

All endpoints will implicitly operate within the context of the authenticated user's `organisationId`.

*   **`GET /api/v1/rostering/shifts`**
    *   **Description:** Retrieve a list of shifts, with optional filters (e.g., by date range, worker, client, status).
    *   **Response:** `[Shift]` (array of Shift objects, including associated clients/workers).
*   **`POST /api/v1/rostering/shifts`**
    *   **Description:** Create a new shift.
    *   **Request Body:** `ShiftCreateDto` (contains startTime, endTime, serviceType, list of client IDs, list of worker IDs, etc.).
    *   **Response:** `Shift` (newly created Shift object).
*   **`GET /api/v1/rostering/shifts/{shiftId}`**
    *   **Description:** Retrieve details for a specific shift.
    *   **Response:** `Shift`
*   **`PUT /api/v1/rostering/shifts/{shiftId}`**
    *   **Description:** Update an existing shift.
    *   **Request Body:** `ShiftUpdateDto`
    *   **Response:** `Shift` (updated Shift object).
    *   **`DELETE /api/v1/rostering/shifts/{shiftId}`**
    *   **Description:** Delete a specific shift.
    *   **Response:** `{"message": "Shift deleted successfully"}`
*   **`GET /api/v1/rostering/workers/availability`**
    *   **Description:** Retrieve worker availability for a given period.
    *   **Query Params:** `startDate`, `endDate`, `workerId` (optional).
    *   **Response:** `[WorkerAvailability]` (e.g., `[{ workerId, date, availableSlots }]`).
*   **`POST /api/v1/rostering/workers/{workerId}/availability`**
    *   **Description:** Set/update a worker's availability.
    *   **Request Body:** `WorkerAvailabilityDto`
    *   **Response:** `WorkerAvailability`
*   **`GET /api/v1/rostering/clients`** (Potentially from core app if not managed directly here)
    *   **Description:** Retrieve a list of clients.
    *   **Response:** `[Client]`
*   **`GET /api/v1/rostering/sites`** (Potentially from core app if not managed directly here)
    *   **Description:** Retrieve a list of sites/houses.
    *   **Response:** `[Site]`
*   **`GET /api/v1/rostering/rules`**
    *   **Description:** Retrieve defined rostering rules for the organisation.
    *   **Response:** `[RosteringRule]` (e.g., `[{ ruleId, type, description, constraints }]`).
*   **`POST /api/v1/rostering/rules`**
    *   **Description:** Define a new rostering rule.
    *   **Request Body:** `RosteringRuleCreateDto`
    *   **Response:** `RosteringRule`

## 4. Phase 2: Gemini AI Integration (Future Enhancement)

**Objective:** Enhance the rostering API with Gemini-powered intelligent features.

**Prerequisites:** Phase 1 core API must be completed and stable

**Key Tasks:**

*   **4.1. Gemini API Integration:**
    *   Leverage existing Gemini integration (already used for AI rephrase feature)
    *   Create rostering-specific prompt templates
    *   Implement structured output parsing for roster suggestions
*   **4.2. Enhanced Suggestion Engine:**
    *   Upgrade `/api/v1/rostering/suggestions` to use Gemini
    *   Provide natural language explanations for suggestions
    *   Learn from historical roster patterns
    *   Handle complex preference matching
*   **4.3. Natural Language Rule Interpretation:**
    *   Add `/api/v1/rostering/interpret-rules` endpoint
    *   Convert natural language rules to structured `ruleJson`
    *   Validate interpreted rules before saving
*   **4.4. Intelligent Conflict Resolution:**
    *   Use Gemini to suggest resolutions for roster conflicts
    *   Provide reasoning for recommended changes

**Expected Endpoints (Rostering Service - Gemini Integration):**

*   **`POST /api/v1/rostering/suggestions`**
    *   **Description:** Request AI-generated roster suggestions based on inputs.
    *   **Request Body:** `RosterSuggestionRequestDto` (contains partial roster, available workers, client needs, period, specific constraints, etc.).
    *   **Response:** `RosterSuggestionResponseDto` (contains proposed `[Shift]`, potential conflicts, Gemini's confidence score, and optional natural language explanation).
*   **`POST /api/v1/rostering/interpret-rules`**
    *   **Description:** Interpret natural language rostering rules into structured, machine-readable formats.
    *   **Request Body:** `{"naturalLanguageRule": "Worker A cannot work more than 40 hours a week."}`
    *   **Response:** `{"structuredRule": {"type": "max_hours_weekly", "workerId": "A", "limit": 40}}` or similar structured output.
*   **`POST /api/v1/rostering/validate`**
    *   **Description:** Validate a proposed roster against defined rules (using LLM to augment rule checking).
    *   **Request Body:** `RosterValidationRequestDto` (contains proposed `[Shift]`, `[RosteringRule]`).
    *   **Response:** `RosterValidationResponseDto` (contains `isValid: boolean`, `[Conflicts]`, `llmInsights: string` explaining validation).
*   **`POST /api/v1/rostering/optimize`**
    *   **Description:** Request optimization of an existing partial roster (e.g., minimize overtime, maximize worker preferences).
    *   **Request Body:** `RosterOptimizationRequestDto`
    *   **Response:** `RosterOptimizationResponseDto` (optimized `[Shift]`).

## 5. Phase 3: Frontend - Next.js UI Development

**Objective:** Develop an intuitive and interactive user interface for rostering managers, integrated into the existing Next.js application.

**Key Tasks:**

*   **5.1. UI Components:**
    *   Develop interactive calendar/timeline views for shift visualization and management.
    *   Implement drag-and-drop functionality for worker assignment and shift modification.
    *   Build forms for defining complex rostering rules (potentially using natural language input).
    *   Display multi-worker and multi-client shifts clearly.
*   **5.2. API Consumption:**
    *   Utilize `axios` with `React Query` or `SWR` to efficiently consume the new Rostering Service APIs.
    *   Implement optimistic UI updates for a smooth user experience.
*   **5.3. Multi-tenancy in UI:**
    *   Ensure all UI components correctly display and interact with data scoped to the current user's `organisationId`.
*   **5.4. Human-in-the-Loop Features:**
    *   Implement dashboards to review AI-generated suggestions, highlight conflicts, and allow managers to override or adjust allocations.
    *   Provide feedback mechanisms for improving AI suggestions.

## 6. Phase 4: Deployment & Monitoring

**Objective:** Deploy rostering API features and monitor usage.

**Key Tasks:**

*   **6.1. Deployment:**
    *   Rostering API deploys as part of existing Next.js application
    *   No separate service deployment needed
    *   Standard Vercel deployment process
*   **6.2. Monitoring:**
    *   Track rostering API endpoint usage
    *   Monitor Gemini API calls and costs (Phase 2)
    *   Set up alerts for validation failures or conflicts
*   **6.3. Security:**
    *   Rostering API uses existing authentication via Better Auth
    *   Multi-tenancy enforced via `organisationId` filtering
    *   Gemini API keys managed via environment variables

## 7. Technology Stack Summary

*   **Frontend:** Next.js (React, TypeScript)
*   **Backend (Unified):** Next.js API Routes (TypeScript)
*   **Rostering API:** Next.js API Routes under `/api/v1/rostering/*`
*   **AI Integration (Phase 2):** Google Gemini API (already integrated)
*   **Database:** PostgreSQL with Prisma ORM
*   **Authentication:** Better Auth (existing)
*   **Deployment:** Vercel (existing deployment pipeline)

## 8. Future Considerations

*   **Optimized Algorithms:** Potentially integrate more advanced traditional optimization algorithms (e.g., constraint satisfaction solvers) alongside Gemini for hard constraints.
*   **Real-time Updates:** Implement WebSockets for real-time roster updates.
*   **Mobile App Integration:** Extend API for mobile client consumption.
*   **Fine-tuning Gemini:** Explore fine-tuning Gemini for specific rostering patterns and rules.
