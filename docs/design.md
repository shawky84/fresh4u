# Fresh 4 U website: design specification

Audience: European retail and wholesale produce buyers.
Job of the page: make the buyer send an enquiry by WhatsApp or email.
Source of truth for facts: `docs/content.md` (text of the company profile). Do not invent facts, numbers, clients, or destination ports.

## Concept: "Soil to sea"

The page is one journey. The buyer scrolls from the soil, through the field, into the packhouse, to the port, and out to sea.
The ground colour of the page changes with each stage. One continuous line (a root that becomes a shipping route) runs down the page and draws itself with the scroll.
This line and the hero reveal are the two loud things. All other parts stay quiet and exact.

## Stack

- Static files only: `index.html`, `css/site.css`, `js/site.js`, `assets/`. No build step. No framework.
- GSAP 3 + ScrollTrigger and Lenis from cdnjs / jsdelivr, pinned versions. Nothing else.
- Must work from a GitHub Pages sub-path: all URLs relative.
- `prefers-reduced-motion`: no pinning, no scrub, no Lenis. All content visible and static.
- With JavaScript off, all content is readable.

## Tokens

Colour (stage grounds):
- `--soil: #1E130D` hero
- `--field: #0F2A1E` farm, sweet potato, range (this is the green of the original profile)
- `--packhouse: #F2F4EE` process, packaging, quality, certifications (cool, clean, like the packhouse wall)
- `--sea: #0A2A3A` export
- `--flesh: #F07A1A` contact section ground, and the only accent colour everywhere else
- `--skin: #A8452E` secondary, used only in the potato drawings
- `--gold: #D9B45A` only near the logo and for the root line on dark grounds
- Text: `--on-dark: #F4EFE6`, `--on-light: #14201A`. Muted text is the same colour at 68% opacity.

The body background colour changes between stage colours with the scroll (GSAP, scrub). Sections are transparent. Each section sets `data-ground` and a text-colour class.

Type: one family, Bricolage Grotesque (Google Fonts, variable: opsz, wdth, wght).
- Display: wght 800, wdth 75, line-height 0.92, letter-spacing -0.02em, `clamp(3rem, 9vw, 9.5rem)`.
- Section headline: wght 700, wdth 85, `clamp(2.2rem, 5vw, 4.75rem)`, line-height 1.
- Body: wght 400, wdth 100, 1.0625rem to 1.25rem, line-height 1.5, max 62 characters per line.
- Data (weights, kg, months): wght 600, tabular numbers.
- Type motion: display headlines change the `wdth` axis from 75 to 100 as they cross the viewport (scrub). This is the "growth" motif. Use it on section headlines only.
- Sentence case everywhere. No all-caps labels. No small label above headings. No "→" in buttons. No middle-dot lists. No monospace.

Shape:
- Photos have a large radius on one diagonal pair of corners only (`border-radius: 2.5rem 0.5rem`), like a leaf. No cards with borders and shadows. Separate things with space and ground colour.
- Buttons: pill, `--flesh` ground with `--soil` text. Secondary: text with a 2px underline.
- Left-aligned layout on a 12-column grid, max width 1440px, side gutter `clamp(1rem, 4vw, 4rem)`. Large asymmetric white space. Headlines can break the grid to the left edge.
- A fine film-grain overlay (SVG noise, 6% opacity, fixed) over dark grounds to join the low-resolution real photos to the design.

## The root line

A fixed-position SVG on the left gutter (desktop) with one path. It starts as a thin root with 2 or 3 small side roots in the hero, becomes a straight stem through the middle stages, and in the export section it leaves the gutter and becomes the shipping route on the map.
Stroke: `--gold` on dark, `--on-light` at 40% on light, 1.5px. It draws with `stroke-dashoffset` tied to total scroll progress.
At each stage start there is a small node on the line with the stage name beside it: Soil, Field, Packhouse, Port, Sea. The current stage name is full opacity, the others 35%. These names are also the navigation (click to scroll).
On mobile: replace it with a thin progress bar at the top and no stage names.

## Sections, in order

