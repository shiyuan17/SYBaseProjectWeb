export interface WorkflowReferenceOption {
  label: string;
  value: string;
}

export interface WorkflowReferenceOptionsResponse {
  clinicalSymptoms: WorkflowReferenceOption[];
  collectionModes: WorkflowReferenceOption[];
  containerNames: WorkflowReferenceOption[];
  cutSurfaceFeatures: WorkflowReferenceOption[];
  fixationLiquidTypes: WorkflowReferenceOption[];
  marginMarkings: WorkflowReferenceOption[];
  specimenImageSizes: WorkflowReferenceOption[];
  specimenTypes: WorkflowReferenceOption[];
}
