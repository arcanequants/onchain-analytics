# 🔧 Theme System Developer Guide
## Quick Implementation Reference

### ⚡ Quick Start (5 Minutes)

#### Using the Theme in Your Component

```typescript
'use client'

import { useTheme } from '@/contexts/ThemeContext'

export function MyComponent() {
  const { mode, resolvedTheme, setMode, cycleMode } = useTheme()

  return (
    <div>
      <p>Current mode: {mode}</p>
      <p>Active theme: {resolvedTheme}</p>

      {/* Cycle through modes */}
      <button onClick={cycleMode}>Change Theme</button>

      {/* Set specific mode */}
      <button onClick={() => setMode('dark')}>Always Dark</button>
      <button onClick={() => setMode('light')}>Always Light</button>
      <button onClick={() => setMode('auto')}>Auto Mode</button>
    </div>
  )
}
```

---

### 🎨 Styling with CSS Variables

All colors are already defined in `globals.css`. Just use the CSS variables:

```css
/* Your component styles */
.my-card {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
}

.my-button {
  background: var(--accent-primary);
  color: white;
}

.my-button:hover {
  background: var(--accent-secondary);
  box-shadow: 0 0 12px var(--accent-glow);
}

.success-badge {
  background: var(--success);
  box-shadow: 0 0 8px var(--success-glow);
}

.danger-badge {
  background: var(--danger);
  box-shadow: 0 0 8px var(--danger-glow);
}
```

---

### 📋 Available CSS Variables

#### Backgrounds
```css
var(--bg-primary)      /* Main background */
var(--bg-secondary)    /* Cards, panels */
var(--bg-tertiary)     /* Nested elements */
var(--bg-card)         /* Card backgrounds */
```

#### Text Colors
```css
var(--text-primary)    /* Main text */
var(--text-secondary)  /* Labels, secondary text */
var(--text-tertiary)   /* Muted text */
```

#### Borders
```css
var(--border-primary)    /* Default borders */
var(--border-secondary)  /* Accent borders */
```

#### Accent Colors
```css
var(--accent-primary)    /* Primary accent (blue) */
var(--accent-secondary)  /* Hover states */
var(--accent-glow)       /* Glow effects */
```

#### Status Colors
```css
var(--success)       /* Success/positive */
var(--success-dark)  /* Success dark variant */
var(--success-glow)  /* Success glow effect */

var(--danger)        /* Error/negative */
var(--danger-glow)   /* Danger glow effect */

var(--warning)       /* Warning states */
var(--warning-glow)  /* Warning glow effect */
```

#### Shadows
```css
var(--shadow-sm)  /* Small shadow */
var(--shadow-md)  /* Medium shadow */
var(--shadow-lg)  /* Large shadow */
```

#### Special
```css
var(--grid-color)  /* Animated grid background */
```

---

### 🔌 Hook API Reference

```typescript
import { useTheme } from '@/contexts/ThemeContext'

const {
  mode,           // 'auto' | 'dark' | 'light' - User's preference
  resolvedTheme,  // 'dark' | 'light' - Currently active theme
  setMode,        // (mode: ThemeMode) => void - Set specific mode
  cycleMode       // () => void - Cycle through modes
} = useTheme()
```

#### Type Definitions

```typescript
export type ThemeMode = 'auto' | 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'

interface ThemeContextType {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  cycleMode: () => void
}
```

---

### 💡 Common Use Cases

#### 1. Conditional Rendering Based on Theme

```typescript
function MyComponent() {
  const { resolvedTheme } = useTheme()

  return (
    <div>
      {resolvedTheme === 'dark' ? (
        <DarkModeSpecificComponent />
      ) : (
        <LightModeSpecificComponent />
      )}
    </div>
  )
}
```

#### 2. Mode-Specific Styling

```typescript
function MyComponent() {
  const { mode } = useTheme()

  return (
    <div className={`card ${mode === 'auto' ? 'auto-indicator' : ''}`}>
      {mode === 'auto' && <span>🔄 Auto Mode Active</span>}
      {/* Your content */}
    </div>
  )
}
```

#### 3. Custom Theme Toggle

```typescript
function CustomThemeButton() {
  const { mode, setMode } = useTheme()

  const handleToggle = () => {
    // Your custom logic
    if (mode === 'dark') {
      setMode('light')
    } else if (mode === 'light') {
      setMode('auto')
    } else {
      setMode('dark')
    }
  }

  return <button onClick={handleToggle}>Toggle Theme</button>
}
```

#### 4. Theme-Aware Images

```typescript
function LogoComponent() {
  const { resolvedTheme } = useTheme()

  return (
    <img
      src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
      alt="Logo"
    />
  )
}
```

---

### 🎯 Best Practices

#### ✅ DO

1. **Use CSS Variables**
   ```css
   /* Good */
   .card { background: var(--bg-card); }
   ```

2. **Use resolvedTheme for Current State**
   ```typescript
   // Good - use resolvedTheme to know what's actually displayed
   const { resolvedTheme } = useTheme()
   ```

3. **Smooth Transitions**
   ```css
   /* Good */
   .element {
     transition: background-color 0.3s ease, color 0.3s ease;
   }
   ```

4. **Test Both Themes**
   Always test your component in both dark and light modes.

5. **Use Semantic Variables**
   ```css
   /* Good - semantic meaning */
   background: var(--bg-card);

   /* Bad - hard-coded */
   background: #0a0e1a;
   ```

#### ❌ DON'T

1. **Don't Hard-Code Colors**
   ```css
   /* Bad */
   .card { background: #0a0e1a; color: #e0e0e0; }
   ```

2. **Don't Use `theme` (deprecated)**
   ```typescript
   // Bad - old API
   const { theme } = useTheme()

   // Good - new API
   const { mode, resolvedTheme } = useTheme()
   ```

