For **your political candidate Smart Schedule + Route Planning application**, you absolutely do **not** need all 32 Google Maps products.

I would divide them into **Required, Useful Later, and Not Required**.

## 1. REQUIRED FOR V1

These are the core modules I would enable/use.

| Google API / Module        | Why we need it                                       | Priority         |
| -------------------------- | ---------------------------------------------------- | ---------------- |
| **Maps JavaScript API**    | Display interactive map in dashboard                 | REQUIRED         |
| **Places API (New)**       | Search/select villages, offices, halls, venues, etc. | REQUIRED         |
| **Routes API**             | Calculate actual route, distance and travel time     | REQUIRED         |
| **Geocoding API**          | Convert addresses ↔ latitude/longitude               | REQUIRED         |
| **Route Optimization API** | Advanced multi-stop route optimization               | OPTIONAL/PHASE 2 |
| **Address Validation API** | Validate entered addresses                           | OPTIONAL         |

### So the minimum V1 is:

**1. Maps JavaScript API**
**2. Places API (New)**
**3. Routes API**
**4. Geocoding API**

That's enough to build the core application.

---

# 2. VERY IMPORTANT: Routes API vs Route Optimization API

These two are different.

### Routes API

Answers:

> "How long does it take to travel from A to B?"

and:

> "What's the route between these locations?"

We definitely need this.

Example:

```text
Guntur
   ↓
12.4 km
   ↓
Mangalagiri
```

Google returns:

```text
Distance: 12.4 km
Duration: 27 min
Route: ...
```

---

### Route Optimization API

Answers:

> "I have 15 locations and different constraints. What is the best sequence?"

For example:

```text
A
B
C
D
E
F
```

It can help with vehicle routing / optimization scenarios.

For your application, however, I would **not make this the foundation of the V1 algorithm**.

I'd initially use:

**Routes API → travel matrix**

*

**Our own scheduling algorithm / OR-Tools**

That gives you much more control over political-specific requirements such as:

* Fixed meetings
* Flexible meetings
* Priority
* Event duration
* Preferred time
* Candidate availability
* Buffer
* Start location
* End location
* Maximum travel time

---

# 3. Places API (New) — VERY IMPORTANT

This will probably be one of your most-used services.

Your PA types:

> "Tadikonda"

or:

> "Tadikonda party office"

or:

> "Government hospital Guntur"

The application shows Google suggestions.

```text
Search Location

[Tadikonda...................]

Google Results

● Tadikonda, Andhra Pradesh
● Tadikonda Bus Stand
● Tadikonda Government Hospital
● ...
```

User selects one.

You save:

```text
Place ID
Latitude
Longitude
Address
Name
```

Then you don't need to search again.

---

# 4. Maps JavaScript API

This is for your actual dashboard map.

For example:

```text
┌───────────────────────┬────────────────────────────┐
│                       │                            │
│    TODAY'S SCHEDULE   │           MAP              │
│                       │                            │
│  09:00 Party Office   │        ②                   │
│       ↓               │       /                    │
│  09:30 Village A      │   ①──                     │
│       ↓               │        \                   │
│  10:30 Meeting        │         ③                 │
│       ↓               │          \                │
│  12:00 Public Event   │           ④              │
│                       │                            │
└───────────────────────┴────────────────────────────┘
```

The map can display:

* Markers
* Routes
* Event numbers
* Candidate location
* Start/end locations
* Route lines
* Event information

---

# 5. Geocoding API

Useful when you already have an address.

Example:

```text
"Main Road, Mangalagiri, Andhra Pradesh"
```

↓

```text
Latitude:
16.xxxxx

Longitude:
80.xxxxx
```

But there's an important distinction:

### Places

Best for:

> "Find this place"

### Geocoding

Best for:

> "Convert this address into coordinates."

For your application, **Places should be the primary location-entry mechanism**.

---

# 6. Route Matrix

This is actually one of the **most important capabilities** for your smart scheduler.

Using Routes API's Compute Route Matrix, you can obtain travel times/distances between multiple origins and destinations.

For example:

```text
             A       B       C       D
         ───────────────────────────────
A        │   0      18      32      41
B        │  19       0      17      29
C        │  33      18       0      22
D        │  42      30      23       0
```

Your optimizer uses this information.

This is what allows us to calculate:

> **"Which location should the candidate visit next?"**

---

# 7. Navigation SDK — NOT REQUIRED FOR V1

You might think we need this because the candidate needs navigation.

Actually, no.

For V1:

```text
Our App
   ↓
Optimized schedule
   ↓
[ Navigate ]
   ↓
Google Maps
```

Let Google Maps handle turn-by-turn navigation.

You don't need to build navigation into your application.

### Later

If you want an embedded navigation experience:

