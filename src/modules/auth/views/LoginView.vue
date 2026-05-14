<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>

          <ElForm
            ref="formRef"
            :key="formKey"
            :model="formData"
            :rules="rules"
            style="margin-top: 25px"
            @keyup.enter="handleSubmit"
          >
            <ElFormItem prop="account">
              <ElSelect v-model="formData.account" @change="setupAccount">
                <ElOption
                  v-for="account in accounts"
                  :key="account.key"
                  :label="account.label"
                  :value="account.key"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem prop="username">
              <ElInput
                v-model.trim="formData.username"
                autocomplete="username"
                class="custom-height"
                :placeholder="$t('login.placeholder.username')"
              />
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                v-model.trim="formData.password"
                autocomplete="current-password"
                class="custom-height"
                :placeholder="$t('login.placeholder.password')"
                show-password
                type="password"
              />
            </ElFormItem>

            <div class="relative pb-5 mt-6">
              <div
                class="relative z-[2] overflow-hidden select-none rounded-lg border border-transparent tad-300"
                :class="{ '!border-[#FF4E4F]': !isPassing && isClickPass }"
              >
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  :background="isDark ? '#26272F' : '#F1F1F4'"
                  handler-bg="var(--default-box-color)"
                  progress-bar-bg="var(--main-color)"
                  :success-text="$t('login.sliderSuccessText')"
                  :text="$t('login.sliderText')"
                  text-color="var(--art-gray-700)"
                />
              </div>
              <p
                class="absolute top-0 z-[1] px-px mt-2 text-xs text-[#f56c6c] tad-300"
                :class="{ 'translate-y-10': !isPassing && isClickPass }"
              >
                {{ $t('login.placeholder.slider') }}
              </p>
            </div>

            <div class="flex-cb mt-2 text-sm">
              <ElCheckbox v-model="formData.rememberPassword">
                {{ $t('login.rememberPwd') }}
              </ElCheckbox>
              <span class="text-g-500">admin / admin123</span>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                v-ripple
                class="w-full custom-height"
                :loading="loading"
                type="primary"
                @click="handleSubmit"
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElNotification, type FormInstance, type FormRules } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'

  import AppConfig from '@/config'
  import { ROUTE_NAMES } from '@/router/route-names'
  import { seedArtMenu } from '@/router/art-menu'
  import { normalizeErrorMessage } from '@/shared/utils/error'
  import { useSettingStore } from '@/store/modules/setting'
  import { useUserStore } from '@/store/modules/user'
  import { useSessionStore } from '@/stores/session'

  defineOptions({ name: 'LoginView' })

  type AccountKey = 'admin'

  interface Account {
    key: AccountKey
    label: string
    userName: string
    password: string
  }

  const route = useRoute()
  const router = useRouter()
  const { t, locale } = useI18n()
  const sessionStore = useSessionStore()
  const userStore = useUserStore()
  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)

  const formRef = ref<FormInstance>()
  const dragVerify = ref()
  const formKey = ref(0)
  const loading = ref(false)
  const isPassing = ref(false)
  const isClickPass = ref(false)

  const accounts = computed<Account[]>(() => [
    {
      key: 'admin',
      label: '系统管理员',
      userName: 'admin',
      password: 'admin123'
    }
  ])

  const formData = reactive({
    account: 'admin' as AccountKey,
    username: 'admin',
    password: 'admin123',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: t('login.placeholder.username'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }]
  }))

  watch(locale, () => {
    formKey.value += 1
  })

  const setupAccount = (key: AccountKey) => {
    const selectedAccount = accounts.value.find((account) => account.key === key)
    formData.account = key
    formData.username = selectedAccount?.userName ?? ''
    formData.password = selectedAccount?.password ?? ''
  }

  const resetDragVerify = () => {
    dragVerify.value?.reset()
    isPassing.value = false
    isClickPass.value = false
  }

  const showLoginSuccessNotice = () => {
    ElNotification({
      title: t('login.success.title'),
      type: 'success',
      duration: 2500,
      zIndex: 10000,
      message: `${t('login.success.message')}, ${AppConfig.systemInfo.name}!`
    })
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    const valid = await formRef.value.validate()
    if (!valid) return

    if (!isPassing.value) {
      isClickPass.value = true
      return
    }

    loading.value = true

    try {
      await sessionStore.login({
        username: formData.username,
        password: formData.password
      })
      userStore.syncFromSession(sessionStore)
      seedArtMenu()

      const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : ''

      await router.replace(redirectPath || { name: ROUTE_NAMES.dashboard })
      showLoginSuccessNotice()
    } catch (error) {
      ElMessage.error(normalizeErrorMessage(error, '登录失败，请检查账号信息'))
    } finally {
      loading.value = false
      resetDragVerify()
    }
  }
</script>

<style scoped>
  @import '@views/auth/login/style.css';
</style>

<style lang="scss" scoped>
  :deep(.el-select__wrapper) {
    height: 40px !important;
  }
</style>