3. **Don't Conditionally Load Styles**
   ```typescript
   // Bad - causes flash
   if (resolvedTheme === 'dark') {
     import('./dark-styles.css')
   }

   // Good - use CSS variables that change automatically
   ```

4. **Don't Manually Set data-theme**
   ```typescript
   // Bad - ThemeContext handles this
   document.documentElement.setAttribute('data-theme', 'dark')

   // Good - use the hook
   setMode('dark')
   ```

---

### 🧪 Testing Your Component

#### Unit Tests

```typescript
import { render } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders in dark mode', () => {
    // Mock localStorage
    localStorage.setItem('theme-mode', 'dark')

    const { container } = render(
      <ThemeProvider>
        <MyComponent />
      </ThemeProvider>
    )

    expect(container.querySelector('[data-theme="dark"]')).toBeInTheDocument()
  })
})
```

#### Visual Testing Checklist

- [ ] Component looks good in dark mode
- [ ] Component looks good in light mode
- [ ] Transitions are smooth (0.3s)
- [ ] No flash when switching themes
- [ ] Colors have proper contrast
- [ ] Interactive elements have hover states
- [ ] Focus states are visible

---

### 🔄 Migration Guide

#### From Old Theme System

**Old Code:**
```typescript
const { theme, toggleTheme } = useTheme()

<button onClick={toggleTheme}>
  {theme === 'dark' ? 'Light' : 'Dark'}
</button>
```

**New Code:**
```typescript
const { mode, resolvedTheme, cycleMode } = useTheme()

<button onClick={cycleMode}>
  {mode === 'auto' ? '🔄' : mode === 'dark' ? '🌙' : '☀️'}
</button>
```

#### Backward Compatibility

The new system automatically migrates old `theme` localStorage values:

- Old `localStorage.theme = 'dark'` → New `localStorage.theme-mode = 'dark'`
- Old `localStorage.theme = 'light'` → New `localStorage.theme-mode = 'light'`

Legacy `Theme` type is still exported for compatibility:
```typescript
export type Theme = ResolvedTheme // 'dark' | 'light'
```

---

### 🎨 Adding New CSS Variables

To add a new color to the theme system:

1. **Define in globals.css**

```css
/* Dark Mode */
:root[data-theme="dark"] {
  --my-custom-color: #ff00ff;
  --my-custom-glow: rgba(255, 0, 255, 0.5);
}

/* Light Mode */
:root[data-theme="light"] {
  --my-custom-color: #cc00cc;
  --my-custom-glow: rgba(204, 0, 204, 0.3);
}
```

2. **Use in your component**

```css
.my-element {
  background: var(--my-custom-color);
  box-shadow: 0 0 12px var(--my-custom-glow);
}
```

---

### 📦 Component Template

Use this template for new components that need theme support:

```typescript
'use client'

import { useTheme } from '@/contexts/ThemeContext'
import styles from './MyComponent.module.css'

interface MyComponentProps {
  // Your props
}

export default function MyComponent({ }: MyComponentProps) {
  const { mode, resolvedTheme } = useTheme()

  return (
    <div className={styles.container}>
      {/* Your component JSX */}
    </div>
  )
}
```

```css
/* MyComponent.module.css */
.container {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.container:hover {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-md);
}
```

---

### 🐛 Debugging

#### Check Current Theme State

```typescript
function DebugPanel() {
  const { mode, resolvedTheme } = useTheme()

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px'
    }}>
      <p>Mode: {mode}</p>
      <p>Resolved: {resolvedTheme}</p>
      <p>LocalStorage: {localStorage.getItem('theme-mode')}</p>
      <p>data-theme: {document.documentElement.getAttribute('data-theme')}</p>
    </div>
  )
}
```

#### Common Issues

**Issue**: Theme not applying
- ✅ Check: Is component wrapped in `<ThemeProvider>`?
- ✅ Check: Are you using CSS variables, not hard-coded colors?
- ✅ Check: Is `data-theme` attribute on `<html>` element?

**Issue**: Flash on page load
- ✅ Check: Is inline script in layout.tsx present?
- ✅ Check: Is script using `strategy="beforeInteractive"`?

**Issue**: Auto mode not switching
- ✅ Check: Console for errors
- ✅ Check: localStorage has 'theme-mode' = 'auto'
- ✅ Check: Time is between 6 AM and 6 PM for light mode

---

### 📚 Reference Files

- **ThemeContext**: `src/contexts/ThemeContext.tsx`
- **ThemeToggle**: `src/components/ThemeToggle.tsx`
- **CSS Variables**: `src/app/globals.css`
- **Layout**: `src/app/layout.tsx`
- **Architecture**: `docs/THEME-SYSTEM-ARCHITECTURE.md`
- **User Guide**: `docs/THEME-SYSTEM-USER-GUIDE.md`

---

### 🚀 Performance Tips

1. **CSS Variables are Fast**: They don't trigger React re-renders
2. **Use Transitions Wisely**: 0.3s is optimal for theme changes
3. **Avoid Inline Styles**: CSS variables in classes are faster
4. **Memoize Theme-Dependent Computations**:

```typescript
const themedConfig = useMemo(() => {
  return resolvedTheme === 'dark' ? darkConfig : lightConfig
}, [resolvedTheme])
```

---

### 💬 Support

Questions? Issues? Improvements?

- **Docs**: `/docs/THEME-SYSTEM-*.md`
- **Examples**: Check existing components in `src/components/`
- **Team Chat**: Slack #frontend-themes
- **Issues**: GitHub Issues with `theme` label

---

**Last Updated**: January 2025
**Maintainer**: Frontend Team
**Version**: 1.0
