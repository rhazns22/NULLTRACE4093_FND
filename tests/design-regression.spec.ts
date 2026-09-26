import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const stateKey = "nulltrace-4093.arg-state.v1";
const stateKeyV2 = "nulltrace-4093.arg-state.v2";
const session = (page: Page) =>
  page.evaluate(
    ({ key, keyV2 }) => {
      const rawV2 = localStorage.getItem(keyV2);
      if (rawV2) return JSON.parse(rawV2).traces.TRACE_01;
      return JSON.parse(localStorage.getItem(key)!);
    },
    { key: stateKey, keyV2: stateKeyV2 },
  );
const sessionV2 = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), stateKeyV2);

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
    page.getByText("VALUE ACCEPTED.", { exact: true }),
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
    page.getByText("EVIDENCE INCOMPLETE.", { exact: true }),
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
  await expect(page.locator(".assist-trace--levels p")).toContainText(
    "COMPUTED",
  );
  expect((await session(page)).entryInteraction.assistUsed).toBe(true);
  expect((await session(page)).entryInteraction.assistLevel).toBe(1);
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

test("legacy v1 receipt without evidence summary restores without empty UI", async ({
  page,
}) => {
  const legacySession = "11111111-1111-4111-8111-111111111111";
  const issuedAt = "2026-01-01T00:00:00.000Z";

  await page.addInitScript(
    ({ stateKey, legacySession, issuedAt }) => {
      localStorage.setItem("nulltrace-4093.session-id.v1", legacySession);
      localStorage.setItem(
        stateKey,
        JSON.stringify({
          currentStage: "RECEIPT_ISSUED",
          sessionId: legacySession,
          startedAt: issuedAt,
          inputAttempts: 1,
          investigationFlags: {
            entrySignalReviewed: true,
            glyphInvestigated: true,
            inputCipherFound: true,
            cssComputedClueFound: true,
            verificationPathCommitted: true,
          },
          entryInteraction: {
            inputDiscoveryMethod: "glyph_click",
            routeProfile: "NORMAL_PATH",
            assistUsed: false,
            attempts: [],
          },
          solvePath: [
            {
              at: issuedAt,
              stage: "ENTRY",
              action: "anonymous session opened",
            },
          ],
          receipt: {
            receiptId: "NT-01-22222222-2222-4222-8222-222222222222",
            sessionId: legacySession,
            stage: 1,
            status: "VERIFIED",
            issuedAt,
            elapsedSeconds: 12.345,
            inputAttempts: 1,
            solvePath: [
              {
                at: issuedAt,
                stage: "ENTRY",
                action: "anonymous session opened",
              },
            ],
            assistUsed: false,
            evidence: {
              glyphInvestigated: true,
              inputDiscoveryMethod: "glyph_click",
              unverifiedDialogViewed: true,
              cssClueSolved: true,
            },
            checksum: "0".repeat(64),
          },
        }),
      );
    },
    { stateKey, legacySession, issuedAt },
  );

  await page.goto("/");
  await expect(page.locator(".receipt-card")).toBeVisible();
  await expect(page.locator(".receipt-identifier")).toContainText(
    "NT-01-22222222-2222-4222-8222-222222222222",
  );
  await expect(page.locator(".receipt-card")).not.toContainText("undefined");
  await expect(page.locator(".receipt-card")).not.toContainText("NaN");
  await expect(page.locator(".receipt-card")).toContainText("Assist Level");
  expect((await session(page)).entryInteraction.assistLevel).toBe(0);
  expect((await session(page)).receipt.evidenceSummary).toBeUndefined();
});

test("trace 02 is locked without a valid trace 01 receipt", async ({ page }) => {
  await page.goto("/#/trace/02");
  await expect(page.getByText("STATUS // PREVIOUS EVIDENCE REQUIRED")).toBeVisible();
  await expect(page.getByText("NO RECORD CAN BE RESTORED")).toBeVisible();
  await page.getByRole("button", { name: "Return to Trace 01" }).click();
  await expect(page.locator(".glyph-control")).toBeVisible();
});

