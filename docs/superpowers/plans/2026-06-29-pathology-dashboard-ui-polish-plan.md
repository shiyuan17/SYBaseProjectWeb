# Pathology Dashboard UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the pathology dashboard UI polish so metric explanations move into a click-to-open inline popover, the report revision list auto-scrolls with hover pause, and the last-month workload area becomes easier to scan.

**Architecture:** Keep the existing three-column dashboard structure and update only the local dashboard module. Add the explanation popover behavior inside the header component, implement the revision-rate auto-scroll behavior in the left column, and replace the center workload orbit presentation with a denser card layout while preserving the existing data sources and presentation helpers.

**Tech Stack:** Vue 3 SFCs with `script setup`, TypeScript, Vitest DOM tests, module-scoped dashboard CSS

---

### Task 1: Lock Header Explanation Behavior with Tests

**Files:**

- Modify: `apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts`
- Modify: `apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardHeader.vue`

- [ ] **Step 1: Write the failing test**

```ts
it('renders a compact explanation trigger and toggles the note popover', async () => {
  resetPreferenceMocks();
  mockQueryPathologyScreenDashboard.mockResolvedValue(buildDashboardResponse());

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(PathologyDashboardView);
  app.mount(root);
  await flushView();

  try {
    expect(
      root.querySelector('[data-testid="pathology-partial-banner"]'),
    ).toBeNull();

    const trigger = root.querySelector(
      '[data-testid="pathology-note-trigger"]',
    ) as HTMLButtonElement | null;

    expect(trigger).toBeTruthy();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(root.textContent).not.toContain('部分指标暂未完全就绪');

    trigger?.click();
    await nextTick();

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(
      root.querySelector('[data-testid="pathology-note-popover"]'),
    ).toBeTruthy();
    expect(root.textContent).toContain('部分指标暂未完全就绪');

    trigger?.click();
    await nextTick();

    expect(
      root.querySelector('[data-testid="pathology-note-popover"]'),
    ).toBeNull();
  } finally {
    app.unmount();
    root.remove();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts -t "renders a compact explanation trigger and toggles the note popover"`

Expected: FAIL because the page still renders `pathology-partial-banner` and does not render the new trigger/popover test ids.

- [ ] **Step 3: Write minimal implementation**

```vue
const isNotesOpen = ref(false); function toggleNotes() { isNotesOpen.value =
!isNotesOpen.value; }
```

```vue
<button
  data-testid="pathology-note-trigger"
  :aria-expanded="isNotesOpen ? 'true' : 'false'"
  @click="toggleNotes"
>
  i
</button>
<section v-if="isNotesOpen" data-testid="pathology-note-popover">
  <strong>部分指标暂未完全就绪</strong>
  <p>{{ props.partialNotes.join('；') }}</p>
</section>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts -t "renders a compact explanation trigger and toggles the note popover"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardHeader.vue
git commit -m "feat(dashboard): compact pathology note entry"
```

### Task 2: Lock Revision Trend Scrolling and Workload Layout Rendering with Tests

**Files:**

- Modify: `apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts`
- Modify: `apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardLeftColumn.vue`
- Modify: `apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardCenterColumn.vue`

- [ ] **Step 1: Write the failing tests**

```ts
it('renders duplicated revision rows when the trend list needs scrolling', async () => {
  resetPreferenceMocks();
  mockQueryPathologyScreenDashboard.mockResolvedValue(
    buildDashboardResponse({
      reportRevisionRateTrend: {
        items: Array.from({ length: 9 }, (_, index) => ({
          label: `2026-${String(index + 1).padStart(2, '0')}`,
          sourceNote: 'revision',
          status: 'AVAILABLE',
          value: `${index}.00%`,
        })),
        sourceNote: 'revision trend',
        status: 'AVAILABLE',
      },
    }),
  );

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(PathologyDashboardView);
  app.mount(root);
  await flushView();

  try {
    expect(
      root.querySelector('[data-testid="pathology-top-left-scroll"]'),
    )?.toBeTruthy();
    expect(
      root.querySelectorAll('[data-testid="pathology-top-left-item"]').length,
    ).toBeGreaterThan(9);
  } finally {
    app.unmount();
    root.remove();
  }
});

it('renders last-month workload as a workload card grid', async () => {
  resetPreferenceMocks();
  mockQueryPathologyScreenDashboard.mockResolvedValue(buildDashboardResponse());

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(PathologyDashboardView);
  app.mount(root);
  await flushView();

  try {
    const workloadGrid = root.querySelector(
      '[data-testid="pathology-workload-grid"]',
    );
    expect(workloadGrid).toBeTruthy();
    expect(workloadGrid?.textContent).toContain('切片');
    expect(workloadGrid?.textContent).toContain('脱水');
    expect(workloadGrid?.textContent).toContain('包埋');
    expect(workloadGrid?.textContent).toContain('报告');
  } finally {
    app.unmount();
    root.remove();
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts -t "renders duplicated revision rows when the trend list needs scrolling|renders last-month workload as a workload card grid"`

