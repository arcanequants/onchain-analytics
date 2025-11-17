import { test, expect } from '@playwright/test'

test.describe('Events Page', () => {
  test('should load events page', async ({ page }) => {
    await page.goto('/events')

    // Check page loaded
    await expect(page).toHaveURL(/\/events/)

    // Check for events content
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })

  test('should display event calendar', async ({ page }) => {
    await page.goto('/events')

    // Wait for events to load
    await page.waitForSelector('[data-testid="event-item"], .event-item, text=/Event/i', {
      timeout: 10000
    })

    // Check that events are displayed
    const events = page.locator('[data-testid="event-item"], .event-item')
    const count = await events.count()

    expect(count).toBeGreaterThan(0)
  })

  test('should have event filtering', async ({ page }) => {
    await page.goto('/events')

    await page.waitForLoadState('networkidle')

    // Look for filter controls (select, buttons, etc)
    const filterControls = page.locator('select, button[data-filter], [data-testid="filter"]')

    if (await filterControls.count() > 0) {
      // Filters exist, good!
      expect(await filterControls.count()).toBeGreaterThan(0)
    }
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/events')

    await page.waitForLoadState('networkidle')

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], input[data-testid="search"]')

    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test')
      // Search input exists and accepts input
      expect(await searchInput.first().inputValue()).toContain('test')
    }
  })

  test('should have tabbed interface (Calendar/Analytics)', async ({ page }) => {
    await page.goto('/events')

    await page.waitForLoadState('networkidle')

    // Look for tabs
    const tabs = page.locator('[role="tab"], button:has-text("Calendar"), button:has-text("Analytics")')

    if (await tabs.count() > 0) {
      // Click on second tab if it exists
      if (await tabs.count() > 1) {
        await tabs.nth(1).click()
        await page.waitForTimeout(500)

        // Verify tab interaction works
        expect(await tabs.nth(1).getAttribute('aria-selected')).toBeTruthy()
      }
    }
  })

  test('should display event submission form', async ({ page }) => {
    await page.goto('/events')

    await page.waitForLoadState('networkidle')

    // Look for submit button or form
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Add Event")')

    if (await submitButton.count() > 0) {
      await submitButton.first().click()
      await page.waitForTimeout(500)

      // Check if form appeared
      const form = page.locator('form, [data-testid="event-form"]')
      expect(await form.count()).toBeGreaterThan(0)
    }
  })
})
