# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Explore view: coordinates and lunar nodes

The `/explore` page (`src/components/explore/`) draws the sky from `src/lib/ephemeris.ts`, a pure module on
[astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT). It uses the same conventions as the
Akashvani engine behind the Kundli page, so both always agree.

**Coordinate chain**

1. **J2000 equatorial (EQJ).** What astronomy-engine returns: Earth's equator and equinox at 2000-01-01 12:00 TT.
2. **True ecliptic and equinox of date.** `Rotation_EQJ_ECT` applies precession and nutation. Every longitude and
   every 3D position (heliocentric and geocentric) is in this frame: x towards the equinox of date, z towards the
   north ecliptic pole. Longitudes here are *tropical*.
3. **Sidereal.** `sidereal = tropical − ayanamsa`, with the True Chitra Paksha ayanamsa: Spica (Chitra) is placed
   at exactly 180°, computed from its J2000 position and proper motion. About 23.85° at J2000, growing ~50″ a year.
   The zodiac ring in the scene is drawn in sidereal longitude and rotated by the ayanamsa, so Mesha 0° points at
   tropical longitude = ayanamsa.

In the scene the ecliptic is the XZ plane and +Y is the north ecliptic pole: an ecliptic vector (x, y, z) is
drawn at (x, z, −y). Distances are log-compressed by default (`6·log2(1 + AU)`); "True scale" in the heliocentric
view is linear.

**Rahu and Ketu**

- *Mean node* (default, the Vedic standard): Ω = 125.0445479° − 1934.1362891°·T + 0.0020754°·T² + T³/467441 −
  T⁴/60616000, T in Julian centuries TT from J2000. It moves backward about 19.35° a year (one turn in 18.6 years).
- *True node*: the osculating node. From the Moon's geocentric position r and velocity v (±1 hour difference) in the
  ecliptic of date, the orbit's angular momentum is h = r × v, and the ascending node points along ẑ × h. It wobbles
  up to about 1.7° around the mean node.
- Ketu is always Rahu + 180°. The Moon's orbit is drawn tilted 5.145° about the nodal line.
- *Eclipse season*: the Sun within 18° of either node. The next eclipses come from astronomy-engine's
  `SearchGlobalSolarEclipse` and `SearchLunarEclipse`.

**Tests** (`src/lib/ephemeris.test.ts`) compare against NASA JPL Horizons on three dates (all ten bodies within
20″, true node within 8″) and against the Akashvani engine (ayanamsa and mean Rahu exact, Kathmandu lagna within 6″).
