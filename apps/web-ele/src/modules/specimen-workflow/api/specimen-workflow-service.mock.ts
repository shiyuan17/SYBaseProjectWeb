import { resetApplicationRegistrationWorkbenchMockState } from './application-registration-workbench-mock';
import { resetSpecimenWorkflowMockState } from './internal/specimen-workflow-mock-gateway';

export function resetMockState() {
  resetApplicationRegistrationWorkbenchMockState();
  resetSpecimenWorkflowMockState();
}
