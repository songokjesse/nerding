# Architecture Insight: SIL (Supported Independent Living) Implementation

## The Challenge
The current data model links a `Shift` strictly to one `Worker` and one `Client` (1:1).
In a SIL environment, you have a **Many-to-Many** relationship during a rostered period:
- **Many Clients** (Residents) live in the house.
- **Many Workers** (Staff) support the house simultaneously.
- Support is often shared, not always 1:1.

## Proposed Solution: Site-Based Model

To support this, you need to shift the focus from "Worker supporting Client" to "Worker staffing a Location".

### 1. Data Model Changes

#### A. Introduce a `Site` (or `House`) Model
Create a model to represent the physical location (SIL House).
```prisma
model Site {
  id             String @id @default(uuid())
  name           String // e.g., "123 Maple Street"
  organisationId String
  // ...
}
```

#### B. Link Clients to Sites
Clients (Participants) are residents of a site.
```prisma
model Client {
  // ... existing fields
  siteId String? // The house they live in
  site   Site?   @relation(...)
}
```

#### C. Update `Shift` Model
A shift now represents a worker's time at a **Site**, not necessarily with a single client.
```prisma
model Shift {
  // ... existing fields
  siteId   String? // Link to the SIL House
  clientId String? // Make this OPTIONAL. Used for 1:1 community access, but null for SIL shifts.
  // ...
}
```

### 2. Workflow & Logic

#### Scheduling (Rostering)
- You roster Staff to a **Site** for a specific time (e.g., 07:00 - 15:00).
- You can roster multiple staff to the same Site at overlapping times.

#### The "Shift" Experience
1.  **Clock In**: Worker clocks into the "Maple Street Shift".
2.  **Dashboard**: Instead of seeing "Client A", the worker sees the **Site Dashboard**.
    - This lists **all 5 Residents** (Clients linked to that Site).
    - It shows the other staff currently clocked in (Team View).

#### Progress Notes & Observations
- **Context**: When a worker adds a note, they select *which* resident it is for.
- **Data Linking**:
    - `ProgressNote.clientId`: The specific resident.
    - `ProgressNote.authorId`: The worker writing it.
    - `ProgressNote.shiftId`: The worker's current "Site Shift" (for audit trails).
- **Shared Tasks**: You can implement "House Tasks" (e.g., cleaning, meal prep) that are linked to the `Shift` or `Site` but not a specific client.

### 3. Handling "Breakouts" (1:1 Time)
The user asked: *"For breakouts we can just add logs as a note i think."*

**Verdict:** Yes, but with caveats.

-   **Clinical Logging:** Yes, adding a Note (e.g., "Took Client A to the shops") is perfect for the clinical record.
-   **Billing/Rostering:** A simple Note usually lacks a "Duration" or "Start/End Time".
    -   **If you bill by the hour:** You might need to add a `duration` field to the Note or Observation to capture "2 hours of 1:1 support".
    -   **If you bill by the shift:** Then a simple Note is sufficient.

### 5. UX Impact: Recording Breakout Duration
The user asked: *"recording duration of a breakout might be important but wanted to know how it will affect the UX"*

Adding a requirement to record duration adds friction. Here are 3 approaches:

#### Option A: Simple "Duration" Field (Low Friction)
-   **UI**: A simple number input (e.g., "Hours: 2") inside the Note form.
-   **Pros**: Fast, easy to estimate.
-   **Cons**: Less precise. "Was it 1:30pm to 3:30pm or 2pm to 4pm?"
-   **Best for**: Billing that just needs "Total Hours".

#### Option B: Start/End Time Pickers (Medium Friction)
-   **UI**: Two time inputs: "Start Time" and "End Time".
-   **Pros**: precise audit trail.
-   **Cons**: Annoying to enter if the worker is busy. They might just guess.
-   **Best for**: Strict auditing requirements.

#### Option C: "Check-In / Check-Out" of Activity (High Friction / High Accuracy)
-   **UI**: A button "Start 1:1 with Client A". Later, "End 1:1".
-   **Pros**: Perfect accuracy.
-   **Cons**: Workers **will forget** to click "End". Requires "Auto-end" logic or "Fix it later" flows.
-   **Verdict**: Avoid this unless absolutely necessary.

**Recommendation**: Start with **Option A (Simple Duration)**. It's the best balance of data vs. worker annoyance.

**Recommendation**: Start with **Option A (Simple Duration)**. It's the best balance of data vs. worker annoyance.

### 6. Appointments & Calendar Events
The user suggested: *"add appointments option to have a semi calendar of events... pre planned and also added when they arise... contribute to shift report"*

This is a great addition. It bridges the gap between "Rostering" (Staff) and "Life" (Residents).

#### A. Data Model: `Appointment`
```prisma
model Appointment {
  id             String   @id @default(uuid())
  title          String   // e.g., "Dr. Smith GP"
  description    String?
  startTime      DateTime
  endTime        DateTime? // Optional, or use duration
  durationMinutes Int?
  
  // Links
  siteId         String?   // House event (e.g., "House Inspection")
  clientId       String?   // Specific resident event (e.g., "Physio")
  
  // Status
  status         String    @default("SCHEDULED") // SCHEDULED, COMPLETED, CANCELLED
  completedAt    DateTime?
  completedBy    String?   // Worker User ID
  shiftId        String?   // Link to the shift where it was completed
}
```

#### B. Workflow
1.  **Pre-Planning**: Coordinators or Workers add appointments to the "House Calendar".
2.  **During Shift**:
    -   The Dashboard shows "Upcoming Appointments" for the current shift.
    -   Worker clicks "Complete" (and optionally adjusts duration/notes).
    -   **Ad-Hoc**: Worker can also "Add Event" right then and there (e.g., "Emergency Vet Visit").
3.  **Reporting**:
    -   When generating the **Shift Report**, query all `Appointments` where `shiftId == currentShift.id` OR `completedAt` falls within shift time.
    -   These appear as a distinct section: "Activities & Appointments".

### 7. Impact on Existing Workflow
The user asked: *"Will it affect the other implementation of the shift work flow if implemented?"*

**Verdict:** **YES**, it will require updates to your existing code.

1.  **API Logic (`POST /notes`)**:
    -   *Current:* Automatically uses `shift.clientId`.
    -   *New:* Must check if `shift.clientId` exists. If not (SIL shift), it **MUST** require a `clientId` in the request body (selected by the worker).

2.  **Frontend (`ShiftDetailPage`)**:
    -   *Current:* Displays one "Client Information" card.
    -   *New:* Must handle the case where `shift.client` is null.
        -   If `shift.siteId` is present, display "Site Information" and a list of Residents instead.

3.  **Database Schema**:
    -   Making `Shift.clientId` optional is a **non-breaking change** for the database structure itself (existing records keep their data), but the **application logic** (TypeScript types) will treat `clientId` as potentially `null`, forcing you to add checks (`if (shift.clientId) ...`) throughout your app.

## Summary of Changes
1.  **Schema**: Add `Site`. Make `Shift.clientId` nullable. Add `Shift.siteId`.
2.  **UI**: Create a "House View" for workers.
3.  **Logic**: Allow Notes/Observations to be created for any Client resident at the Site during the Worker's shift.
