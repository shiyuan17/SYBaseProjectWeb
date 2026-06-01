# Database 资料索引

## 说明

本目录归档数据库联调与表结构资料，作为前后端字段对照和历史资料入口。

## 文件清单

- [病理基础数据表.sql](./病理基础数据表.sql)
- [病理基础数据表_V0.1.sql](./病理基础数据表_V0.1.sql)

## 推荐阅读顺序

1. 优先查看 `病理基础数据表.sql` 作为当前主要整理结果。
2. 需要对照历史版本时，再查看 `病理基础数据表_V0.1.sql`。

## 与其他目录的关系

- 业务模块背景可结合 [../detailed_list/README.md](../detailed_list/README.md) 阅读。
- 如需查看前端结构分析，可参考 [../UNDERSTAND_ANYTHING_ANALYSIS_ZH.md](../UNDERSTAND_ANYTHING_ANALYSIS_ZH.md)。

## 维护约定

- `scripts/` 目录只存放可执行脚本，不放纯资料型 SQL。
- 新增数据库资料时，优先保留在本目录并同步更新本索引，而不是在根 `README.md` 中直链单个 SQL 文件。