test("v1 in-progress state migrates to v2 without deleting v1", async ({ page }) => {
  const v1State = {
    currentStage: "INPUT_DISCOVERED",
    sessionId: "33333333-3333-4333-8333-333333333333",
    startedAt: "2026-01-01T00:00:00.000Z",
    inputAttempts: 0,
    investigationFlags: {
      entrySignalReviewed: true,
      glyphInvestigated: true,
      inputCipherFound: true,
      cssComputedClueFound: false,
      verificationPathCommitted: false,
    },
    entryInteraction: {
      inputDiscoveryMethod: "glyph_keyboard_enter",
      inputDiscoveredAt: "2026-01-01T00:00:01.000Z",
      firstInputAt: null,
      lastSubmittedAt: null,
      timeToFirstInputMs: null,
      timeToLastSubmitMs: null,
      routeProfile: "UNDETERMINED",
      lastInputResponse: null,
      unverifiedDialogOpen: false,
      unverifiedDialogViewed: false,
      unverifiedDialogDismissedAt: null,
      styleSignalSubmittedAt: null,
      assistUsed: false,
      attempts: [],
    },
    solvePath: [],
    receipt: null,
  };

  await page.addInitScript(
    ({ key, state }) => {
      localStorage.setItem("nulltrace-4093.session-id.v1", state.sessionId);
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: stateKey, state: v1State },
  );

  await page.goto("/");
  await expect(page.locator("#entry-code")).toBeVisible();
  const migrated = await sessionV2(page);
  expect(migrated.schemaVersion).toBe(2);
  expect(migrated.traces.TRACE_01.currentStage).toBe("INPUT_DISCOVERED");
  expect(migrated.traces.TRACE_02.currentStage).toBe("LOCKED");
  expect(await page.evaluate((key) => localStorage.getItem(key), stateKey)).not.toBeNull();
});

test("existing v2 state prevents duplicate v1 migration", async ({ page }) => {
  await page.addInitScript(
    ({ key, keyV2 }) => {
      localStorage.setItem("nulltrace-4093.session-id.v1", "44444444-4444-4444-8444-444444444444");
      localStorage.setItem(
        key,
        JSON.stringify({
          currentStage: "ENTRY",
          sessionId: "v1-should-not-win",
          startedAt: "2026-01-01T00:00:00.000Z",
          inputAttempts: 0,
          investigationFlags: {},
          entryInteraction: {},
          solvePath: [],
          receipt: null,
        }),
      );
      localStorage.setItem(
        keyV2,
        JSON.stringify({
          schemaVersion: 2,
          sessionId: "44444444-4444-4444-8444-444444444444",
          currentTrace: "TRACE_02",
          traces: {
            TRACE_01: {
              currentStage: "ENTRY",
              sessionId: "44444444-4444-4444-8444-444444444444",
              startedAt: "2026-01-01T00:00:00.000Z",
              inputAttempts: 0,
              investigationFlags: {},
              entryInteraction: {},
              solvePath: [],
              receipt: null,
            },
            TRACE_02: {
              currentStage: "ENTRY",
              startedAt: "2026-01-01T00:00:02.000Z",
              completedAt: null,
              attempts: 0,
              assistLevel: 2,
              discoveredRecordIds: [],
              submittedCommand: null,
              solvePath: [],
              lastError: null,
              restoredAt: null,
            },
          },
          receipts: {},
        }),
      );
    },
    { key: stateKey, keyV2: stateKeyV2 },
  );

  await page.goto("/");
  const migrated = await sessionV2(page);
  expect(migrated.sessionId).toBe("44444444-4444-4444-8444-444444444444");
  expect(migrated.currentTrace).toBe("TRACE_02");
  expect(migrated.traces.TRACE_02.assistLevel).toBe(2);
});

