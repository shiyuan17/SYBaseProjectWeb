import { getPreferences, updatePreferences } from '@vben/preferences';

type DashboardLayoutSnapshot = {
  contentCompact: ReturnType<typeof getPreferences>['app']['contentCompact'];
  contentPadding: number;
  contentPaddingBottom: number;
  contentPaddingLeft: number;
  contentPaddingRight: number;
  contentPaddingTop: number;
  footerEnable: boolean;
  headerHidden: boolean;
  layout: ReturnType<typeof getPreferences>['app']['layout'];
  sidebarHidden: boolean;
  tabbarEnable: boolean;
};

let activeLayoutSnapshot: DashboardLayoutSnapshot | null = null;

function captureLayoutSnapshot(): DashboardLayoutSnapshot {
  const preferences = getPreferences();

  return {
    contentCompact: preferences.app.contentCompact,
    contentPadding: preferences.app.contentPadding,
    contentPaddingBottom: preferences.app.contentPaddingBottom,
    contentPaddingLeft: preferences.app.contentPaddingLeft,
    contentPaddingRight: preferences.app.contentPaddingRight,
    contentPaddingTop: preferences.app.contentPaddingTop,
    footerEnable: preferences.footer.enable,
    headerHidden: preferences.header.hidden,
    layout: preferences.app.layout,
    sidebarHidden: preferences.sidebar.hidden,
    tabbarEnable: preferences.tabbar.enable,
  };
}

function resolveRestoredLayout(snapshot: DashboardLayoutSnapshot) {
  const normalLayoutSnapshot =
    snapshot.layout !== 'full-content' &&
    !snapshot.headerHidden &&
    !snapshot.sidebarHidden &&
    snapshot.tabbarEnable;

  return {
    layout: normalLayoutSnapshot ? snapshot.layout : 'sidebar-nav',
    headerHidden: normalLayoutSnapshot ? snapshot.headerHidden : false,
    sidebarHidden: normalLayoutSnapshot ? snapshot.sidebarHidden : false,
    tabbarEnable: normalLayoutSnapshot ? snapshot.tabbarEnable : true,
  };
}

/**
 * 在进入病理大屏路由前应用全屏布局。须由路由守卫调用，勿在组件生命周期内同步触发。
 */
export function applyDashboardFullContent() {
  if (activeLayoutSnapshot) {
    return;
  }

  activeLayoutSnapshot = captureLayoutSnapshot();

  updatePreferences({
    app: {
      contentCompact: 'wide',
      contentPadding: 0,
      contentPaddingBottom: 0,
      contentPaddingLeft: 0,
      contentPaddingRight: 0,
      contentPaddingTop: 0,
      layout: 'full-content',
    },
    footer: {
      enable: false,
    },
    header: {
      hidden: true,
    },
    sidebar: {
      hidden: true,
    },
    tabbar: {
      enable: false,
    },
  });
}

/**
 * 离开病理大屏路由时恢复布局。须由路由守卫调用，勿在组件内于 router.push 之前同步触发。
 */
export function restoreDashboardLayout() {
  const snapshot = activeLayoutSnapshot;
  if (!snapshot) {
    return;
  }

  activeLayoutSnapshot = null;

  const restoredLayout = resolveRestoredLayout(snapshot);

  updatePreferences({
    app: {
      contentCompact: snapshot.contentCompact,
      contentPadding: snapshot.contentPadding,
      contentPaddingBottom: snapshot.contentPaddingBottom,
      contentPaddingLeft: snapshot.contentPaddingLeft,
      contentPaddingRight: snapshot.contentPaddingRight,
      contentPaddingTop: snapshot.contentPaddingTop,
      layout: restoredLayout.layout,
    },
    footer: {
      enable: snapshot.footerEnable,
    },
    header: {
      hidden: restoredLayout.headerHidden,
    },
    sidebar: {
      hidden: restoredLayout.sidebarHidden,
    },
    tabbar: {
      enable: restoredLayout.tabbarEnable,
    },
  });
}
