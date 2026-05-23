export interface WorkflowReferenceOption {
  label: string;
  value: string;
}

export interface WorkflowReferenceOptionsResponse {
  clinicalSymptoms: WorkflowReferenceOption[];
  collectionModes: WorkflowReferenceOption[];
  fixationLiquidTypes: WorkflowReferenceOption[];
  specimenTypes: WorkflowReferenceOption[];
}