test("new session overwrites v2 without resurrecting preserved v1 receipt", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key }) => {
      const legacyReceipt = {
        receiptId: "NT-01-55555555-5555-4555-8555-555555555555",
        sessionId: "55555555-5555-4555-8555-555555555555",
        stage: 1,
        status: "VERIFIED",
        issuedAt: "2026-01-01T00:00:00.000Z",
        elapsedSeconds: 1,
        inputAttempts: 1,
        solvePath: [],
        assistUsed: false,
        evidence: {
          glyphInvestigated: false,
          inputDiscoveryMethod: "numeric_key",
          unverifiedDialogViewed: true,
          cssClueSolved: true,
        },
        checksum: "0".repeat(64),
      };
      localStorage.setItem("nulltrace-4093.session-id.v1", legacyReceipt.sessionId);
      localStorage.setItem(
        key,
        JSON.stringify({
          currentStage: "RECEIPT_ISSUED",
          sessionId: legacyReceipt.sessionId,
          startedAt: "2026-01-01T00:00:00.000Z",
          inputAttempts: 1,
          investigationFlags: {
            entrySignalReviewed: false,
            glyphInvestigated: false,
            inputCipherFound: false,
            cssComputedClueFound: true,
            verificationPathCommitted: true,
          },
          entryInteraction: {
            inputDiscoveryMethod: "numeric_key",
            routeProfile: "FAST_PATH",
            unverifiedDialogViewed: true,
            assistUsed: false,
            attempts: [],
          },
          solvePath: [],
          receipt: legacyReceipt,
        }),
      );
    },
    { key: stateKey },
  );

  await page.goto("/");
  await expect(page.locator(".receipt-card")).toBeVisible();
  expect((await sessionV2(page)).receipts.TRACE_01?.receiptId).toBe(
    "NT-01-55555555-5555-4555-8555-555555555555",
  );
  await page.getByRole("button", { name: "New Session", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm New Session", exact: true })
    .click();
  await expect(page.locator(".glyph-control")).toBeVisible();
  const newSession = await sessionV2(page);
  expect(newSession.receipts.TRACE_01).toBeUndefined();
  await page.reload();
  await expect(page.locator(".glyph-control")).toBeVisible();
  expect((await sessionV2(page)).receipts.TRACE_01).toBeUndefined();
  expect(await page.evaluate((key) => localStorage.getItem(key), stateKey)).not.toBeNull();
});

