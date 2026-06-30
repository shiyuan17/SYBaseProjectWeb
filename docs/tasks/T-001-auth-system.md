# T-001 Auth System

## Goal

实现用户登录 / 注册 / JWT认证

## Inputs

- email
- password

## Outputs

- JWT token
- refresh token

## Constraints

- Must follow API_SPEC.md
- Must not modify DB schema without migration

## Acceptance Criteria

- login success returns token
- invalid password returns 401
- test coverage ≥ 80%
