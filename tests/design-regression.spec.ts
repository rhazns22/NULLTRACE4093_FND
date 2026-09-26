import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const stateKey = "nulltrace-4093.arg-state.v1";
const session = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), stateKey);

async function entry(page: Page) {
  await page.goto("/");
  await expect(page.locator(".glyph-control")).toBeVisible();
  await expect
    .poll(async () => (await session(page))?.currentStage)
    .toBe("ENTRY");
}

async function fastEntry(page: Page) {
  await entry(page);
  await page.keyboard.type("4093");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function computedCommand(page: Page) {
  const signal = await page
    .getByRole("dialog")
    .evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--nt-signal").trim(),
    );
  expect(signal).toMatch(/^NT-BIN\/8\s/);
  const bytes = signal.replace("NT-BIN/8", "").trim().split(/\s+/);
  expect(bytes.every((byte) => /^[01]{8}$/.test(byte))).toBe(true);
  const command = bytes
    .map((byte) => String.fromCharCode(parseInt(byte, 2)))
    .join("");
  expect(command).toBe("VERIFY SIGNAL");
  return command;
}

async function solve(page: Page) {
  await page.locator("#modal-signal-input").fill(await computedCommand(page));
  await page.locator("#modal-signal-input").press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(async () => (await session(page)).currentStage)
    .toBe("VERIFIED");
}

async function issue(page: Page) {
  await page.getByRole("button", { name: "Issue Receipt" }).click();
  await expect(page.locator(".receipt-card")).toBeVisible();
  return (await session(page)).receipt;
}

async function noOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
}

test("normal investigation retains puzzle, receipt checksum, JSON and session recovery", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text() + " " + message.location().url);
  });
  await entry(page);
  const id = (await session(page)).sessionId;
  const orbits = await page.locator(".glyph-orbit").evaluateAll((nodes) =>
    nodes.map((node) => ({
      count: node.getAttribute("data-node-count"),
      missing: node.getAttribute("data-missing-slot"),
      rendered: node.children.length,
      duration: getComputedStyle(node).animationDuration,
    })),
  );
  expect(orbits).toEqual([
    { count: "17", missing: "13", rendered: 16, duration: "4.093s" },
    { count: "13", missing: "7", rendered: 12, duration: "4.093s" },
    { count: "7", missing: "3", rendered: 6, duration: "4.093s" },
  ]);
  await page.waitForTimeout(4200);
  for (let i = 0; i < 7; i++) await page.locator(".glyph-control").click();
  await expect(page.locator("#entry-code")).toBeFocused();
  await page.reload();
  await expect(page.locator("#entry-code")).toBeVisible();
  expect((await session(page)).sessionId).toBe(id);
  expect((await session(page)).currentStage).toBe("INPUT_DISCOVERED");
  await page.locator("#entry-code").fill("4093");
  await page.locator("#entry-code").press("Enter");
  await expect(
    page.getByText("숫자는 일치합니다.", { exact: true }),
  ).toBeVisible();
  expect((await session(page)).entryInteraction.routeProfile).toBe(
    "NORMAL_PATH",
  );
  await page.screenshot({
    path: "artifacts/design/modal-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await solve(page);
  const receipt = await issue(page);
  expect(receipt.evidence).toEqual({
    glyphInvestigated: true,
    inputDiscoveryMethod: "glyph_click",
    unverifiedDialogViewed: true,
    cssClueSolved: true,
  });
  expect(
    receipt.solvePath.some(
      (record: { detail: string }) => record.detail === "NORMAL_PATH",
    ),
  ).toBe(true);
  expect(
    receipt.solvePath.some(
      (record: { stage: string }) => record.stage === "STYLE_CLUE_FOUND",
    ),
  ).toBe(true);
  const { checksum, ...payload } = receipt;
  const stable = (value: unknown): string => {
    if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
    if (value && typeof value === "object")
      return (
        "{" +
        Object.keys(value)
          .sort()
          .map(
            (key) =>
              JSON.stringify(key) +
              ":" +
              stable((value as Record<string, unknown>)[key]),
          )
          .join(",") +
        "}"
      );
    return JSON.stringify(value);
  };
  expect(checksum).toBe(
    createHash("sha256").update(stable(payload)).digest("hex"),
  );
  await page.screenshot({
    path: "artifacts/design/receipt-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "View JSON", exact: true }).click();
  expect(JSON.parse(await page.locator("#receipt-json").innerText())).toEqual(
    receipt,
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(receipt.receiptId + ".json");
  expect(JSON.parse(await readFile((await download.path())!, "utf8"))).toEqual(
    receipt,
  );
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy JSON", exact: true }).click();
  expect(
    JSON.parse(await page.evaluate(() => navigator.clipboard.readText())),
  ).toEqual(receipt);
  await page.reload();
  await expect(page.locator(".receipt-identifier")).toContainText(
    receipt.receiptId,
  );
  expect((await session(page)).receipt).toEqual(receipt);
  const reopened = await page.context().newPage();
  await reopened.goto("/");
  await expect(reopened.locator(".receipt-identifier")).toContainText(
    receipt.receiptId,
  );
  await reopened.close();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".receipt-actions")).toBeHidden();
  await page.screenshot({
    path: "artifacts/design/receipt-print.png",
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "New Session", exact: true }).click();
  expect((await session(page)).sessionId).toBe(id);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".receipt-confirm")).toHaveCount(0);
  await page.getByRole("button", { name: "New Session", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm New Session", exact: true })
    .click();
  await expect(page.locator(".glyph-control")).toBeVisible();
  expect((await session(page)).sessionId).not.toBe(id);
  expect((await session(page)).receipt).toBeNull();
  expect(errors).toEqual([]);
});

test("fast route, focus trap, retained dialog and surface command", async ({
  page,
}) => {
  await fastEntry(page);
  expect((await session(page)).entryInteraction.routeProfile).toBe("FAST_PATH");
  await expect(
    page.getByText("앗, 정답을 빨리 맞췄군요.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".modal-close")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#modal-signal-input")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".modal-close")).toBeFocused();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("dialog")).toBeVisible();
  const command = await computedCommand(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await session(page)).currentStage).toBe("UNVERIFIED");
  expect(
    await page
      .locator(".observation-stage")
      .evaluate((node) => (node as HTMLElement).inert),
  ).toBe(false);
  await page.getByRole("button", { name: "Reopen" }).click();
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator("#entry-code").fill(command);
  await page.locator("#entry-code").press("Enter");
  const receipt = await issue(page);
  expect(
    receipt.solvePath.some(
      (record: { detail: string }) => record.detail === "FAST_PATH",
    ),
  ).toBe(true);
  expect(receipt.evidence.glyphInvestigated).toBe(false);
  expect(receipt.assistUsed).toBe(false);
});