test("unreadable local record shows recovery screen before overwrite", async ({
  page,
}) => {
  await page.addInitScript(
    ({ keyV2 }) => {
      localStorage.setItem("nulltrace-4093.session-id.v1", "66666666-6666-4666-8666-666666666666");
      localStorage.setItem(keyV2, "{ this is not json");
    },
    { keyV2: stateKeyV2 },
  );

  await page.goto("/");
  await expect(page.getByText("LOCAL RECORD // UNREADABLE")).toBeVisible();
  await expect(page.getByText("AUTOMATIC RECOVERY // UNAVAILABLE")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), stateKeyV2)).toBe("{ this is not json");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Unreadable JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${stateKeyV2}.unreadable.json`);

  await page.getByRole("button", { name: "Start New Session" }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), stateKeyV2)).toBe("{ this is not json");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("LOCAL RECORD // UNREADABLE")).toBeVisible();

  await page.getByRole("button", { name: "Start New Session" }).click();
  await page
    .getByRole("button", { name: "Confirm New Session" })
    .click();
  await expect(page.locator(".glyph-control")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), stateKeyV2)).toContain('"schemaVersion":2');
});

test("trace 02 hidden DOM, evidence, command and receipt preserve trace 01", async ({
  page,
}) => {
  await fastEntry(page);
  await solve(page);
  const trace01Receipt = await issue(page);
  await page.getByRole("button", { name: /NEXT TRACE/ }).click();
  await expect(page.locator("#observation-archive")).toBeVisible();

  const archive = page.locator("#observation-archive");
  await expect(archive.locator("article")).toHaveCount(7);
  await expect(archive.locator("article:not([hidden])")).toHaveCount(3);
  await expect(archive.locator('[data-record-state="omitted"]')).toHaveCount(4);
  await expect(archive.locator('[data-sequence="2"][data-fragment="RESTORE"]')).toHaveCount(1);
  await expect(archive.locator('[data-sequence="3"][data-fragment="THE"]')).toHaveCount(1);
  await expect(archive.locator('[data-sequence="5"][data-fragment="OMITTED"]')).toHaveCount(1);
  await expect(archive.locator('[data-sequence="7"][data-fragment="RECORD"]')).toHaveCount(1);

  const commentText = await page.locator("#observation-archive").evaluate((node) =>
    Array.from(node.childNodes)
      .filter((child) => child.nodeType === Node.COMMENT_NODE)
      .map((child) => child.textContent)
      .join("\n"),
  );
  expect(commentText).toContain("NT-TRACE-02");
  expect(commentText).toContain("THE DOCUMENT CONTAINS SEVEN.");

  const attributes = await archive.locator("article").evaluateAll((nodes) =>
    nodes.flatMap((node) =>
      Array.from(node.attributes).map((attribute) => attribute.value),
    ),
  );
  expect(attributes).not.toContain("RESTORE THE OMITTED RECORD");

  await page.locator("#trace02-evidence").fill("NT-02-R02 NT-02-R02 NT-02-R05 NT-02-R07");
  await page.locator("#trace02-evidence").press("Enter");
  await expect(page.locator(".trace02-feedback")).toContainText("DUPLICATE");

  await page.locator("#trace02-evidence").fill("NT-02-R02 NT-02-R03 NT-02-R05 NT-02-R07");
  await page.locator("#trace02-evidence").press("Enter");
  await expect(page.locator(".trace02-feedback")).toContainText("RECORD EVIDENCE ACCEPTED");

  await page.locator("#trace02-command").fill("restore the wrong record");
  await page.locator("#trace02-command").press("Enter");
  await expect(page.locator(".trace02-feedback")).toContainText(
    "COMMAND REJECTED. DOCUMENT ORDER DOES NOT MATCH.",
  );

  await page.locator("#trace02-command").fill("  restore   the omitted record  ");
  await page.locator("#trace02-command").press("Enter");
  await page.getByRole("button", { name: "Issue Trace 02 Receipt" }).click();
  await expect(page.locator(".trace02-receipt")).toBeVisible();
  await expect(page.locator(".trace02-receipt")).toContainText("DOCUMENT // RESTORED");

  const nextState = await sessionV2(page);
  expect(nextState.receipts.TRACE_01.receiptId).toBe(trace01Receipt.receiptId);
  expect(nextState.receipts.TRACE_02.receiptId).toMatch(/^NT-02-/);
  expect(nextState.receipts.TRACE_02.evidenceSummary.evidenceIds).toEqual(
    expect.arrayContaining([
      "TRACE_02_DOCUMENT_GAP",
      "NT-02-R02",
      "NT-02-R03",
      "NT-02-R05",
      "NT-02-R07",
      "TRACE_02_RESTORED_COMMAND",
    ]),
  );

  await page.reload();
  await expect(page.locator(".trace02-receipt")).toContainText(
    nextState.receipts.TRACE_02.receiptId,
  );
});

test("trace 02 assist level 3 transcript supports keyboard completion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fastEntry(page);
  await solve(page);
  await issue(page);
  await page.keyboard.press("Tab");
  while (!(await page.getByRole("button", { name: /NEXT TRACE/ }).evaluate((node) => node === document.activeElement))) {
    await page.keyboard.press("Tab");
  }
  await page.keyboard.press("Enter");
  await expect(page.locator("#observation-archive")).toBeVisible();

  for (let level = 1; level <= 3; level++) {
    await page.getByRole("button", { name: /SMALL SIGNAL/ }).click();
  }

  await expect(page.locator(".trace02-transcript")).toContainText("DOCUMENT TRANSCRIPT");
  expect((await sessionV2(page)).traces.TRACE_02.assistLevel).toBe(3);
  await page.locator("#trace02-evidence").fill("NT-02-R02 NT-02-R03 NT-02-R05 NT-02-R07");
  await page.locator("#trace02-evidence").press("Enter");
  await page.locator("#trace02-command").fill("RESTORE THE OMITTED RECORD");
  await page.locator("#trace02-command").press("Enter");
  await page.getByRole("button", { name: "Issue Trace 02 Receipt" }).click();
  const receipt = (await sessionV2(page)).receipts.TRACE_02;
  expect(receipt.assistUsed).toBe(true);
  expect(receipt.evidenceSummary.assistLevel).toBe(3);
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
