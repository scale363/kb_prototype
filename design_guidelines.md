# Design Guidelines: AI-Powered Input Assistant

## Design Approach: Modern Utility Interface

**Selected Approach**: Material Design principles with grayscale minimalism + strategic color accents

**Rationale**: Clean, distraction-free productivity tool where clarity and usability are paramount. Grayscale foundation with accent colors creates visual hierarchy without overwhelming the interface.

**Core Principles**:
- Grayscale foundation with purposeful color accents
- Generous whitespace and breathing room
- Instant visual feedback for interactions
- Professional, enterprise-grade aesthetic

---

## Typography System

**Font Family**: System UI stack
- Primary: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

**Hierarchy**:
- Header title: 24px (2xl), semibold (600)
- Button labels: 16px (base), medium (500)
- Input text: 16px (base), regular (400)
- Section labels: 12px (xs), uppercase, medium (500), tracking-wide

---

## Layout System

**Spacing Primitives**: Tailwind units of **3, 4, 6, 8, 12**

**Structure**:
- Container padding: `p-6` (24px)
- Section gaps: `gap-6` (24px between major sections)
- Button grid gap: `gap-4` (16px between buttons)
- Component internal padding: `p-4` (16px)

**Viewport Strategy**:
- Full viewport height (`min-h-screen`)
- Centered content with max-width constraint (`max-w-2xl mx-auto`)
- Fixed padding throughout

---

## Color System

**Grayscale Palette**:
- Background: White (`bg-white`)
- Containers: Light gray (`bg-gray-50`)
- Borders: Medium gray (`border-gray-200`)
- Text primary: Dark gray (`text-gray-900`)
- Text secondary: Medium gray (`text-gray-600`)
- Shadows: Subtle gray (`shadow-md` with gray tones)

**Accent Colors** (icons only):
- Rephrase: `text-blue-600`
- Translate: `text-purple-600`
- Snippets: `text-green-600`
- Clipboard: `text-orange-600`

---

## Component Library

### A. Header
- Full-width container
- Title: "AI Input Assistant" or similar
- Padding: `py-8`
- Bottom border: 1px solid gray-200
- Text alignment: Center

### B. Input Container
**Visual Treatment**:
- Background: `bg-gray-50`
- Border: 2px solid `border-gray-200`
- Corner radius: `rounded-xl`
- Padding: `p-4`
- Shadow: `shadow-md`

**Label Section**:
- "INPUT" label in top-left
- Copy icon button in top-right (24px Heroicon)
- Both in `text-gray-600`
- Spacing: `mb-3` between label row and textarea

**Textarea**:
- Borderless, transparent background
- Min height: 120px
- Full width
- Font size: 16px
- Placeholder: "Type or paste your text here..."
- No resize handle

### C. Action Buttons Grid (2x2)
**Grid Structure**:
- Two columns on all viewports: `grid-cols-2`
- Equal height buttons: `aspect-square` or min-height: 140px
- Gap: `gap-4`

**Button Visual Treatment**:
- Background: `bg-gray-50`
- Border: 2px solid `border-gray-200`
- Corner radius: `rounded-xl`
- Shadow: `shadow-md`
- Padding: `p-6`
- Hover state: `bg-gray-100`, `shadow-lg`
- Active state: `scale-95`

**Button Content Layout**:
- Vertical stack (flex column)
- Icon at top (32px Heroicon with accent color)
- Label below icon (16px, medium weight, gray-900)
- Gap: `gap-3` between icon and label
- Text alignment: Center

**Specific Buttons**:
1. **Rephrase**: Icon in `text-blue-600`
2. **Translate**: Icon in `text-purple-600`
3. **Snippets**: Icon in `text-green-600`
4. **Clipboard**: Icon in `text-orange-600`

### D. Shadows Strategy
- Input container: `shadow-md` (medium depth)
- Buttons: `shadow-md` default, `shadow-lg` on hover
- No shadows on header
- All shadows use gray tones for cohesion

---

## Interaction States

**Button Feedback**:
- Hover: Background lightens to `bg-gray-100`, shadow increases to `shadow-lg`
- Active: Scale down to 95% (`active:scale-95`)
- Transition: 150ms ease for all properties
- Cursor: pointer

**Input Focus**:
- Border color: `border-blue-500`
- Ring: 2px blue ring (`ring-2 ring-blue-500`)
- Transition: Smooth 200ms

---

## Visual Hierarchy

**Primary**: Input container (largest, most prominent)
**Secondary**: Action buttons (colorful icons draw attention)
**Tertiary**: Header and labels

**Spacing Rhythm**:
- Header to input: 32px (`mt-8`)
- Input to buttons: 24px (`mt-6`)
- Consistent vertical flow

---

## Icons

**Library**: Heroicons (via CDN)
**Sizes**:
- Button icons: 32px (w-8 h-8)
- Copy icon: 20px (w-5 h-5)
**Style**: Outline variant for all icons

---

## Accessibility

- 4.5:1 contrast ratio maintained throughout
- Focus indicators: 2px blue ring on all interactive elements
- Touch targets: Minimum 44x44px (buttons exceed at 140px)
- Semantic HTML: `<button>`, `<textarea>` elements
- ARIA labels for icon-only buttons
- Keyboard navigation support

---

## Mobile Optimization

**Responsive Behavior**:
- Single column layout maintained across all viewports
- Buttons remain 2x2 grid even on mobile
- Touch-optimized sizes (140px button height)
- Padding scales appropriately: `p-4` mobile, `p-6` desktop

**Performance**:
- System fonts for instant load
- Minimal shadows (hardware-accelerated)
- No images or heavy assets