### 0. Header
Logo (`assets/logo.webp`, 44px) left. Right: "Sweet potatoes", "Process", "Export", and the button "Request a quote". Transparent ground, text colour follows the stage. Hides on scroll down, shows on scroll up.

### 1. Hero (soil)
```
[logo]                                  Sweet potatoes  Process  Export  (Request a quote)

From Egyptian
soils to global            .-''''-.
markets.                 /  FIELD   \      <- field photo seen through a
                        |   PHOTO    |        sweet-potato-shaped window
Grower and exporter      \          /
of fresh produce.         '-.____.-'
(Request a quote on WhatsApp)   See the season calendar
```
- Display headline: "From Egyptian soils to global markets." (the company's own line).
- Sub line: "Fresh 4 U grows sweet potatoes on its own farms in Egypt and exports fresh fruit and vegetables to European and international buyers."
- The window: an SVG clipPath in the shape of a sweet potato (a long spindle, pointed at both ends, a little fatter on one side, tilted about 20 degrees). Behind it: `assets/field-rows.webp`.
- Load sequence (the single orchestrated moment, about 1.6s): headline lines rise from a mask one after the other, then the potato window grows from 0.6 to 1 scale with a slow rotation of 6 degrees, then the sub line and buttons fade in.
- Scroll: the hero pins. The potato window scales up until the field photo fills the viewport. The headline moves out to the top. Then the ground becomes `--field` and section 2 text comes in over the photo with a dark gradient at the bottom.

### 2. Own farms (field)
Headline: "We grow what we ship."
Text: sweet potatoes grown and sourced directly from Fresh 4 U's own farms; other produce sourced through external suppliers according to specification, season and customer requirement (use the profile wording).
Second photo `assets/field-harvest.webp` to the right, offset low, with parallax of about 8%.
A two-item statement in large type, side by side: "Own farms: sweet potatoes" and "Partner suppliers: all other produce".

### 3. Film (field)
Only if `assets/film.mp4` exists. A wide 16:9 video with poster `assets/film-poster.webp`, muted, `playsinline`, plays when 60% in view, native controls on click. Line above: "The journey in 20 seconds." If the file is absent, remove this section from the HTML before finishing.

### 4. Sweet potatoes (field)
Headline: "Two varieties. Eleven months of supply."
Left: `assets/sweet-potato-pile.webp` and `assets/varieties.webp`.
Right, three data graphics (these must be excellent, they are the buyer's reason to stay):

a) Season calendar. 12 month columns, July first. Two bars: Beauregard August to May, Bellevue July to January. Bars are `--flesh` and `--skin`, they grow from the left on enter. The current month column (from the visitor's clock) has a marker and a line of text: "In season now: Beauregard and Bellevue" (compute it; handle the June case: "Next harvest starts in July").

b) Size ladder. Five sweet potato silhouettes (same SVG shape as the hero) in a row on one baseline, scaled by weight: Small 100–150 g, Medium 150–300 g, L1 300–450 g, L2 450–600 g, XL 600–900 g. Name and weight under each. On hover or focus a silhouette fills with `--flesh`.

c) One sentence on curing: "Cured 7–10 days or longer under controlled conditions, then washed, graded and packed to your specification."

### 5. Process (packhouse) — the ground changes to light here
Headline: "Six steps between the field and the container."
Pinned horizontal scroll on desktop: six panels move sideways. Each panel: a very large number (01 to 06, wght 800, `--flesh`; numbers are correct here because it is a real sequence), the step name, the one-line description from the profile, and its photo `assets/process-1.webp` … `process-6.webp`.
Steps: Farming and harvesting; Sorting, grading and sizing; Curing; Washing; Packaging; Container loading.
A thin progress line under the panels fills with the scroll. On mobile: a normal vertical list.

### 6. Packaging (packhouse)
Headline: "Packed the way your market wants it."
Five formats drawn as simple line SVGs (carton box, plastic crate, sack, carton bin, wooden bin) on one baseline, bins visibly much larger than boxes. Under each: name and weights (Carton boxes 6 kg / 14 kg; Plastic crates 6 kg / 14 kg; Sacks 6 kg / 14 kg; Carton bins 550 kg; Wooden bins 550 kg).
Line below: "Other packaging on request."

