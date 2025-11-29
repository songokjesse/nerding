# Implementation Strategy: Multi-Tenant Gemini-Powered Rostering Engine

## 1. Introduction

This document outlines an implementation strategy for developing a robust, multi-tenant rostering engine integrated with Google Gemini, designed to enhance shift allocation and management for different companies. The engine will function as a specialized backend service, interacting with the existing Next.js application (frontend) and PostgreSQL database.

## 2. Architectural Overview

The architecture follows a microservice-like pattern, introducing a dedicated Rostering Service that leverages AI.

*   **Frontend:** Existing Next.js Application (React/TypeScript)
*   **Core Application Backend:** Existing Next.js API Routes / Server Actions
*   **Rostering Service/API (NEW):** Python FastAPI (recommended) or Node.js NestJS (with Gemini integration)
*   **Database:** PostgreSQL (shared)
*   **AI Engine:** Google Gemini LLM
*   **Multi-tenancy:** Enforced via `organisationId` across all layers.

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
                   +-----------------------------------------------------------------------+
                   |                                                                       |
                   V                                                                       V
+---------------------------------+                             +-------------------------------------------------+
|    Core Application Backend     |                             |             Rostering Service/API               |
| (Next.js API Routes/Server Actions) |                             | (Python FastAPI/Node.js NestJS + Gemini LLM Integration) |
|   - User/Client/Basic Shift Mgt.|                             |   - Rostering Logic & Optimization              |
|   - Reporting                   |                             |   - Worker Allocation (LLM-assisted intelligence) |
|   - Basic Data Operations       |                             |   - Constraint Management (LLM-assisted interpretation) |
|   - Authentication/AuthZ Logic  |                             |   - Availability Management                     |
+---------------------------------+                             |                     |                           |
               |                                                 |                     V                           |
               |                                                 |           +---------------------------+       |
               | Database Queries (Prisma ORM)                   |           |   Gemini LLM Provider API   |       |
               V                                                 |           | (Google Gemini API / OpenRouter)  |
+----------------------------------------------------------------+           +---------------------------+       |
|                                 PostgreSQL Database                             |             ^ (Data/Context:       ^
|         (Users, Clients, Shifts, Reports, Rostering-Specific Tables, etc.)      |<------------| worker skills, client needs, |
+---------------------------------------------------------------------------------+             |  shift rules, historical data)  |
                                                                                               +-------------------------------+
```

## 3. Phase 1: Backend - Core Rostering Service Foundation

**Objective:** Establish the foundational data model, API, and multi-tenancy enforcement for core rostering capabilities, independent of AI.

**Key Tasks:**

*   **3.1. Schema Modifications (Prisma for PostgreSQL):**
    *   Introduce join tables for many-to-many relationships:
        *   `ShiftClient`: Links `Shift` to multiple `Client`s (e.g., for SIL houses).
        *   `ShiftWorker`: Links `Shift` to multiple `User`s (support workers).
    *   Add fields for worker availability, qualifications, client preferences, and structured rostering rules.
    *   Ensure all new tables/entities include `organisationId` for multi-tenancy.
*   **3.2. Rostering Service Setup (Python FastAPI Recommended):**
    *   Initialize a new FastAPI project.
    *   Set up database connectivity using an ORM compatible with Prisma/PostgreSQL (e.g., SQLAlchemy with Pydantic for data validation, or directly using Prisma Client Python if available and preferred).
    *   Implement Pydantic models for request/response validation.
*   **3.3. Multi-tenancy Enforcement:**
    *   Implement middleware or dependency injection in FastAPI to extract `organisationId` from authenticated requests.
    *   Ensure all database queries automatically filter by the `organisationId` for the current context.
*   **3.4. Core Rostering Logic (CRUD):**
    *   Implement API endpoints for managing roster components.

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

## 4. Phase 2: Backend - Gemini Integration

**Objective:** Integrate Gemini into the Rostering Service to provide AI-assisted functionalities.

**Key Tasks:**

*   **4.1. Gemini API Wrapper:** Implement a robust wrapper for Google Gemini API calls (similar to your `GeminiModel` class), handling retries, error management, and context passing.
*   **4.2. Prompt Engineering & Output Parsing:**
    *   Develop effective prompts for various AI tasks (suggestion, validation, interpretation).
    *   Ensure Gemini's output is consistently structured (e.g., JSON) and implement robust parsing and validation within the service.
*   **4.3. LLM-Assisted Allocation Logic:**
    *   Implement internal logic to prepare data (workers, shifts, rules) for Gemini prompts.
    *   Process Gemini's responses and integrate them into roster data structures.

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

## 6. Phase 4: Deployment & Operations

**Objective:** Deploy and maintain the new Rostering Service and integrated features securely and efficiently.

**Key Tasks:**

*   **6.1. Containerization:** Create Dockerfiles for the Rostering Service.
*   **6.2. Deployment:**
    *   Deploy the Rostering Service (e.g., to Google Cloud Run or AWS ECS with Fargate).
    *   Ensure the existing Next.js app (frontend) is updated to point to the new Rostering Service API endpoints.
*   **6.3. Monitoring, Logging, Alerting:**
    *   Implement comprehensive monitoring for both the Rostering Service and Gemini API usage (latency, errors, cost).
    *   Set up centralized logging and alerting for rapid issue detection.
*   **6.4. Security:**
    *   Ensure API authentication and authorization are robust.
    *   Manage API keys for Gemini securely (e.g., via environment variables, secret managers).

## 7. Technology Stack Summary

*   **Frontend:** Next.js (React, TypeScript)
*   **Core Application Backend:** Next.js API Routes / Server Actions (Node.js, TypeScript)
*   **Rostering Service Backend:** Python FastAPI (recommended) or Node.js NestJS (with TypeScript)
*   **AI Integration:** Google Gemini API
*   **Database:** PostgreSQL (with Prisma ORM for both backends)
*   **Deployment:** Google Cloud Run or AWS ECS/Fargate for Rostering Service; Vercel for Next.js frontend.

## 8. Future Considerations

*   **Optimized Algorithms:** Potentially integrate more advanced traditional optimization algorithms (e.g., constraint satisfaction solvers) alongside Gemini for hard constraints.
*   **Real-time Updates:** Implement WebSockets for real-time roster updates.
*   **Mobile App Integration:** Extend API for mobile client consumption.
*   **Fine-tuning Gemini:** Explore fine-tuning Gemini for specific rostering patterns and rules.