Expected: FAIL because no scrolling duplication container exists and the center section still renders the orbit layout without the new grid test id.

- [ ] **Step 3: Write minimal implementation**

```vue
const revisionTrendItems = computed(() =>
props.dashboard.reportRevisionRateTrend.items.length > 6 ?
[...props.dashboard.reportRevisionRateTrend.items,
...props.dashboard.reportRevisionRateTrend.items] :
props.dashboard.reportRevisionRateTrend.items, );
```

```vue
<div data-testid="pathology-top-left-scroll">
  <div v-for="item in revisionTrendItems" data-testid="pathology-top-left-item">
    ...
  </div>
</div>
```

```vue
<section
  class="center-stage center-stage--workload"
  data-testid="pathology-center-stage"
>
  <div class="center-stage__workload-grid" data-testid="pathology-workload-grid">
    <article v-for="node in buildPathologyDashboardStageNodes(props.dashboard)">
      ...
    </article>
  </div>
</section>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts -t "renders duplicated revision rows when the trend list needs scrolling|renders last-month workload as a workload card grid"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardLeftColumn.vue apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardCenterColumn.vue
git commit -m "feat(dashboard): polish revision and workload panels"
```

### Task 3: Finish Styles, Close Behavior, and Full Verification

**Files:**

- Modify: `apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardHeader.vue`
- Modify: `apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardLeftColumn.vue`
- Modify: `apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardCenterColumn.vue`
- Modify: `apps/web-ele/src/modules/dashboard/styles/pathology-dashboard.css`
- Modify: `apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts`

- [ ] **Step 1: Write the failing tests for close interactions**

```ts
it('closes the explanation popover on escape', async () => {
  resetPreferenceMocks();
  mockQueryPathologyScreenDashboard.mockResolvedValue(buildDashboardResponse());

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(PathologyDashboardView);
  app.mount(root);
  await flushView();

  try {
    const trigger = root.querySelector(
      '[data-testid="pathology-note-trigger"]',
    ) as HTMLButtonElement;

    trigger.click();
    await nextTick();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(
      root.querySelector('[data-testid="pathology-note-popover"]'),
    ).toBeNull();
  } finally {
    app.unmount();
    root.remove();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts -t "closes the explanation popover on escape"`

Expected: FAIL because the first popover implementation does not yet register the escape listener.

- [ ] **Step 3: Write minimal implementation and styles**

```ts
function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isNotesOpen.value = false;
  }
}

onMounted(() => document.addEventListener('keydown', onDocumentKeydown));
onBeforeUnmount(() =>
  document.removeEventListener('keydown', onDocumentKeydown),
);
```

```css
.pathology-screen__note-trigger { ... }
.pathology-screen__note-popover { ... }
.line-list--scrolling:hover .line-list__rail { animation-play-state: paused; }
.center-stage__workload-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
```

- [ ] **Step 4: Run focused tests, then full dashboard test file**

Run: `pnpm vitest run apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts`

Expected: PASS with all dashboard view tests green.

- [ ] **Step 5: Run static verification**

Run: `pnpm check:type`

Expected: PASS

- [ ] **Step 6: Browser verification**

Run the local dashboard in a browser and confirm:

- explanation trigger opens and closes inline
- long revision list auto-scrolls
- hover pauses the scroll
- workload cards render without overlap

- [ ] **Step 7: Commit**

```bash
git add apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardHeader.vue apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardLeftColumn.vue apps/web-ele/src/modules/dashboard/components/pathology-screen/PathologyDashboardCenterColumn.vue apps/web-ele/src/modules/dashboard/styles/pathology-dashboard.css apps/web-ele/src/modules/dashboard/views/PathologyDashboardView.test.ts
git commit -m "feat(dashboard): refine pathology cockpit interactions"
```