### 7. Range (field) — ground returns to green
Headline: "More than sweet potatoes."
Six photo tiles, uneven sizes in a 12-column grid: Grapes, Pomegranates, Green onions, Iceberg lettuce, Bell peppers, Watermelon (`assets/produce-<name>.webp`). Name in the lower-left corner of each photo. Then a line of large text: "Also potatoes, garlic and oranges."
Hover: the photo scales to 1.04 inside its frame. No other effect.

### 8. Quality and people (packhouse)
Headline: "Quality starts with people."
Team photo `assets/team.webp` large on the left. Right: the three points from the profile (Product quality; Workers' hygiene and discipline; Food safety and handling) as three short paragraphs with bold lead-ins. No numbers (not a sequence).
Pull line in large type: "A clean, disciplined team is an essential part of product quality."

### 9. Certifications (packhouse)
Headline: "Certified in the name of Fresh 4 U."
Four large text wordmarks in a row with one line each: GLOBALG.A.P. (agricultural production standard), GRASP (social practice assessment), ISO (international management standards), SMETA (ethical trade audit). Set them as type, not logo images (certification logos have licence rules). Line below: "Certificates available on request."

### 10. Export (sea) — ground changes to deep blue
Headline: "Three ports. Your terms."
Left: a simple SVG map of the eastern Mediterranean: the Egyptian coast and Nile delta as one clean line shape in `--field` tint, sea is the ground. Three port dots with names: Alexandria, Damietta, Port Said. The root line arrives here, splits into three routes from the ports and they draw north-west toward the top-left edge of the map and leave the frame. Do not name destination ports.
Right: four blocks from the profile: Temperature-controlled shipping; Ports and container loading; Flexible terms (FOB, CFR, CIF set large); Documents and traceability (Phytosanitary Certificate, Certificate of Origin, EUR.1).
Line below: "Shipping lines: Maersk, MSC, CMA, Hapag-Lloyd." as plain text.

### 11. Why Fresh 4 U (sea)
Five short reasons from the profile as a large-type list, one per line, each line has the reason name in full opacity and the description at 68%. No numbers, no icons.

### 12. Enquiry (flesh) — full orange ground, `--soil` text
Display headline: "Tell us what you need. We reply with an offer."
Enquiry builder (no backend). Fields: Product (select: Sweet potatoes Beauregard, Sweet potatoes Bellevue, Grapes, Pomegranates, Green onions, Iceberg lettuce, Bell peppers, Watermelon, Potatoes, Garlic, Oranges, Other), Size (shown only for sweet potatoes: Small, Medium, L1, L2, XL, Mixed), Packaging (the five formats, Other), Volume (free text, placeholder "for example 1 x 40 ft reefer per week"), Destination port or country (text), Terms (FOB, CFR, CIF), Company and name (text).
Below, a live preview of the message in a plain box. Two buttons: "Send on WhatsApp" (opens `https://wa.me/201127222204?text=<encoded message>`) and "Send by email" (opens `mailto:info@fresh4ueg.com` with subject "Enquiry: <product>" and the message as body). Real `<label>` elements. Required: product and destination. Show a plain error line next to a missing field; do not open the link.
Under it, direct contacts in large type: WhatsApp +20 112 722 2204, +20 122 757 7570, the email, "Cairo, Egypt".

### Footer (flesh, continues)
Logo, the tagline, year. Nothing else.

## Quality floor
- Responsive from 360px. Test at 390, 768, 1440.
- Visible focus ring (2px `--flesh`, on the orange ground use `--soil`). Colour contrast AA.
- Images: `loading="lazy"` except hero, `width`/`height` set, descriptive `alt`.
- `<title>`, meta description, Open Graph tags with `assets/og.jpg`, favicon from the logo.
- Lighthouse performance target above 85 on mobile. Total page weight under 3 MB without the film.
- One runnable check: `node test/enquiry.test.js` that asserts the message and the two link builders for one sample input, and the season function for January, June and August.
