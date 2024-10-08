import { test, expect } from "./fixtures/loggedIn.ts";
import { faker } from "@faker-js/faker";
import createFeed from "./helpers/createFeedHelper";
import getProjectFile from "./helpers/projectFile.ts";

const SOME_FILE = getProjectFile("package-lock.json");

test("Can perform feed operations", async ({ page, isMobile }) => {
  test.slow();
  await page.goto("feeds?type=private");
  const animal = faker.animal.type();
  const feedName = `A study on ${animal}`;
  await createFeed(page, feedName, SOME_FILE);
  // Add a timeout of 5000 milliseconds to wait for the "Feed Created Successfully" message
  await page.waitForSelector(':text("Feed Created Successfully")');
  await page.getByRole("button").first().click();
  // Add a timeout of 5000 milliseconds to wait for the "tbody" to contain text
  await expect(page.locator("tbody")).toContainText(feedName);
  const labelName = `${feedName}-checkbox`;
  if (isMobile) {
    await page.getByLabel("Global Navigation").click();
  }
  const firstCheckbox = page.locator(`[aria-label="${labelName}"]`).first();
  await firstCheckbox.check();

  await page.getByLabel("feed-action").nth(4).click();
  await page.getByRole("button", { name: "Confirm" }).click({ timeout: 5000 });
  await page.locator('[aria-label="Loading Feed Table"]');
  await page.locator('[aria-label="Feed Table"]');
});
