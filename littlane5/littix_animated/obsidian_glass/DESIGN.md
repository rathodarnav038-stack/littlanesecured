---
name: Obsidian Glass
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c9c4d8'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#938ea1'
  outline-variant: '#484555'
  surface-tint: '#cabeff'
  primary: '#cabeff'
  on-primary: '#32009a'
  primary-container: '#947dff'
  on-primary-container: '#2b0088'
  inverse-primary: '#613de0'
  secondary: '#d2bbff'
  on-secondary: '#3d0e84'
  secondary-container: '#57319e'
  on-secondary-container: '#c6aaff'
  tertiary: '#54d7ef'
  on-tertiary: '#00363e'
  tertiary-container: '#009fb5'
  on-tertiary-container: '#002f36'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e6deff'
  primary-fixed-dim: '#cabeff'
  on-primary-fixed: '#1c0062'
  on-primary-fixed-variant: '#4918c8'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#552e9b'
  tertiary-fixed: '#a3eeff'
  tertiary-fixed-dim: '#54d7ef'
  on-tertiary-fixed: '#001f25'
  on-tertiary-fixed-variant: '#004e5a'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 1rem
  island-gap: 1rem
  sidebar-width: 268px
  topbar-height: 64px
  gutter: 24px
---

## Brand & Style
The design system is an enterprise-grade administrative environment built on a foundation of "Obsidian Glass." It targets high-level event coordinators and financial controllers who require a sophisticated, high-performance interface. The aesthetic is rooted in **Glassmorphism** and **Minimalism**, utilizing an OLED-optimized pure black canvas to allow translucent UI elements to appear as though they are floating in deep space.

The emotional response should be one of "Controlled Intensity"—professional and reliable, yet visually striking. The interface uses high-quality background blurs, precise light-leak borders, and vibrant "iris" accents to create a sense of premium hardware.

## Colors
This design system utilizes a "Deep Space" palette. The background is strictly pure black (`#000000`) to maximize contrast and battery efficiency on OLED displays. 

The primary accent is the **Iris Gradient**, transitioning from `#7C5CFC` to `#9F7AEA`. Status colors are vivid and "neon-hot," designed to cut through the glass layers. Every status color must be accompanied by a matching glow shadow (40% opacity of the source color) to simulate light emission. Text follows a tiered hierarchy of white with varying opacities to maintain readability against shifting translucent backgrounds.

## Typography
The typography system prioritizes clarity and a high-tech feel. 

- **Headlines:** Use **Inter** with Bold weights (600-700) and tight letter-spacing to mimic the "SF Pro Display" aesthetic.
- **Body:** Inter is used throughout for its versatility and legibility against glass textures.
- **Data:** **JetBrains Mono** is reserved for tabular data, transaction IDs, currency, and timestamps, ensuring that numbers align vertically and remain readable in high-density tables.

For mobile devices, `display-lg` should scale down to 32px and `headline-lg` to 24px to prevent horizontal overflow.

## Layout & Spacing
The layout follows a **Floating Island** philosophy. Rather than edge-to-edge containers, all major UI structures (Sidebar, Top Bar, Content Area) are discrete glass modules separated by a consistent 16px (`1rem`) margin from the screen edge and each other.

- **Sidebar:** A 268px wide floating vertical panel on the left.
- **Top Bar:** A 64px tall horizontal pill floating at the top of the viewport.
- **Grid:** A 12-column fluid grid is used within the main content island, with 24px gutters.

On mobile, the sidebar collapses into a bottom navigation bar or a glass drawer, and margins reduce to 12px to maximize screen real estate.

## Elevation & Depth
Depth is created through "Material Stack" physics rather than traditional gray shadows:

1.  **Level 0 (Canvas):** Pure Black (#000000).
2.  **Level 1 (Standard Cards):** White fill (4.5% opacity) + 32px Backdrop Blur. A 1px white border (9% opacity) acts as a rim light.
3.  **Level 2 (Overlays/Modals):** Near-black fill (72% opacity) + 40px Backdrop Blur. This creates a "heavy glass" effect that obscures the content below more effectively.
4.  **Shadows:** Use large, ultra-soft shadows (`blur: 40px`, `spread: -10px`) with a black or dark-purple tint to simulate physical lift.

**Lighting:** Apply a subtle linear gradient to the 1px borders—brightest at the top-left, fading to transparent at the bottom-right—to simulate a top-down light source.

## Shapes
The shape language is sophisticated and heavily rounded. 

- **Cards/Modules:** Use a radius of 20px–22px to create a soft, organic feel.
- **Modals:** Use 24px–26px for a more pronounced "protective" enclosure.
- **Interactive Elements:** Buttons and Input fields use a 14px radius. 
- **Pills:** Status badges and the Top Bar utilize full "Pill" rounding (e.g., 100px).

## Components
- **Buttons:** Primary buttons use the Iris Gradient and a `0 4px 20px rgba(124, 92, 252, 0.4)` glow. Action labels are 14px Semibold. Destructive buttons use solid `#FF3B30` with a matching red glow.
- **Badges:** 11px Semibold text. The background opacity is 15% of the status color, while the border is 20%. This creates a "colored glass" look.
- **Inputs:** Designed as "Glass Pills." 1px border (9% white), 14px radius, and 16px horizontal padding. Icons are always rendered in the Tertiary text color unless focused.
- **Sidebar Items:** Active states use a low-opacity Iris-tinted pill background and a small 4px purple dot indicator to the left of the label.
- **Charts:** Use "breathing" gradients for areas. Line paths should be 2.5pt thick with a "glow" duplicate layer beneath the primary path for a neon effect.
- **Interaction:** All interactive components must implement a 98% scale "squish" on `active` states and a brightness boost + expanded glow on `hover`.