test("keyboard-only reduced motion and timed assist", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await entry(page);
  await expect(page.locator(".motion-fallback")).toBeVisible();
  expect(
    await page
      .locator(".glyph-orbit")
      .first()
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
  await page.keyboard.press("Tab");
  await expect(page.locator(".glyph-control")).toBeFocused();
  expect(
    await page
      .locator(".glyph-control")
      .evaluate((node) => getComputedStyle(node).outlineStyle),
  ).toBe("solid");
  await page.keyboard.press("Enter");
  await page.keyboard.type("4093");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "alternate trace" }),
  ).toHaveCount(0);
  await page.clock.fastForward(12 * 60 * 1000 + 13_000);
  await expect(
    page.getByRole("button", { name: "alternate trace" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "alternate trace" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".assist-trace p")).toContainText("NT-BIN/8");
  expect((await session(page)).entryInteraction.assistUsed).toBe(true);
  const command = await computedCommand(page);
  await page.keyboard.type(command);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (let i = 0; i < 5; i++) {
    if (
      await page
        .getByRole("button", { name: "Issue Receipt" })
        .evaluate((node) => node === document.activeElement)
    )
      break;
    await page.keyboard.press("Tab");
  }
  await expect(
    page.getByRole("button", { name: "Issue Receipt" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".receipt-card")).toBeVisible();
  expect((await session(page)).receipt.assistUsed).toBe(true);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]) {
  test(
    "responsive entry, input, modal and receipt at " + viewport.width,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      await entry(page);
      await noOverflow(page);
      await page.screenshot({
        path: "artifacts/design/entry-" + viewport.width + ".png",
        fullPage: true,
        animations: "disabled",
      });
      const title = await page.locator("#project-title").boundingBox();
      const glyph = await page.locator(".glyph-control").boundingBox();
      expect(title!.y + title!.height).toBeLessThan(glyph!.y);
      const before = await page
        .locator(".glyph-orbit")
        .first()
        .evaluate((node) => getComputedStyle(node).transform);
      await page.waitForTimeout(100);
      const after = await page
        .locator(".glyph-orbit")
        .first()
        .evaluate((node) => getComputedStyle(node).transform);
      expect(before).not.toBe(after);
      await page.keyboard.type("4");
      await noOverflow(page);
      await page.screenshot({
        path: "artifacts/design/input-" + viewport.width + ".png",
        fullPage: true,
        animations: "disabled",
      });
      await page.keyboard.type("093");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await noOverflow(page);
      const modal = await page.getByRole("dialog").boundingBox();
      expect(modal!.x).toBeGreaterThanOrEqual(0);
      expect(modal!.x + modal!.width).toBeLessThanOrEqual(viewport.width);
      await page.screenshot({
        path: "artifacts/design/modal-" + viewport.width + ".png",
        fullPage: true,
        animations: "disabled",
      });
      await solve(page);
      await issue(page);
      await noOverflow(page);
      await page.screenshot({
        path: "artifacts/design/receipt-" + viewport.width + ".png",
        fullPage: true,
        animations: "disabled",
      });
    },
  );
}

