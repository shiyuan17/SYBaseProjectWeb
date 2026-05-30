import type {
  VxeGridInstance,
  VxeGridListeners,
  VxeGridPropTypes,
  VxeGridProps as VxeTableGridProps,
  VxeUIExport,
} from 'vxe-table';

import type { Ref } from 'vue';

import type { ClassType, DeepPartial } from '@vben/types';

import type {
  BaseFormComponentType,
  ExtendedFormApi,
  useVbenForm,
  VbenFormProps,
} from '@vben-core/form-ui';

export interface VxePaginationInfo {
  currentPage: number;
  pageSize: number;
  total: number;
}

interface ToolbarConfigOptions extends VxeGridPropTypes.ToolbarConfig {
  /** 是否显示切换搜索表单的按钮 */
  search?: boolean;
}

export type VxeTableGridColumns<T = any> = VxeTableGridOptions<T>['columns'];

export interface VxeTableGridOptions<T = any> extends VxeTableGridProps<T> {
  /** 工具栏配置 */
  toolbarConfig?: ToolbarConfigOptions;
}

export interface SeparatorOptions {
  show?: boolean;
  backgroundColor?: string;
}

export interface VxeGridProps<
  T extends Record<string, any> = any,
  D extends BaseFormComponentType = BaseFormComponentType,
  P extends Record<string, any> = Record<never, never>,
> {
  /**
   * 数据
   */
  tableData?: any[];
  /**
   * 标题
   */
  tableTitle?: string;
  /**
   * 标题帮助
   */
  tableTitleHelp?: string;
  /**
   * 组件class
   */
  class?: ClassType;
  /**
   * vxe-grid class
   */
  gridClass?: ClassType;
  /**
   * vxe-grid 配置
   */
  gridOptions?: DeepPartial<VxeTableGridOptions<T>>;
  /**
   * vxe-grid 事件
   */
  gridEvents?: DeepPartial<VxeGridListeners<T>>;
  /**
   * 表单配置
   */
  formOptions?: VbenFormProps<D, P>;
  /**
   * 显示搜索表单
   */
  showSearchForm?: boolean;
  /**
   * 搜索表单与表格主体之间的分隔条
   */
  separator?: boolean | SeparatorOptions;
}

export interface VxeGridApiLike<
  T extends Record<string, any> = any,
  D extends BaseFormComponentType = BaseFormComponentType,
  P extends Record<string, any> = Record<never, never>,
> {
  formApi: ExtendedFormApi;
  grid: VxeGridInstance<T>;
  state: null | VxeGridProps<T, D, P>;
  mount: (
    instance: null | VxeGridInstance<T>,
    formApi: ExtendedFormApi,
  ) => void;
  query: (params?: Record<string, any>) => Promise<void>;
  reload: (params?: Record<string, any>) => Promise<void>;
  setGridOptions: (
    options: Partial<VxeGridProps<T, D, P>['gridOptions']>,
  ) => void;
  setLoading: (isLoading: boolean) => void;
  setState: (
    stateOrFn:
      | ((prev: VxeGridProps<T, D, P>) => Partial<VxeGridProps<T, D, P>>)
      | Partial<VxeGridProps<T, D, P>>,
  ) => void;
  toggleSearchForm: (show?: boolean) => boolean | undefined;
  unmount: () => void;
}

export type ExtendedVxeGridApi<
  D extends Record<string, any> = any,
  F extends BaseFormComponentType = BaseFormComponentType,
  P extends Record<string, any> = Record<never, never>,
> = VxeGridApiLike<D, F, P> & {
  useStore: <S = NoInfer<VxeGridProps<D, F, P>>>(
    selector?: (state: NoInfer<VxeGridProps<D, F, P>>) => S,
  ) => Readonly<Ref<S>>;
};

export interface SetupVxeTable {
  configVxeTable: (ui: VxeUIExport) => void;
  useVbenForm?: typeof useVbenForm;
}
