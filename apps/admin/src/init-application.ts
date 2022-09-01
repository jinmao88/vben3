import { initRequest } from '@vben/request'
import { message, Modal } from 'ant-design-vue'
import { useUserStoreWithout } from '@/store/user'
import { useI18n, useLocale } from '@vben/locale'
import { deepMerge, getGlobalConfig } from '@vben/utils'
import { useAppStoreWithOut } from '@/store/config'
import { projectSetting } from './settng'
import { initComp } from '@vben/vbencomponents'
import { localeList } from '@vben/locale/src/config'

// To decouple the modules below `packages/*`, they no longer depend on each other
// If the modules are heavily dependent on each other, you need to provide a decoupling method, and the caller will pass the parameters
// Each module needs to provide `bridge` file as a decoupling method

// 为了解耦 `packages/*` 下面各模块，不再相互依赖
// 如果模块相互依赖严重，则需要对外提供解耦方式，由调用方去进行参数传递
// 各个模块需要提供 `bridge` 文件作为解耦方式
async function initPackages() {
  const _initRequest = async () => {
    const { apiUrl } = getGlobalConfig(import.meta.env)
    const { t } = useI18n()
    await initRequest(() => {
      return {
        apiUrl,
        getTokenFunction: () => {
          const userStore = useUserStoreWithout()
          return userStore.getAccessToken
        },
        errorFunction: message.error,
        errorModalFunction: Modal.error,
        timeoutFunction: () => {
          const userStore = useUserStoreWithout()
          userStore.setAccessToken(undefined)
          userStore.logout(true)
        },
        unauthorizedFunction: (msg?: string) => {
          const userStore = useUserStoreWithout()
          userStore.setAccessToken(undefined)
          userStore.logout(true)
          return msg || t('sys.api.errMsg401')
        },
        handleErrorFunction: (msg, mode) => {
          if (mode === 'modal') {
            Modal.error({ title: t('sys.api.errorTip'), content: msg })
          } else if (mode === 'message') {
            message.error(msg)
          }
        },
      }
    })
  }

  const _initComp = async () => {
    await initComp(() => {
      return {
        useLocale,
        localeList,
      }
    })
  }

  await Promise.all([_initRequest(), _initComp()])
}

// Initial project configuration
function initAppConfigStore() {
  const appStore = useAppStoreWithOut()
  const projectConfig = appStore.getProjectConfig
  const projCfg = deepMerge(projectSetting, projectConfig || {})

  appStore.setProjectConfig(projCfg)
}

export async function initApplication() {
  // ! Need to pay attention to the timing of execution
  // ! 需要注意调用时机
  await initPackages()

  // Initialize internal system configuration
  initAppConfigStore()
}