```text
Candidate App
      ↓
Navigation SDK
      ↓
Turn-by-turn navigation
```

Then consider Navigation SDK.

But **don't add this complexity to V1**.

---

# 8. Directions API — DON'T USE

You listed:

**Directions API**

This is an older/legacy-style service.

For a new application, I'd build around:

**Routes API**

rather than designing the system around the legacy Directions API.

---

# 9. Distance Matrix API — DON'T USE

You also listed:

**Distance Matrix API**

Again, don't build your new application around this.

Use:

**Routes API → Compute Route Matrix**

instead.

That keeps the architecture aligned with Google's current Routes platform.

---

# 10. Maps Static API — OPTIONAL

This generates static map images.

Useful for:

### PDF schedule

For example:

```text
28 AUGUST 2026
CANDIDATE SCHEDULE

[ STATIC MAP IMAGE ]

09:00 — Party Office
10:30 — Collector Meeting
12:00 — Village Meeting
02:00 — Public Meeting
```

You can add this later.

Not required for the core application.

---

# 11. Address Validation API — OPTIONAL

This can help ensure that addresses entered manually are valid.

For example:

```text
Entered:

12-4-123
Main Road
Guntur
```

The system validates/corrects the address.

Useful, but **not essential** because Places will handle most of your location-entry workflow.

---

# 12. Roads API — NOT REQUIRED

Roads API is useful for things such as:

* Snap GPS coordinates to roads
* Road information
* Speed limits

But V1 doesn't need it.

Later, if you implement:

**Live candidate tracking**

then Roads API could become useful.

---

# 13. Street View — NOT REQUIRED

Street View could be useful later for:

> "Show the PA what the venue entrance looks like."

But absolutely not necessary for scheduling.

---

# 14. Map Tiles API — NOT REQUIRED IF USING MAPS JAVASCRIPT

If you're using Google Maps JavaScript API normally, you don't need to separately build your application around Map Tiles API.

Map Tiles becomes more relevant for custom map rendering/use cases.

Don't complicate V1.

---

# 15. Time Zone API — OPTIONAL

Since your application is primarily India-based:

```text
Asia/Kolkata
```

you can simply store the campaign timezone.

If you eventually support:

* Multiple states
* International campaigns
* Multiple time zones

then Time Zone API becomes useful.

Not V1.

---

# 16. The 32 modules → Our application

I'd classify your list like this:

### USE NOW

```text
✓ Maps JavaScript API
✓ Places API (New)
✓ Routes API
✓ Geocoding API
```

### ADD LATER

```text
○ Route Optimization API
○ Address Validation API
○ Navigation SDK
○ Roads API
○ Maps Static API
○ Street View Static API
○ Time Zone API
```

### NOT NEEDED FOR THIS PRODUCT

```text
✕ Maps Embed API
✕ Map Tiles API
✕ Places UI Kit
✕ Aerial View API
✕ Maps Elevation API
✕ Maps 3D SDK for Android
✕ Street View Publish API
✕ Maps 3D SDK for iOS
✕ Maps Grounding Lite
✕ Places Aggregate API
✕ Cloud Location Finder API
✕ Maps Datasets API
✕ Pollen API
✕ Air Quality API
✕ Solar API
✕ Geolocation API
✕ Maps SDK for iOS
```

---

# 17. But there's one change I'd make to our previous architecture

For your specific application, I'd make the routing layer:

```text
                 ROUTING SERVICE
                       │
          ┌────────────┴────────────┐
          │                         │
     Google Routes API         Future Providers
          │                    ┌──────────────┐
          │                    │ OSRM         │
          │                    │ Valhalla     │
          │                    └──────────────┘
          │
     ┌────┴─────┐
     │          │
Compute Route  Compute
              Route Matrix
     │          │
     └────┬─────┘
          │
          ▼
    SMART SCHEDULER
          │
          ▼
       OR-Tools
```

This is the cleanest architecture.

---

# 18. Final V1 Google Stack

If we're starting development **today**, I'd enable only:

### Google Cloud

```text
Maps JavaScript API
Places API (New)
Routes API
Geocoding API
```

Then our application handles:

```text
Campaign Management
       ↓
Candidate
       ↓
Events
       ↓
Locations
       ↓
Fixed / Flexible
       ↓
Google Places
       ↓
Google Routes
       ↓
Route Matrix
       ↓
OR-Tools
       ↓
Smart Schedule
       ↓
Google Maps Visualization
```

### The actual product becomes:

**Political Campaign Smart Scheduler**

with:

**Event Management + Google Location Search + Distance/Time Calculation + Route Optimization + Conflict Detection + Schedule Generation + Map + Mobile PA Dashboard**

That is the right V1 scope.
