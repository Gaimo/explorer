export interface FileMetadata {
  path: string;
  note: string;
  tags: string[];
}

export interface MetadataSummary {
  path: string;
  hasNote: boolean;
  tagCount: number;
}
