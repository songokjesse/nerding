# Mobile API Documentation

## Base URL

```
/api/mobile/v1
```

## Authentication

All endpoints require authentication using a session token in the Authorization header:

```
Authorization: Bearer <session_token>
```

The session token is obtained from Better Auth after successful login.

---

## Endpoints

### 1. Get User Profile

Get current user profile and organization membership.

**Endpoint:** `GET /api/mobile/v1/profile`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "clx123...",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://..."
  },
  "organisation": {
    "id": "org123...",
    "name": "Care Provider Ltd",
    "role": "WORKER"
  }
}
```

---

### 2. List Shifts

Get worker's assigned shifts with optional filtering.

**Endpoint:** `GET /api/mobile/v1/shifts`

**Query Parameters:**
- `startDate` (optional): ISO date string (e.g., `2025-01-01`)
- `endDate` (optional): ISO date string (e.g., `2025-01-31`)
- `status` (optional): `PLANNED` | `COMPLETED` | `CANCELLED` | `NO_SHOW`

**Example:**
```
GET /api/mobile/v1/shifts?startDate=2025-01-01&status=PLANNED
```

**Response:** `200 OK`
```json
{
  "shifts": [
    {
      "id": "shift123...",
      "client": {
        "id": "client123...",
        "name": "Jane Smith",
        "ndisNumber": "123456789"
      },
      "startTime": "2025-01-15T09:00:00.000Z",
      "endTime": "2025-01-15T17:00:00.000Z",
      "status": "PLANNED",
      "serviceType": "Personal Care",
      "location": "123 Main St",
      "progressNotesCount": 2,
      "observationsCount": 5
    }
  ]
}
```

---

### 3. Get Shift Details

Get detailed information about a specific shift.

**Endpoint:** `GET /api/mobile/v1/shifts/:id`

**Response:** `200 OK`
```json
{
  "shift": {
    "id": "shift123...",
    "client": {
      "id": "client123...",
      "name": "Jane Smith",
      "ndisNumber": "123456789",
      "dateOfBirth": "1980-05-15T00:00:00.000Z",
      "notes": "Prefers morning shifts",
      "enabledModules": ["BOWEL_MONITORING", "FLUID_INTAKE", "BGL_MONITORING"]
    },
    "startTime": "2025-01-15T09:00:00.000Z",
    "endTime": "2025-01-15T17:00:00.000Z",
    "status": "PLANNED",
    "serviceType": "Personal Care",
    "location": "123 Main St",
    "progressNotes": [...],
    "observations": [...]
  }
}
```

---

### 4. Update Shift Status

Update the status of a shift.

**Endpoint:** `PATCH /api/mobile/v1/shifts/:id/status`

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

**Valid Status Values:**
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

**Response:** `200 OK`
```json
{
  "shift": {
    "id": "shift123...",
    "status": "COMPLETED",
    "startTime": "2025-01-15T09:00:00.000Z",
    "endTime": "2025-01-15T17:00:00.000Z"
  }
}
```

---

### 5. Clock In

Clock in to a shift.

**Endpoint:** `POST /api/mobile/v1/shifts/:id/clock-in`

**Request Body:**
```json
{
  "location": {
    "lat": -33.8688,
    "lng": 151.2093,
    "accuracy": 10
  }
}
```

**Response:** `200 OK`
```json
{
  "shift": {
    "id": "shift123...",
    "status": "IN_PROGRESS",
    "clockInTime": "2025-01-15T08:55:00.000Z",
    "clockInLocation": {
      "lat": -33.8688,
      "lng": 151.2093,
      "accuracy": 10
    }
  }
}
```

---

### 6. Clock Out

Clock out of a shift.

**Endpoint:** `POST /api/mobile/v1/shifts/:id/clock-out`

**Request Body:**
```json
{
  "location": {
    "lat": -33.8688,
    "lng": 151.2093,
    "accuracy": 10
  }
}
```

**Response:** `200 OK`
```json
{
  "shift": {
    "id": "shift123...",
    "status": "COMPLETED",
    "clockOutTime": "2025-01-15T17:05:00.000Z",
    "clockOutLocation": {
      "lat": -33.8688,
      "lng": 151.2093,
      "accuracy": 10
    }
  }
}
```

---

### 7. List Observations

Get all observations for a shift.

**Endpoint:** `GET /api/mobile/v1/shifts/:shiftId/observations`

**Response:** `200 OK`
```json
{
  "observations": [
    {
      "id": "obs123...",
      "type": "BGL_MONITORING",
      "data": {
        "reading": 5.5,
        "mealContext": "Before Meal"
      },
      "recordedAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "obs456...",
      "type": "BOWEL_MONITORING",
      "data": {
        "type": "Type 4",
        "consistency": "soft",
        "color": "brown"
      },
      "recordedAt": "2025-01-15T11:00:00.000Z"
    }
  ]
}
```

---

### 6. Create Observation

Create a new clinical observation.

**Endpoint:** `POST /api/mobile/v1/shifts/:shiftId/observations`

**Request Body:**
```json
{
  "moduleType": "BGL_MONITORING",
  "data": {
    "reading": 5.5,
    "mealContext": "Before Meal",
    "notes": "Patient feeling well"
  },
  "recordedAt": "2025-01-15T10:30:00.000Z"
}
```

**Module Types:**
- `BOWEL_MONITORING`
- `FLUID_INTAKE`
- `SEIZURE_MONITORING`
- `BEHAVIOUR_OBSERVATION`
- `BGL_MONITORING`

**Response:** `201 Created`
```json
{
  "observation": {
    "id": "obs123...",
    "type": "BGL_MONITORING",
    "data": {
      "reading": 5.5,
      "mealContext": "Before Meal",
      "notes": "Patient feeling well"
    },
    "recordedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

#### Observation Data Structures

**Bowel Monitoring:**
```json
{
  "type": "Type 4",
  "consistency": "soft",
  "color": "brown",
  "concerns": "None"
}
```

**Fluid Intake:**
```json
{
  "fluidType": "Water",
  "amount": 250,
  "notes": "Drank willingly"
}
```

**Seizure Monitoring:**
```json
{
  "seizureType": "Tonic-Clonic",
  "duration": 5,
  "severity": "Moderate",
  "postIctalState": "Confused",
  "notes": "Recovered after 10 minutes"
}
```

**Behaviour Observation:**
```json
{
  "behaviourType": "Aggression",
  "severity": "Mild",
  "triggers": "Loud noise",
  "intervention": "Moved to quiet room",
  "outcome": "Calmed down",
  "notes": "Responded well to intervention"
}
```

**BGL Monitoring:**
```json
{
  "reading": 5.5,
  "mealContext": "Before Meal",
  "notes": "Patient feeling well"
}
```

---

### 7. List Progress Notes

Get all progress notes for a shift.

**Endpoint:** `GET /api/mobile/v1/shifts/:shiftId/notes`

**Response:** `200 OK`
```json
{
  "notes": [
    {
      "id": "note123...",
      "noteText": "Client had a good day. Participated in activities.",
      "mood": "Happy",
      "incidentFlag": false,
      "behavioursFlag": false,
      "medicationFlag": false,
      "createdAt": "2025-01-15T16:00:00.000Z",
      "author": {
        "name": "John Doe"
      }
    }
  ]
}
```

---

### 8. Create Progress Note

Create a new progress note for a shift.

**Endpoint:** `POST /api/mobile/v1/shifts/:shiftId/notes`

**Request Body:**
```json
{
  "noteText": "Client had a good day. Participated in activities.",
  "mood": "Happy",
  "incidentFlag": false,
  "behavioursFlag": false,
  "medicationFlag": false
}
```

**Fields:**
- `noteText` (required): The progress note text
- `mood` (optional): Client's mood
- `incidentFlag` (optional): Flag for incidents (default: false)
- `behavioursFlag` (optional): Flag for behavioral concerns (default: false)
- `medicationFlag` (optional): Flag for medication-related notes (default: false)

**Response:** `201 Created`
```json
{
  "note": {
    "id": "note123...",
    "noteText": "Client had a good day. Participated in activities.",
    "mood": "Happy",
    "incidentFlag": false,
    "behavioursFlag": false,
    "medicationFlag": false,
    "createdAt": "2025-01-15T16:00:00.000Z",
    "author": {
      "name": "John Doe"
    }
  }
}
```

---

### 9. AI Rephrase Note

Rephrase a progress note using AI to be more professional and clinical.

**Endpoint:** `POST /api/mobile/v1/ai/rephrase`

**Request Body:**
```json
{
  "text": "Client was good today. He ate all his food."
}
```

**Response:** `200 OK`
```json
{
  "rephrasedText": "The client demonstrated a positive demeanor throughout the shift. He consumed his entire meal without assistance."
}
```

---

### 10. Get Client Details

Get detailed information about a client (only for clients with assigned shifts).

**Endpoint:** `GET /api/mobile/v1/clients/:id`

**Response:** `200 OK`
```json
{
  "client": {
    "id": "client123...",
    "name": "Jane Smith",
    "ndisNumber": "123456789",
    "dateOfBirth": "1980-05-15T00:00:00.000Z",
    "notes": "Prefers morning shifts",
    "enabledModules": [
      {
        "moduleType": "BOWEL_MONITORING",
        "isEnabled": true
      },
      {
        "moduleType": "BGL_MONITORING",
        "isEnabled": true
      }
    ]
  }
}
```

---

## Error Responses

All endpoints return standard error responses:

**Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

**Common Error Codes:**
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Access denied
- `NOT_FOUND` - Resource not found
- `INVALID_INPUT` - Invalid request data
- `INTERNAL_ERROR` - Server error

**Example Error Response:**
```json
{
  "error": "Shift not found or access denied",
  "code": "NOT_FOUND"
}
```

---

## Security

1. **Authentication Required**: All endpoints require a valid session token
2. **Worker Access Only**: Workers can only access their own assigned shifts
3. **Client Access Control**: Workers can only view clients they have shifts with
4. **Data Validation**: All input is validated before processing

---

## Rate Limiting

Consider implementing rate limiting on the client side to prevent excessive API calls.

---

## Testing

Use tools like Postman, Insomnia, or curl to test the API:

**Example with curl:**
```bash
# Get profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/mobile/v1/profile

# List shifts
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/mobile/v1/shifts?status=PLANNED"

# Create observation
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"moduleType":"BGL_MONITORING","data":{"reading":5.5,"mealContext":"Before Meal"},"recordedAt":"2025-01-15T10:30:00.000Z"}' \
  http://localhost:3000/api/mobile/v1/shifts/SHIFT_ID/observations
```

---

## Support

For issues or questions about the API, contact the development team.
