export type UserQueryStatus = 'all' | 'active' | 'disabled'

export interface UserListQuery {
  keyword: string
  status: UserQueryStatus
  page: number
  size: number
}

export interface UserListItemDto {
  id: string
  username: string
  fullName: string
  email: string
  status: Exclude<UserQueryStatus, 'all'>
  createdAt: string
}

export interface UserListItemViewModel {
  id: string
  username: string
  displayName: string
  email: string
  status: Exclude<UserQueryStatus, 'all'>
  statusLabel: string
  createdAtLabel: string
}

export function mapUserListItem(dto: UserListItemDto): UserListItemViewModel {
  return {
    id: dto.id,
    username: dto.username,
    displayName: dto.fullName,
    email: dto.email,
    status: dto.status,
    statusLabel: dto.status === 'active' ? '启用' : '禁用',
    createdAtLabel: new Date(dto.createdAt).toLocaleString('zh-CN', {
      hour12: false
    })
  }
}

