const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const pageIds = [...html.matchAll(/class="page(?: active)?" id="(page-[^"]+)"/g)]
  .map((match) => match[1]);
const mappings = [...html.matchAll(/:\s*"(page-[^"]+)"/g)]
  .map((match) => match[1]);

test("all 36 lessons have unique IDs and matching page mappings", () => {
  assert.equal(pageIds.length, 36);
  assert.equal(new Set(pageIds).size, pageIds.length);
  assert.deepEqual(new Set(mappings), new Set(pageIds));
});

test("sidebar follows the same order as page mappings", () => {
  const sidebar = html.split('<aside class="sidebar">')[1].split("</aside>")[0];
  const links = [...sidebar.matchAll(/showPage\('([^']+)'\)/g)]
    .map((match) => `page-${match[1]}`);
  assert.deepEqual(links, mappings);
});

test("every local image and stylesheet exists", () => {
  for (const [, asset] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|#|mailto:)/.test(asset)) continue;
    assert.ok(fs.existsSync(path.join(root, asset)), `Missing asset: ${asset}`);
  }
});

test("all authored HTML IDs are unique", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test("new lessons include goals, problems, exercises, and navigation", () => {
  const lessonIds = mappings.slice(mappings.indexOf("page-production-workflow"), -1);
  assert.equal(lessonIds.length, 14);
  for (const id of lessonIds) {
    const content = html.split(`id="${id}"`)[1].split('<!-- PAGE: CHEATSHEET -->')[0];
    const lesson = content.split('<div class="page"')[0];
    assert.match(lesson, /class="lesson-goal"/);
    assert.match(lesson, /class="lesson-task"/);
    assert.match(lesson, /class="lesson-table"/);
    assert.match(lesson, /class="page-nav"/);
  }
});

test("landing copy has no em dash and inline JavaScript parses", () => {
  const description = html.split('<p class="landing-desc">')[1].split("</p>")[0];
  assert.doesNotMatch(description, /—|&mdash;/);
  for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    assert.doesNotThrow(() => new Function(script));
  }
});
