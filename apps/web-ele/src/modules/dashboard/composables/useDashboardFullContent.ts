import { onActivated, onBeforeUnmount, onDeactivated, onMounted } from 'vue';

import { getPreferences, updatePreferences } from '@vben/preferences';

export function useDashboardFullContent() {
  const snapshot = {
    contentCompact: getPreferences().app.contentCompact,
    contentPadding: getPreferences().app.contentPadding,
    contentPaddingBottom: getPreferences().app.contentPaddingBottom,
    contentPaddingLeft: getPreferences().app.contentPaddingLeft,
    contentPaddingRight: getPreferences().app.contentPaddingRight,
    contentPaddingTop: getPreferences().app.contentPaddingTop,
    layout: getPreferences().app.layout,
    footerEnable: getPreferences().footer.enable,
    headerHidden: getPreferences().header.hidden,
    sidebarHidden: getPreferences().sidebar.hidden,
    tabbarEnable: getPreferences().tabbar.enable,
  };

  const normalLayoutSnapshot =
    snapshot.layout !== 'full-content' &&
    !snapshot.headerHidden &&
    !snapshot.sidebarHidden &&
    snapshot.tabbarEnable;

  const restoredLayout = normalLayoutSnapshot ? snapshot.layout : 'sidebar-nav';

  function applyFullContent() {
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

  function restoreLayout() {
    updatePreferences({
      app: {
        contentCompact: snapshot.contentCompact,
        contentPadding: snapshot.contentPadding,
        contentPaddingBottom: snapshot.contentPaddingBottom,
        contentPaddingLeft: snapshot.contentPaddingLeft,
        contentPaddingRight: snapshot.contentPaddingRight,
        contentPaddingTop: snapshot.contentPaddingTop,
        layout: restoredLayout,
      },
      footer: {
        enable: snapshot.footerEnable,
      },
      header: {
        hidden: normalLayoutSnapshot ? snapshot.headerHidden : false,
      },
      sidebar: {
        hidden: normalLayoutSnapshot ? snapshot.sidebarHidden : false,
      },
      tabbar: {
        enable: normalLayoutSnapshot ? snapshot.tabbarEnable : true,
      },
    });
  }

  onMounted(() => {
    applyFullContent();
  });

  onActivated(() => {
    applyFullContent();
  });

  onDeactivated(() => {
    restoreLayout();
  });

  onBeforeUnmount(() => {
    restoreLayout();
  });

  return {
    restoreLayout,
  };
}
