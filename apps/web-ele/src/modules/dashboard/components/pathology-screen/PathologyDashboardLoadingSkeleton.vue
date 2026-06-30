<template>
  <div class="pathology-loading" data-testid="pathology-loading">
    <div class="pathology-loading__card pathology-loading__card--skeleton">
      <h2>病理大屏数据加载中</h2>
      <p>正在汇总病例、报告、技术质控与工作量指标。</p>
      <div class="pathology-loading__skeleton">
        <span
          class="pathology-loading__bar pathology-loading__bar--wide"
        ></span>
        <span class="pathology-loading__bar"></span>
        <span class="pathology-loading__bar"></span>
        <span
          class="pathology-loading__bar pathology-loading__bar--narrow"
        ></span>
      </div>
    </div>
  </div>
</template>
