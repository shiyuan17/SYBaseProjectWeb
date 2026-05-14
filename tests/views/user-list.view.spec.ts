import ElementPlus from 'element-plus'
import { reactive } from 'vue'
import { mount } from '@vue/test-utils'

import UserListView from '@/modules/user-management/views/UserListView.vue'

const mockedStore = reactive({
  items: [] as Array<{
    id: string
    username: string
    displayName: string
    email: string
    status: 'active' | 'disabled'
    statusLabel: string
    createdAtLabel: string
  }>,
  filters: {
    keyword: '',
    status: 'all' as 'all' | 'active' | 'disabled'
  },
  page: 1,
  size: 10,
  total: 0,
  isLoading: false,
  isInitialized: true,
  errorMessage: null as string | null,
  isEmpty: false,
  applyFilters: vi.fn().mockResolvedValue(undefined),
  resetFilters: vi.fn().mockResolvedValue(undefined),
  retry: vi.fn().mockResolvedValue(undefined),
  changePage: vi.fn(),
  changePageSize: vi.fn()
})

vi.mock('@/modules/user-management/store/useUserListStore', () => ({
  useUserListStore: () => mockedStore
}))

function createWrapper() {
  return mount(UserListView, {
    global: {
      plugins: [ElementPlus]
    }
  })
}

describe('UserListView', () => {
  beforeEach(() => {
    mockedStore.items = []
    mockedStore.total = 0
    mockedStore.isLoading = false
    mockedStore.isInitialized = true
    mockedStore.errorMessage = null
    mockedStore.isEmpty = false
  })

  it('renders loading state', () => {
    mockedStore.isLoading = true

    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('正在加载用户列表')
  })

  it('renders empty state', () => {
    mockedStore.isEmpty = true

    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('暂无用户数据')
  })

  it('renders error state', () => {
    mockedStore.errorMessage = '列表服务异常'

    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('用户列表加载失败')
    expect(wrapper.text()).toContain('列表服务异常')
  })

  it('renders success summary', () => {
    mockedStore.items = [
      {
        id: 'u-001',
        username: 'ada',
        displayName: 'Ada Lovelace',
        email: 'ada@example.com',
        status: 'active',
        statusLabel: '启用',
        createdAtLabel: '2025/03/01 17:00:00'
      }
    ]
    mockedStore.total = 1

    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('当前共 1 条用户记录')
    expect(wrapper.text()).toContain('Ada Lovelace')
  })
})

