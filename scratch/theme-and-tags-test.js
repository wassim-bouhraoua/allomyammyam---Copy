const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const DIR  = path.join('C:/Users/wassim/.gemini/antigravity/brain/af8b29e1-a266-4a16-b130-61ebdda212f3', 'screenshots_test');
const EMAIL = `chef_${Date.now()}@test.com`;
const PASS  = 'TestChef123!';

fs.mkdirSync(DIR, { recursive: true });
let n = 0;
const shot = async (page, name) => {
  n++;
  const p = path.join(DIR, `${String(n).padStart(2,'0')}_${name}.png`);
  await page.screenshot({ path: p });
  console.log(`📸 ${n}: ${name}`);
};
const log = (m) => console.log(`\n▶ ${m}`);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  try {
    // ── 1. Register Chef ─────────────────────────────────────────────────────
    log('STEP 1: Register Chef');
    await page.goto(`${BASE}/register-chef`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder="Fatima"]', 'Test');
    await page.fill('input[placeholder="Zahra"]', 'Chef');
    await page.fill('input[placeholder="chef@example.com"]', EMAIL);
    await page.fill('input[placeholder="Min. 8 characters"]', PASS);
    await page.fill('input[placeholder="Chef Fatima"]', 'Test Chef Kitchen');
    await page.fill('input[placeholder="Casablanca"]', 'Oujda');
    await page.fill('textarea[placeholder*="cooking style"]', 'Test Bio');
    await page.locator('button:has-text("Moroccan")').click();
    await shot(page, '01_register_chef');
    await page.locator('button[type="submit"]:has-text("Submit Application")').click();
    await page.waitForURL(/localhost:3000\/(profile|$|\?)/, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // ── 2. Create Dish with Controlled Tags ──────────────────────────────────
    log('STEP 2: Create Dish Form');
    await page.goto(`${BASE}/profile/dishes/new`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder="e.g. Moroccan Lamb Tagine"]', 'Test Dish');
    await page.fill('textarea[placeholder="Describe your dish..."]', 'A delicious test dish');
    await page.selectOption('select', 'MAIN_COURSE');
    await page.fill('input[placeholder="e.g. 120"]', '120');
    await page.fill('input[placeholder="e.g. 30"]', '45');
    
    // Check tags checkboxes (Meat and Grilled)
    await page.locator('label:has-text("Meat") input[type="checkbox"]').check();
    await page.locator('label:has-text("Grilled") input[type="checkbox"]').check();
    await shot(page, '02_new_dish_form_tags_checked');
    
    await page.locator('button[type="submit"]:has-text("Create Dish")').click();
    await page.waitForURL(`${BASE}/profile/dishes`, { timeout: 12000 });
    await page.waitForTimeout(1000);
    await shot(page, '03_dashboard_dish_created');

    // ── 3. Edit Dish & Verify Tags Checkboxes Pre-populated ──────────────────
    log('STEP 3: Edit Dish Form');
    const editBtn = page.locator('a:has-text("Edit")').first();
    await editBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await shot(page, '04_edit_dish_form');

    // Verify checkboxes are pre-populated
    const meatChecked = await page.locator('label:has-text("Meat") input[type="checkbox"]').isChecked();
    const grilledChecked = await page.locator('label:has-text("Grilled") input[type="checkbox"]').isChecked();
    console.log(`  → Meat Tag Checked: ${meatChecked}`);
    console.log(`  → Grilled Tag Checked: ${grilledChecked}`);

    // Update tags (Uncheck Grilled, Check Spicy)
    await page.locator('label:has-text("Grilled") input[type="checkbox"]').uncheck();
    await page.locator('label:has-text("Spicy") input[type="checkbox"]').check();
    await shot(page, '05_edit_dish_form_tags_updated');

    await page.locator('button[type="submit"]:has-text("Save Changes")').click();
    await page.waitForURL(`${BASE}/profile/dishes`, { timeout: 12000 });
    await page.waitForTimeout(1000);

    // ── 4. Public Filtering Verification ─────────────────────────────────────
    log('STEP 4: Public Filtering on /dishes');
    await page.goto(`${BASE}/dishes`, { waitUntil: 'networkidle' });
    await shot(page, '06_public_dishes_all');
    
    // Click "Spicy" filter chip
    await page.locator('button:has-text("Spicy")').first().click();
    await page.waitForTimeout(500);
    await shot(page, '07_public_dishes_spicy_filtered');

    // ── 5. Theme Settings Switcher ───────────────────────────────────────────
    log('STEP 5: Theme Settings');
    await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await shot(page, '08_profile_page_theme_section');

    // Check system preference dark class state (initially)
    let hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`  → Initial document has dark class: ${hasDarkClass}`);

    // Click "Dark"
    log('  → Switching to Dark Theme');
    await page.locator('button:has-text("Dark")').click();
    await page.waitForTimeout(200);
    hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`  → After Dark click, has dark class: ${hasDarkClass}`);
    await shot(page, '09_profile_page_dark_theme');

    // Reload page to verify persistence
    log('  → Reloading page to verify persistence of Dark mode');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`  → After reload, has dark class: ${hasDarkClass}`);
    await shot(page, '10_profile_page_dark_theme_persisted');

    // Click "Light"
    log('  → Switching to Light Theme');
    await page.locator('button:has-text("Light")').click();
    await page.waitForTimeout(200);
    hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`  → After Light click, has dark class: ${hasDarkClass}`);
    await shot(page, '11_profile_page_light_theme');

    // Reload page to verify persistence
    log('  → Reloading page to verify persistence of Light mode');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`  → After reload, has dark class: ${hasDarkClass}`);
    await shot(page, '12_profile_page_light_theme_persisted');

  } catch (err) {
    console.error('❌ Error during E2E test:', err);
  } finally {
    await browser.close();
    console.log('\n🏁 E2E Test Completed.');
  }
})();
