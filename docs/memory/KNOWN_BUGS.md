# KNOWN_BUGS.md

## Purpose

Track **Open** bugs and a short tail of recently resolved items. Full resolved history: [docs/reviews/bug-archive.md](../reviews/bug-archive.md).

## Open Bugs

| ID | Status | Summary | Impact |
| --- | --- | --- | --- |
| _(none)_ | — | No open bugs at last archive (2026-06-18). | — |

## Recently Resolved (summary only)

| ID | Resolved | Summary |
| --- | --- | --- |
| BUG-20260612-002 | Resolved | Clean SID-86 frontend worktree dev-server validation failed from `.logs/frontend.log` with Tailwind/Vite pre-transform errors resolving `tw… |
| BUG-20260612-003 | Resolved | User-reported statistics dashboard load failure: frontend requested `POST http://localhost:5777/api/v1/stat-dashboard/query`, and backend a… |
| BUG-20260615-001 | Resolved | 已登录后点击或进入诊断平台工作站时，Vue Router 报 `Failed to fetch dynamically imported module: http://localhost:5777/src/modules/doctor-workflow/views/Diagno… |
| BUG-20260615-002 | Resolved | 病理医嘱执行页截图反馈：页面仍展示上方“执行操作”卡片，医嘱列表含“医嘱号”列，且类型 `ROUTINE`、状态 `IN_PROGRESS`、收费状态 `SUCCESS` 原样显示英文。 |
| BUG-20260615-003 | Resolved | 归档管理 `/operation-support/archive` 的申请单、蜡块、玻片、标本归档列表中未归档状态显示为空；申请单归档列表/弹窗缺少申请医生、申请时间；借阅状态 `NONE` 原样显示英文；归档列表高度可能超出屏幕。后端核对：sibling backend `.… |

## Update Rules

- Record only concrete, reproducible, or user-reported bugs.
- When Resolved summaries exceed five rows, move older rows to `docs/reviews/bug-archive.md`.
- Open bugs keep full reproduction; archive keeps full detail.
