import { defineStore } from 'pinia'

import { normalizeErrorMessage } from '@/shared/utils/error'

import { fetchUserList } from '../api/userService'
import { mapUserListItem, type UserListItemViewModel, type UserListQuery, type UserQueryStatus } from '../types/userManagement'

interface UserListState {
  items: UserListItemViewModel[]
  filters: {
    keyword: string
    status: UserQueryStatus
  }
  page: number
  size: number
  total: number
  isLoading: boolean
  isInitialized: boolean
  errorMessage: string | null
  latestRequestId: number
}

function initialState(): UserListState {
  return {
    items: [],
    filters: {
      keyword: '',
      status: 'all'
    },
    page: 1,
    size: 10,
    total: 0,
    isLoading: false,
    isInitialized: false,
    errorMessage: null,
    latestRequestId: 0
  }
}

export const useUserListStore = defineStore('user-list', {
  state: (): UserListState => initialState(),
  getters: {
    isEmpty: (state) =>
      state.isInitialized && !state.isLoading && !state.errorMessage && state.items.length === 0
  },
  actions: {
    async fetchUsers(queryPatch: Partial<UserListQuery> = {}) {
      const requestId = this.latestRequestId + 1
      this.latestRequestId = requestId
      this.isLoading = true
      this.errorMessage = null

      const query: UserListQuery = {
        keyword: queryPatch.keyword ?? this.filters.keyword,
        status: queryPatch.status ?? this.filters.status,
        page: queryPatch.page ?? this.page,
        size: queryPatch.size ?? this.size
      }

      try {
        const response = await fetchUserList(query)

        if (requestId !== this.latestRequestId) {
          return
        }

        this.items = response.items.map(mapUserListItem)
        this.page = response.page
        this.size = response.size
        this.total = response.total
        this.filters.keyword = query.keyword
        this.filters.status = query.status
        this.isInitialized = true
      } catch (error) {
        if (requestId !== this.latestRequestId) {
          return
        }

        this.items = []
        this.total = 0
        this.errorMessage = normalizeErrorMessage(error, '加载用户列表失败')
        this.isInitialized = true
      } finally {
        if (requestId === this.latestRequestId) {
          this.isLoading = false
        }
      }
    },
    applyFilters(filters: Pick<UserListQuery, 'keyword' | 'status'>) {
      return this.fetchUsers({
        keyword: filters.keyword,
        status: filters.status,
        page: 1
      })
    },
    resetFilters() {
      return this.fetchUsers({
        keyword: '',
        status: 'all',
        page: 1
      })
    },
    changePage(page: number) {
      return this.fetchUsers({
        page
      })
    },
    changePageSize(size: number) {
      return this.fetchUsers({
        page: 1,
        size
      })
    },
    retry() {
      return this.fetchUsers()
    }
  }
})

