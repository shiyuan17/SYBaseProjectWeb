<script setup lang="ts">
import type {
  ConsultationParticipantInput,
  ConsultationSummary,
  DiagnosticWorkbenchView,
} from '../types/doctor-workflow';

import { computed, reactive, ref } from 'vue';

import {
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  commentConsultationParticipant,
  completeConsultation,
  createConsultation,
} from '../api/doctor-workflow-service';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatConsultationStatus,
  formatDateTime,
  formatNullable,
} from '../utils/format';

const props = defineProps<{
  workbench: DiagnosticWorkbenchView | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const operating = ref(false);
const participantUserIdInput = ref('');
const selectedConsultationId = ref('');
const consultationForm = reactive({
  opinion: '',
  participantId: '',
  purpose: '',
});
const createParticipants = ref<ConsultationParticipantInput[]>([]);

const participantOptions = computed(() => {
  const selected = props.workbench?.consultations.find(
    (item) => item.consultationId === selectedConsultationId.value,
  );
  return selected?.participants ?? [];
});

function addParticipant() {
  const participantUserId = participantUserIdInput.value.trim();
  if (!participantUserId) {
    ElMessage.warning('请输入会诊人账号');
    return;
  }

  if (
    createParticipants.value.some(
      (item) => item.participantUserId === participantUserId,
    )
  ) {
    ElMessage.warning('该会诊人已添加');
    return;
  }

  createParticipants.value.push({
    participantName: participantUserId,
    participantRole: 'MEMBER',
    participantUserId,
  });
  participantUserIdInput.value = '';
}

function removeParticipant(participantUserId: string) {
  createParticipants.value = createParticipants.value.filter(
    (item) => item.participantUserId !== participantUserId,
  );
}

async function submitConsultation() {
  if (!props.workbench?.caseId) {
    ElMessage.warning('请先选择病例');
    return;
  }
  if (createParticipants.value.length === 0) {
    ElMessage.warning('请至少添加一名会诊人');
    return;
  }

  operating.value = true;
  try {
    await createConsultation({
      caseId: props.workbench.caseId,
      participants: createParticipants.value,
      remarks: consultationForm.purpose.trim() || undefined,
    });
    ElMessage.success('会诊申请已提交');
    consultationForm.purpose = '';
    createParticipants.value = [];
    emit('refresh');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

function handleConsultationChange(value: string) {
  selectedConsultationId.value = value;
  consultationForm.participantId = '';
  consultationForm.opinion = '';
}

function handleParticipantChange(participantId: string) {
  const selected = participantOptions.value.find(
    (item) => item.participantId === participantId,
  );
  consultationForm.opinion = selected?.opinion ?? '';
}

async function saveConsultationOpinion() {
  if (!selectedConsultationId.value || !consultationForm.participantId.trim()) {
    ElMessage.warning('请选择会诊记录和填写人');
    return;
  }
  if (!consultationForm.opinion.trim()) {
    ElMessage.warning('请输入会诊意见');
    return;
  }

  operating.value = true;
  try {
    await commentConsultationParticipant(
      selectedConsultationId.value,
      consultationForm.participantId.trim(),
      {
        opinion: consultationForm.opinion.trim(),
      },
    );
    ElMessage.success('会诊意见已保存');
    emit('refresh');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

async function completeSelectedConsultation(consultation: ConsultationSummary) {
  operating.value = true;
  try {
    await completeConsultation(consultation.consultationId, {
      opinion: consultation.opinion?.trim() || consultationForm.opinion.trim(),
      remarks: consultationForm.purpose.trim() || undefined,
    });
    ElMessage.success('会诊已完成');
    emit('refresh');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <ElEmpty v-if="!workbench" description="请先从左侧选择病例" />

    <template v-else>
      <section class="rounded border border-border p-3">
        <div class="mb-2 text-sm font-semibold text-foreground">
          发起会诊申请
        </div>
        <ElForm label-width="88px">
          <ElFormItem label="会诊目的">
            <ElInput
              v-model="consultationForm.purpose"
              data-testid="workbench-consultation-purpose"
              placeholder="会诊目的将写入会诊备注"
            />
          </ElFormItem>
          <ElFormItem label="会诊人">
            <div class="flex w-full gap-2">
              <ElInput
                v-model="participantUserIdInput"
                data-testid="workbench-consultation-participant-input"
                placeholder="输入会诊人账号后添加"
              />
              <ElButton
                :disabled="operating"
                data-testid="workbench-consultation-add-participant"
                @click="addParticipant"
              >
                添加
              </ElButton>
            </div>
          </ElFormItem>
          <ElFormItem label="会诊列表">
            <div class="flex w-full flex-wrap gap-2">
              <span
                v-for="participant in createParticipants"
                :key="participant.participantUserId"
                class="inline-flex items-center gap-2 rounded border border-border px-2 py-1 text-xs"
              >
                {{ participant.participantName }}
                <button
                  class="text-danger"
                  type="button"
                  @click="removeParticipant(participant.participantUserId)"
                >
                  移除
                </button>
              </span>
              <span
                v-if="createParticipants.length === 0"
                class="text-xs text-muted-foreground"
              >
                暂未添加会诊人
              </span>
            </div>
          </ElFormItem>
          <div class="flex justify-center">
            <ElButton
              :loading="operating"
              type="warning"
              data-testid="workbench-consultation-submit"
              @click="submitConsultation"
            >
              提交会诊申请
            </ElButton>
          </div>
        </ElForm>
      </section>

      <section class="rounded border border-border p-3">
        <div class="mb-2 text-sm font-semibold text-foreground">
          填写会诊意见
        </div>
        <ElForm label-width="88px">
          <ElFormItem label="会诊记录">
            <ElSelect
              :model-value="selectedConsultationId"
              class="w-full"
              data-testid="workbench-consultation-select"
              placeholder="请选择会诊记录"
              @update:model-value="handleConsultationChange"
            >
              <ElOption
                v-for="consultation in workbench.consultations"
                :key="consultation.consultationId"
                :label="`${formatNullable(consultation.requestedByName)} / ${formatConsultationStatus(consultation.status)}`"
                :value="consultation.consultationId"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="当前填写人">
            <ElSelect
              v-model="consultationForm.participantId"
              class="w-full"
              data-testid="workbench-consultation-participant-select"
              placeholder="请选择填写人"
              @change="handleParticipantChange"
            >
              <ElOption
                v-for="participant in participantOptions"
                :key="participant.participantId"
                :label="formatNullable(participant.participantName)"
                :value="participant.participantId"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="会诊意见">
            <ElInput
              v-model="consultationForm.opinion"
              :rows="4"
              data-testid="workbench-consultation-opinion"
              placeholder="请输入会诊意见"
              type="textarea"
            />
          </ElFormItem>
          <div class="flex justify-center">
            <ElButton
              :loading="operating"
              data-testid="workbench-consultation-save-opinion"
              type="primary"
              @click="saveConsultationOpinion"
            >
              意见代写
            </ElButton>
          </div>
        </ElForm>
      </section>

      <section class="rounded border border-border p-3">
        <div class="mb-2 text-sm font-semibold text-foreground">查看会诊</div>
        <div
          v-if="workbench.consultations.length === 0"
          class="text-sm text-muted-foreground"
        >
          暂无会诊记录
        </div>
        <div v-else class="flex flex-col gap-3">
          <article
            v-for="consultation in workbench.consultations"
            :key="consultation.consultationId"
            class="rounded border border-border px-3 py-2"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="text-sm font-medium text-foreground">
                {{ formatNullable(consultation.requestedByName) }}
                <span class="ml-2 text-xs text-muted-foreground">
                  {{ formatConsultationStatus(consultation.status) }}
                </span>
              </div>
              <ElButton
                v-if="consultation.status !== 'COMPLETED'"
                :loading="operating"
                link
                type="primary"
                @click="completeSelectedConsultation(consultation)"
              >
                完成会诊
              </ElButton>
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              时间: {{ formatDateTime(consultation.requestedAt) }}
            </div>
            <div class="mt-2 text-sm">
              参与人:
              {{
                (consultation.participants ?? [])
                  .map(
                    (item: { participantName?: null | string }) =>
                      item.participantName,
                  )
                  .filter(Boolean)
                  .join('、') || '-'
              }}
            </div>
            <div class="mt-2 text-sm">
              会诊意见: {{ formatNullable(consultation.opinion) }}
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