test("separate sessions issue different local proofs", async ({ browser }) => {
  const receipts = [];
  for (let i = 0; i < 2; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5173");
    await page.locator(".glyph-control").waitFor();
    await page.keyboard.type("4093");
    await page.keyboard.press("Enter");
    await solve(page);
    receipts.push(await issue(page));
    await context.close();
  }
  expect(receipts[0].sessionId).not.toBe(receipts[1].sessionId);
  expect(receipts[0].receiptId).not.toBe(receipts[1].receiptId);
  expect(receipts[0].checksum).not.toBe(receipts[1].checksum);
});

test("apparatus motion, contact lifecycle and live reduced-motion preference", async ({
  page,
}) => {
  await entry(page);
  const sweep = page.locator(".calibration-sweep");
  const initial = await sweep.evaluate(
    (node) => getComputedStyle(node).transform,
  );
  await page.waitForTimeout(230);
  expect(
    await sweep.evaluate((node) => getComputedStyle(node).transform),
  ).not.toBe(initial);
  expect(await page.locator(".glyph-node").count()).toBe(34);
  await page.locator(".glyph-control").click();
  await expect(page.locator(".glyph-ripple")).toHaveCount(1);
  await expect(page.locator(".glyph-ripple")).toHaveCount(0);
  await page.keyboard.type("4");
  await expect(
    page.locator(".entry-channel__meter [data-filled='true']"),
  ).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(sweep).toBeHidden();
  await expect(page.locator(".motion-fallback")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
  await page.keyboard.type("093");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await solve(page);
  await issue(page);
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 1366, height: 768 },
]) {
  test(
    "player errors and next actions stay visible at " + viewport.width,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      await entry(page);
      await page.keyboard.type("1234");
      await page.keyboard.press("Enter");
      await expect(page.locator(".entry-feedback")).toContainText(
        "carrier returned without lock",
      );
      await expect(page.locator(".entry-feedback")).toBeInViewport({
        ratio: 1,
      });
      await expect(page.locator("#entry-code")).toBeFocused();
      await page.keyboard.type("0000");
      await page.keyboard.press("Enter");
      await expect(page.locator(".entry-feedback")).toContainText(
        "indivisible echo",
      );
      await expect(page.locator(".entry-feedback")).toBeInViewport({
        ratio: 1,
      });
      await page.keyboard.type("4093");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      const command = await computedCommand(page);
      await page.locator("#modal-signal-input").fill(command.slice(0, -1));
      await page.locator("#modal-signal-input").press("Enter");
      await expect(page.locator("#modal-signal-input")).toHaveValue(
        command.slice(0, -1),
      );
      await expect(page.locator(".signal-feedback")).toContainText(
        "Verification unchanged.",
      );
      await expect(page.locator(".signal-feedback")).toBeInViewport({
        ratio: 1,
      });
      expect((await session(page)).currentStage).toBe("UNVERIFIED");
      await page.keyboard.press("Escape");
      await page.locator("#entry-code").fill(command.slice(0, -1));
      await page.locator("#entry-code").press("Enter");
      await expect(page.locator(".entry-feedback")).toContainText(
        "Verification unchanged.",
      );
      await expect(page.locator(".entry-feedback")).toBeInViewport({
        ratio: 1,
      });
      await page.locator("#entry-code").fill(command);
      await page.locator("#entry-code").press("Enter");
      await expect(
        page.getByRole("button", { name: "Issue Receipt" }),
      ).toBeFocused();
      await expect(
        page.getByRole("button", { name: "Issue Receipt" }),
      ).toBeInViewport({ ratio: 1 });
      await page.keyboard.press("Enter");
      await expect(page.locator(".receipt-card")).toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBe(0);
      const id = (await session(page)).sessionId;
      await page
        .getByRole("button", { name: "New Session", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Cancel", exact: true }),
      ).toBeFocused();
      await expect(
        page.getByRole("button", { name: "Cancel", exact: true }),
      ).toBeInViewport({ ratio: 1 });
      await page.keyboard.press("Escape");
      await expect(page.locator(".receipt-confirm")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "New Session", exact: true }),
      ).toBeFocused();
      expect((await session(page)).sessionId).toBe(id);
    },
  );
}
