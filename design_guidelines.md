# Design Guidelines: AI-Powered Keyboard Web Application

## Design Approach: Modern Light Teal Theme

**Selected Approach**: Clean, modern design with teal (#14B8A6) as the primary accent color, emphasizing lightness and clarity.

**Rationale**: This is a utility-focused productivity tool where usability, touch accuracy, and clarity are paramount. The fresh teal accent provides energy while maintaining a professional, clean aesthetic.

**Core Principles**:
- Touch-first optimization with generous tap targets
- Instant visual feedback for all interactions
- Clear mode distinction between Russian layout and AI prompts
- Light, airy aesthetic with teal accent color
- Minimal shadows, white backgrounds for cleanliness

---

## Color Palette

**Primary Accent**: Teal (HSL: 173 85% 32%)
- Used for primary buttons, active states, links
- Light mode variant: `--primary: 173 85% 32%` (darker for WCAG AA contrast with white text)
- Dark mode variant: `--primary: 173 85% 38%`

**Backgrounds**:
- Light mode: Pure white (`#FFFFFF`) for cards, sidebar, popovers
- Dark mode: Deep blue-gray (`200 15% 8%`) for depth

**Text Colors**:
- Primary text: Soft dark (`200 10% 15%`) in light, (`180 10% 95%`) in dark
- Secondary/muted: (`200 5% 45%`) in light, (`180 5% 60%`) in dark

**Borders**: Very subtle, with slight teal undertones
- Light: `180 10% 92%`
- Dark: `200 10% 18%`

---

## Typography System

**Font Family**: System UI stack for native feel
- Primary: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

**Hierarchy**:
- Keyboard buttons: 18px (lg), medium weight (500)
- AI prompt buttons: 16px (base), medium weight (500)
- Input text: 16px (base), regular weight (400)
- Helper text/labels: 14px (sm), regular weight (400)
- Mode toggle labels: 13px (xs), medium weight (500)

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 3, 4, 6, 8**
- Button gaps: `gap-2` (8px between keys)
- Section padding: `p-4` (16px)
- Keyboard container: `p-3` (12px)
- Input field padding: `px-4 py-3`

**Viewport Strategy**:
- Full viewport height layout (`h-screen`)
- Fixed keyboard at bottom
- Flexible text area above
- No scrolling within the app container

**Grid Structure**:
- Russian keyboard: 10 keys per row (standard ЙЦУКЕН layout)
- AI prompts: 2x2 grid for 4 buttons
- All buttons equal width within their respective modes

---

## Component Library

### A. Text Input Area
- Clean, borderless textarea
- Subtle bottom border (1px solid, neutral-200)
- Large tap target, minimum 120px height
- Auto-grows with content
- Paste button: Floating in top-right corner with subtle icon

### B. Keyboard Buttons (Russian Layout)
**Visual Treatment**:
- Rounded corners: `rounded-lg`
- Background: Light gray (`bg-gray-100`)
- Shadow: Subtle lift (`shadow-sm`)
- Min height: 44px (touch-friendly)
- Active state: Darker background (`bg-gray-200`), slight scale down
- Letter spacing: Relaxed for Cyrillic characters

**Special Keys**:
- Shift/Backspace: Slightly wider, icon-based
- Space bar: Full width of bottom row, `rounded-xl`

### C. AI Prompt Buttons
**Visual Treatment**:
- Larger than keyboard keys: min-height 56px
- Rounded: `rounded-xl`
- Each button uses teal-based accent colors:
  - Rephrase: Teal accent (`bg-teal-50`, `border-teal-200`)
  - Translate: Cyan accent (`bg-cyan-50`, `border-cyan-200`)
  - Snippets: Emerald accent (`bg-emerald-50`, `border-emerald-200`)
  - Clipboard: Sky accent (`bg-sky-50`, `border-sky-200`)
- Border: 1px solid for lighter feel
- Icon + label layout (vertical stack)
- Icons: 24px from Lucide
- Use built-in hover-elevate for interactions

### D. Mode Toggle Switch
**Position**: Between input area and keyboard
**Style**:
- Pill-shaped toggle (`rounded-full`)
- Two options: "АБВ" (Russian) | "AI" (Prompts)
- Active state: Filled background
- Smooth transition animation (150ms)
- Full width, centered text

### E. Keyboard Container
**Background**: White with subtle shadow
**Border**: Top border only, 1px solid gray-200
**Padding**: Consistent `p-3`
**Border radius**: Top corners rounded (`rounded-t-2xl`)

---

## Mobile Optimization

**Touch Targets**:
- Minimum 44x44px for all interactive elements
- Keyboard keys: 44px height minimum
- AI buttons: 56px height minimum
- Adequate spacing between buttons (8px gap)

**Viewport Locks**:
- Prevent zoom on input focus: `maximum-scale=1.0`
- Fixed keyboard position prevents layout shift
- Disable pull-to-refresh for keyboard area

**Responsive Breakpoints**:
- Design for 360px-428px width range (standard mobile)
- Scale keyboard button font size slightly on larger phones (sm: breakpoint)

---

## Interaction States

**Button Press Feedback**:
- Scale transform: `active:scale-95`
- Background change on press
- No transition delay (instant feel)
- Haptic feedback triggers (CSS will be `touch-action: manipulation`)

**Disabled States**:
- Reduced opacity: `opacity-50`
- Cursor: not-allowed
- No hover effects

---

## Visual Hierarchy

**Primary Focus**: Text input area - should feel spacious and inviting
**Secondary**: Current active keyboard mode (Russian or AI)
**Tertiary**: Mode toggle

**Contrast Strategy**:
- High contrast for text (gray-900 on white)
- Medium contrast for keyboard keys (gray-700 on gray-100)
- Colorful accents only for AI prompt buttons
- Subtle shadows for depth without distraction

---

## Images

No images required for this application. The interface is purely functional UI components - keyboard buttons, text input, and controls.

---

## Accessibility

- Maintain 4.5:1 contrast ratio for all text
- Clear focus indicators (2px blue ring)
- Semantic button elements throughout
- ARIA labels for icon-only buttons
- Touch target sizes exceed WCAG 2.5.5 requirements (44x44px minimum)